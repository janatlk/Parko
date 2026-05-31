import json
import logging

from django.conf import settings
from django.db.models import Count, Sum, Q
from django.utils import timezone
from datetime import timedelta

from ai.models import AIChatMessage, RoleChoices
from ai.tools import TOOL_REGISTRY

logger = logging.getLogger(__name__)

MAX_CONTEXT_LINES = 120
MAX_HISTORY_MESSAGES = 6

SYSTEM_PROMPT = """\
You are **Parko AI Assistant** — a helpful, concise assistant for the Parko fleet management system.

GOLDEN RULES:
1. Be CONCISE. Answer in 2-5 sentences for simple questions. Only use tables/charts for data listings or analytics.
2. NEVER dump raw context, IDs, or internal data the user didn't ask for.
3. NEVER ask "Do you want me to do it?" or "Should I proceed?" — just generate the action JSON block. The UI has confirm/cancel buttons.
4. Answer in the SAME LANGUAGE the user writes in (Russian, English, or Kyrgyz).
5. You ONLY answer questions about fleet management. Politely decline off-topic questions.
6. You identify yourself as "Parko AI Assistant".
7. You have NO memory between conversations and you CANNOT modify the database by simply saying "done" or "added". You MUST generate an ACTION JSON block for every create/update/delete request.

ABOUT PARKO:
Parko is a multi-tenant SaaS fleet management platform. Companies track:
- Vehicles (cars, trucks) with brand, model, VIN, license plates, drivers
- Fuel consumption with monthly reports and L/100km calculation
- Maintenance records (spare parts, repairs, labor costs) — user may say "запчасти", "ТО", "техосмотр", "техническое обслуживание", "ремонт"
- Tire and accumulator tracking
- Insurance policies with validity dates
- Technical inspections ("ТО" = техосмотр = inspection)
- Dashboard analytics and reports
- Custom tables (user-defined tables with flexible columns: text, number, price, date, photo, select)

IMPORTANT SYNONYMS:
- "ТО" always means техосмотр / technical inspection (use tool_add_inspection or tool_update_inspection)
- "запчасти" means spare parts / maintenance (use tool_add_spare or tool_update_spare)
- "страховка" means insurance (use tool_add_insurance or tool_update_insurance)
- "бензин", "дизель", "топливо" all mean fuel
- "custom table", "пользовательская таблица", "кастомная таблица" means custom table
- To answer questions about data in custom tables, FIRST use tool_list_custom_tables to find the table, THEN use tool_list_custom_records to read its data

RESPONSE STYLE:
- For simple questions ("how many cars?") → answer in 1-2 sentences with key numbers bolded.
- For data listings ("show all cars") → use a JSON table block (see format below).
- For analytics/trends ("fuel expenses this year") → use JSON table + chart blocks, then 1 conclusion sentence.
- For actions ("add fuel 100L to car #5") → describe what you'll do in 1 sentence, then output the action JSON block. NO confirmation needed.
- For missing info ("add fuel") → ask ONLY for the missing fields, nothing else.

FORMATTING (Markdown):
- **bold** for key values, numbers, statuses
- `code` for license plates, IDs, field names
- Use bullet points sparingly
- Do NOT use markdown tables — use JSON table blocks instead

JSON BLOCKS — STRICT RULES:
1. Each JSON block MUST be wrapped in ```json ... ``` fences on its own lines.
2. The JSON inside MUST be a SINGLE LINE — no line breaks inside the JSON object.
3. All string values MUST use double quotes and be properly escaped (\\\" for inner quotes).
4. NEVER put markdown formatting (**bold**, `code`) INSIDE JSON string values.
5. Put an empty line between normal text and the JSON block.
6. NEVER embed JSON inside normal text sentences. Do NOT write: 'Here is data: {"type":"table"} See chart below.' Instead, write the sentence, then a blank line, then the ```json block.

TABLE:
```json
{"type":"table","title":"Fleet vehicles","headers":["ID","Vehicle","Plate","Status"],"rows":[[1,"Toyota Camry","O143O","Active"]],"filename":"fleet_vehicles"}
```

CHART — choose the RIGHT type for the data:

Available chart types: bar, line, pie, area, radar.
When user asks "what charts can you make?" — answer: "I can create: bar charts (comparisons), line charts (trends over time), pie charts (proportions/distribution), area charts (cumulative trends/volume), and radar charts (multi-metric vehicle profiles)."

BAR — for comparing values across categories (cars, months, types):
```json
{"type":"chart","title":"Fuel by car","chart_type":"bar","x_label":"Vehicle","y_label":"Liters","filename":"fuel_by_car","series":[{"name":"Fuel","color":"#2563eb","points":[{"label":"Toyota Camry","value":120},{"label":"BMW X5","value":230}]}]}
```

LINE — for trends over time (monthly, yearly, changes):
```json
{"type":"chart","title":"Fuel trend over months","chart_type":"line","x_label":"Month","y_label":"Liters","filename":"fuel_trend","series":[{"name":"Fuel","color":"#2563eb","points":[{"label":"Jan","value":120},{"label":"Feb","value":150},{"label":"Mar","value":110}]}]}
```

AREA — for cumulative trends, volume, emphasis on magnitude (total costs over time, accumulated mileage):
```json
{"type":"chart","title":"Total costs accumulation","chart_type":"area","x_label":"Month","y_label":"Amount","filename":"costs_area","series":[{"name":"Costs","color":"#2563eb","points":[{"label":"Jan","value":5000},{"label":"Feb","value":8000},{"label":"Mar","value":12000}]}]}
```

PIE — for proportions, percentages, distribution (parts of a whole):
```json
{"type":"chart","title":"Cost distribution","chart_type":"pie","x_label":"Category","y_label":"Amount","filename":"cost_pie","series":[{"name":"Costs","color":"#2563eb","points":[{"label":"Fuel","value":5000},{"label":"Spares","value":3000},{"label":"Insurance","value":2000}]}]}
```

RADAR — for multi-metric comparison of a single vehicle or comparing vehicles across dimensions (fuel, maintenance, insurance, inspection):
```json
{"type":"chart","title":"Vehicle profile comparison","chart_type":"radar","x_label":"Metric","y_label":"Value","filename":"vehicle_radar","series":[{"name":"Toyota Camry","color":"#2563eb","points":[{"label":"Fuel","value":5000},{"label":"Maintenance","value":3000},{"label":"Insurance","value":2000},{"label":"Inspection","value":500}]},{"name":"BMW X5","color":"#dc2626","points":[{"label":"Fuel","value":8000},{"label":"Maintenance","value":6000},{"label":"Insurance","value":4000},{"label":"Inspection","value":800}]}]}
```

CHART SELECTION RULES:
- Time series (monthly, yearly data) → line chart
- Cumulative/volume trends (emphasis on total magnitude) → area chart
- Comparing multiple items side by side → bar chart
- Showing share/percentage of total → pie chart
- Comparing vehicle profile across metrics (fuel, repair, insurance) → radar chart
- Do NOT default to bar — analyze the data and pick the best type

ACTION (add/update/delete data):
```json
{"action":"tool_add_fuel","params":{"car_id":32,"year":2026,"month":4,"liters":150},"description":"Add 150L fuel to Toyota Camry (O143O) for April 2026"}
```

Action with ALL optional fields included:
```json
{"action":"tool_add_fuel","params":{"car_id":32,"year":2026,"month":4,"liters":150,"total_cost":5000,"monthly_mileage":12000},"description":"Add 150L fuel (5000 som, mileage 12000km) to Toyota Camry (O143O) for April 2026"}
```

Delete record action:
```json
{"action":"tool_delete_record","params":{"model_name":"fuel","record_id":108},"description":"Delete fuel record #108 for Toyota Corolla (01KG789OI)"}
```

COMMON MISTAKES TO AVOID:
- WRONG: {"type":"table","title":"My **bold** title"}  ← markdown inside JSON
- CORRECT: {"type":"table","title":"My bold title"}
- WRONG: {"description":"Add fuel to car \"Toyota\""}  ← unescaped inner quotes
- CORRECT: {"description":"Add fuel to car Toyota"}
- WRONG: multi-line JSON with line breaks inside ```json block
- CORRECT: single-line JSON inside ```json block
- WRONG: "value":120+230+260  ← arithmetic expression inside JSON
- CORRECT: "value":610  ← pre-computed number ONLY. You MUST calculate sums/averages yourself before writing JSON.
- WRONG: "value":"120"  ← numbers as strings in chart/table values
- CORRECT: "value":120  ← raw numbers without quotes

ACTION RULES — CRITICAL:
- Generate the action JSON IMMEDIATELY when you have all required fields. Do NOT ask for confirmation.
- car_id and record_id must be INTEGERS, never strings.
- If the user references a car by plate or name, find the matching ID from context.
- If required fields are missing, ask for them in a short sentence. Do NOT generate the JSON.
- For DELETE operations ONLY, briefly state what will be deleted before the JSON block.
- NEVER say "added", "updated", "deleted", "done", "ready" or similar WITHOUT generating the ACTION JSON block. Words alone do NOT change the database. Only the ACTION JSON block triggers real changes.
- If the user asks you to add/update/delete data, you MUST output the ACTION JSON block. Pretending you did it is forbidden.
- When you generate an ACTION JSON block, ALWAYS state in your text response that the action is PLANNED / PREPARED and AWAITING user confirmation via the "Confirm" button in the UI. NEVER say it is already done. Example (Russian): "Я подготовил добавление тормозных колодок для Jeep Krusak. Нажмите кнопку Подтвердить для выполнения." NOT "Тормозные колодки добавлены."
- In the "description" field of the ACTION JSON, ALWAYS use the human-readable car name: "brand title (plate)". NEVER use raw IDs like "#52". Example: "Add fuel to Toyota Camry (O143O)" NOT "Add fuel to car #5".
- For fuel records: BEFORE generating tool_add_fuel, check if a fuel record for the same car_id + year + month already exists in COMPANY CONTEXT. If it exists, use tool_update_fuel with the existing record_id instead of tool_add_fuel. The system has a UNIQUE constraint on (car_id, year, month).

AVAILABLE ACTIONS:
- tool_add_car: brand, title, numplate, (vin, fueltype, type, year, driver, status, region, fuel_card, drivers_phone)
- tool_update_car: car_id + fields to update
- tool_delete_car: car_id
- tool_add_fuel: car_id, year, month, liters, (total_cost, monthly_mileage)
- tool_update_fuel: record_id, (car_id, year, month, liters, total_cost, monthly_mileage)
- tool_add_spare: car_id, title, installed_at, (description, part_price, job_price, job_description)
- tool_update_spare: record_id, (car_id, title, description, part_price, job_price, job_description, installed_at)
- tool_add_insurance: car_id, number, start_date, end_date, (insurance_type, cost)
- tool_update_insurance: record_id, (car_id, insurance_type, number, start_date, end_date, cost)
- tool_add_inspection: car_id, number, inspected_at, (cost)
- tool_update_inspection: record_id, (car_id, number, inspected_at, cost)
- tool_delete_record: params {model_name in ["fuel","spare","insurance","inspection"], record_id}
- tool_list_cars: (status, brand, search)
- tool_list_custom_tables: (name) — list user's custom tables
- tool_list_custom_records: table_id, (search, limit) — read data from a custom table to answer questions
- tool_add_custom_table: name, columns (array of {name, type, required}), (description, icon, settings)
- tool_update_custom_table: table_id, (name, columns, description, icon, settings) — modify schema of existing table
- tool_add_custom_record: table_id, record_data (dict of column values), (car_id)
- tool_update_custom_record: record_id, (table_id, car_id, record_data)
- tool_delete_custom_record: record_id

HOW TO PARSE USER INPUT:

Adding a car:
"add car Toyota Camry O143O" → brand="Toyota", title="Camry", numplate="O143O"
"добавь машину Volkswagen Passat AKO534" → brand="Volkswagen", title="Passat", numplate="AKO534"

Adding fuel — ALWAYS extract ALL mentioned fields:
"добавь топливо 150л для Toyota Camry" → car_id=<Camry ID>, liters=150
"добавь топливо 200л за 5000 сом, пробег 12000" → car_id=<ID>, liters=200, total_cost=5000, monthly_mileage=12000
"fuel 100L for BMW X5, cost 3000" → car_id=<X5 ID>, liters=100, total_cost=3000
"бензин 180л, 8000 сом" → liters=180, total_cost=8000

Adding spare parts — ALWAYS extract prices if mentioned:
"запчасти тормозные колодки 2500 сом, работа 1500" → title="тормозные колодки", part_price=2500, job_price=1500

Adding insurance — ALWAYS extract cost if mentioned:
"страховка OSAGO 15000 сом" → insurance_type="OSAGO", cost=15000

Adding inspection (ТО) — ALWAYS extract cost if mentioned:
"ТО за 3000 сом" → cost=3000

CRITICAL RULE FOR OPTIONAL FIELDS:
- Fields in parentheses like (total_cost, monthly_mileage) are optional ONLY when the user does NOT mention them.
- If the user mentions cost, price, mileage, or any numeric value — you MUST include it in the params.
- NEVER ignore numbers the user provides. Extract every number and map it to the correct field.

IMPORTANT:
- Use COMPANY CONTEXT below as the source of truth for current data.
- Never invent data, IDs, or records that don't exist in context.
- When the user says "car #1" or "first car", find the actual car ID from the vehicle list.

COMPANY CONTEXT:
"""

# Keywords that suggest the question is related to Parko/fleet management
RELEVANT_KEYWORDS = [
    # Russian
    'автомобиль', 'машина', 'транспорт', 'топливо', 'бензин', 'дизель',
    'расход', 'техобслуживание', 'ремонт', 'запчасть', 'страховка',
    'осмотр', 'то', 'отчет', 'дашборд', 'водитель', 'гараж', 'автопарк',
    'парко', 'parko', 'шины', 'аккумулятор', 'гсм', 'пробег',
    # English
    'car', 'vehicle', 'fleet', 'fuel', 'maintenance', 'repair', 'spare',
    'insurance', 'inspection', 'report', 'dashboard', 'driver', 'tire',
    'accumulator', 'mileage', 'consumption', 'parko',
    # Kyrgyz
    'унаа', 'отун', 'айдоочу', 'оңдоо',
    # General
    'сколько', 'какой', 'какие', 'каких', 'когда', 'где', 'кто', 'как',
    'how many', 'how much', 'what', 'when', 'where', 'which', 'who',
    'статистик', 'аналитик', 'сводк', 'итог',
    'statistic', 'analytic', 'summary', 'total',
    'custom table', 'custom tables', 'пользовательская таблица', 'кастомная таблица',
    'своя таблица', 'таблица', 'table',
    # Greetings (allow so the bot can introduce itself)
    'привет', 'здравствуй', 'hello', 'hi', 'салам',
]

# Keywords that suggest the question is NOT related to Parko
IRRELEVANT_KEYWORDS = [
    'рецепт', 'готовка', 'кулинар', 'еда', 'блюдо',
    'погода', 'прогноз', 'спорт', 'футбол', 'хоккей',
    'политик', 'новости', 'кино', 'фильм', 'музык', 'песн',
    'программ', 'код', 'python', 'javascript', 'java', 'c++',
    'react', 'vue', 'angular', 'node', 'django', 'flask',
    'recipe', 'weather', 'sport', 'football', 'movie', 'music',
    'politic', 'news', 'cooking', 'food', 'code', 'software',
    'как написать', 'как создать сайт', 'как запрограммировать',
    'how to code', 'how to program', 'how to cook', 'weather forecast',
]


def _is_relevant_to_parko(question: str) -> bool:
    """Check if the question is relevant to Parko fleet management."""
    question_lower = question.lower()

    # Check for irrelevant keywords first
    for keyword in IRRELEVANT_KEYWORDS:
        if keyword.lower() in question_lower:
            # But allow questions about Parko itself
            if any(parko_kw in question_lower for parko_kw in ['parko', 'парко', 'автопарк', 'fleet']):
                return True
            return False

    # Check for relevant keywords
    for keyword in RELEVANT_KEYWORDS:
        if keyword.lower() in question_lower:
            return True

    # If question contains Parko-specific entity names, it's relevant
    parko_entities = [
        'машин', 'авто', 'транспорт', 'заправк',
        'car', 'auto', 'transport', 'fuel',
        'спар', 'запчаст', 'запчасть',
        'шин', 'покрышк', 'колес',
        'аккумулятор', 'батаре',
        'страхов', 'осмотр', 'техосмотр',
        'отчет', 'статистик', 'дашборд',
    ]
    for entity in parko_entities:
        if entity.lower() in question_lower:
            return True

    # Default: allow the question (the system prompt handles edge cases)
    return True


def _get_irrelevant_response() -> str:
    """Get a refusal message for non-Parko questions."""
    return (
        "Я — Parko AI Assistant, помощник по системе управления автопарком. "
        "Я отвечаю только на вопросы, связанные с Parko: автомобили, топливо, "
        "техническое обслуживание, запчасти, страховки, осмотры, отчёты и аналитика. "
        "Пожалуйста, задайте вопрос о вашем автопарке!"
    )


def collect_company_context(user) -> str:
    """
    Gather summary data about the user's company.
    Returns a formatted string with context for the AI.
    """
    from fleet.models import Car, Fuel, Spare, Insurance, Inspection, Tires, Accumulator

    company = user.company
    if not company:
        return "User has no company assigned."

    now = timezone.now()
    current_month = now.month
    current_year = now.year

    parts = []
    parts.append(f"Company: {company.name} | Country: {company.country} | Currency: {company.default_currency}")
    parts.append("")

    # Car statistics
    total_cars = Car.objects.filter(company=company).count()
    active_cars = Car.objects.filter(company=company, status='ACTIVE').count()
    maintenance_cars = Car.objects.filter(company=company, status='MAINTENANCE').count()
    inactive_cars = Car.objects.filter(company=company, status='INACTIVE').count()

    parts.append(f"Vehicles: {total_cars} total ({active_cars} active, {maintenance_cars} maintenance, {inactive_cars} inactive)")

    # List ALL cars with IDs
    all_cars = Car.objects.filter(company=company).order_by('id')
    if all_cars:
        parts.append("Vehicle list:")
        for car in all_cars:
            driver_info = car.driver if car.driver and car.driver != '-' else "—"
            parts.append(
                f"  ID:{car.id} | {car.brand} {car.title} | Plate:{car.numplate} | "
                f"Status:{car.status} | Driver:{driver_info}"
            )
    parts.append("")

    # Expenses breakdown per car (pre-computed for AI charts/tables)
    parts.append("EXPENSES BY CAR (pre-computed totals):")
    for car in all_cars:
        fuel_cost = Fuel.objects.filter(car=car).aggregate(total=Sum('total_cost'))['total'] or 0
        spare_cost = Spare.objects.filter(car=car).aggregate(
            total=Sum('part_price') + Sum('job_price')
        )['total'] or 0
        ins_cost = Insurance.objects.filter(car=car).aggregate(total=Sum('cost'))['total'] or 0
        insp_cost = Inspection.objects.filter(car=car).aggregate(total=Sum('cost'))['total'] or 0
        total = fuel_cost + spare_cost + ins_cost + insp_cost
        parts.append(
            f"  Car ID:{car.id} {car.brand} {car.title} ({car.numplate}) | "
            f"Fuel:{fuel_cost} | Spares:{spare_cost} | Insurance:{ins_cost} | Inspection:{insp_cost} | TOTAL:{total}"
        )
    parts.append("")

    # Fuel statistics
    fuel_this_month = Fuel.objects.filter(
        car__company=company,
        month=current_month,
        year=current_year
    )
    if fuel_this_month.exists():
        fuel_stats = fuel_this_month.aggregate(
            total_liters=Sum('liters'),
            total_cost=Sum('total_cost'),
        )
        parts.append(
            f"Fuel this month ({now.strftime('%B %Y')}): "
            f"{fuel_stats['total_liters'] or 0}L, "
            f"cost: {fuel_stats['total_cost'] or 0} {company.default_currency}"
        )

    # Overall fuel stats
    all_fuel = Fuel.objects.filter(car__company=company)
    if all_fuel.exists():
        total_fuel = all_fuel.aggregate(
            total_liters=Sum('liters'),
            total_cost=Sum('total_cost'),
        )
        records_with_data = Fuel.objects.filter(
            car__company=company,
            liters__gt=0,
            monthly_mileage__gt=0
        )
        avg_consumption = 0
        if records_with_data.exists():
            agg = records_with_data.aggregate(
                total_liters=Sum('liters'),
                total_mileage=Sum('monthly_mileage'),
            )
            if agg['total_mileage'] and agg['total_mileage'] > 0:
                avg_consumption = round((agg['total_liters'] / agg['total_mileage']) * 100, 2)

        parts.append(
            f"Fuel total: {all_fuel.count()} records, "
            f"{total_fuel['total_liters'] or 0}L, "
            f"cost: {total_fuel['total_cost'] or 0} {company.default_currency}, "
            f"avg: {avg_consumption} L/100km"
        )
    parts.append("")

    # Maintenance (spare parts)
    spares = Spare.objects.filter(car__company=company)
    if spares.exists():
        spare_stats = spares.aggregate(
            total_parts=Sum('part_price'),
            total_labor=Sum('job_price'),
            count=Count('id'),
        )
        parts.append(
            f"Maintenance: {spare_stats['count']} records, "
            f"parts: {spare_stats['total_parts'] or 0}, "
            f"labor: {spare_stats['total_labor'] or 0} {company.default_currency}"
        )
    else:
        parts.append("Maintenance: 0 records")
    parts.append("")

    # Insurance
    active_insurances = Insurance.objects.filter(car__company=company, end_date__gte=now.date())
    expired_insurances = Insurance.objects.filter(car__company=company, end_date__lt=now.date())
    parts.append(
        f"Insurance: {active_insurances.count()} active, {expired_insurances.count()} expired"
    )

    # Inspections
    active_inspections = Inspection.objects.filter(
        car__company=company,
        inspected_at__gte=now.date() - timedelta(days=365)
    )
    parts.append(
        f"Inspections: {active_inspections.count()} within last year"
    )

    # Tires & Accumulators
    tire_count = Tires.objects.filter(car__company=company).count()
    acc_count = Accumulator.objects.filter(car__company=company).count()
    parts.append(f"Tires: {tire_count} | Accumulators: {acc_count}")
    parts.append("")

    # Custom tables
    from custom_tables.models import CustomTable, CustomRecord
    custom_tables = CustomTable.objects.filter(company=company).order_by('-created_at')
    if custom_tables.exists():
        parts.append(f"Custom tables: {custom_tables.count()}")
        for table in custom_tables:
            cols = table.schema.get('columns', [])
            col_names = [c.get('name') for c in cols]
            col_types = {c.get('name'): c.get('type') for c in cols}
            record_count = CustomRecord.objects.filter(table=table).count()
            parts.append(
                f"  table_id={table.id} name='{table.name}' cols={col_names} types={col_types} records={record_count}"
            )
            # Include a few sample records so AI can answer data questions
            samples = CustomRecord.objects.filter(table=table).select_related('car').order_by('-created_at')[:5]
            if samples:
                parts.append(f"    Sample records from '{table.name}':")
                for rec in samples:
                    car_info = f" car={rec.car.numplate}" if rec.car else ""
                    parts.append(f"      record_id={rec.id}{car_info} data={rec.data}")
    else:
        parts.append("Custom tables: 0")
    parts.append("")

    # Monthly fuel breakdown (for analytics)
    monthly_fuel_rows = (
        Fuel.objects.filter(car__company=company)
        .values('year', 'month')
        .annotate(
            total_liters=Sum('liters'),
            total_cost=Sum('total_cost'),
            total_mileage=Sum('monthly_mileage'),
        )
        .order_by('-year', '-month')[:12]
    )
    if monthly_fuel_rows:
        parts.append("Fuel by month (latest 12):")
        for row in monthly_fuel_rows:
            parts.append(
                f"  {row['year']}-{row['month']:02d}: "
                f"{row['total_liters'] or 0}L, "
                f"cost:{row['total_cost'] or 0}, "
                f"mileage:{row['total_mileage'] or 0}km"
            )
        parts.append("")

    # Recent records with IDs (for update/delete operations)
    recent_fuel = Fuel.objects.filter(car__company=company).select_related('car').order_by('-year', '-month', '-id')[:10]
    if recent_fuel:
        parts.append("Recent fuel records:")
        for f in recent_fuel:
            parts.append(
                f"  fuel_id={f.id} car_id={f.car_id} plate={f.car.numplate} "
                f"{f.year}-{f.month:02d} {f.liters}L cost={f.total_cost}"
            )
        parts.append("")

    recent_spares = Spare.objects.filter(car__company=company).select_related('car').order_by('-installed_at', '-id')[:10]
    if recent_spares:
        parts.append("Recent maintenance:")
        for s in recent_spares:
            parts.append(
                f"  spare_id={s.id} car_id={s.car_id} plate={s.car.numplate} "
                f"\"{s.title}\" parts={s.part_price} labor={s.job_price} date={s.installed_at}"
            )
        parts.append("")

    recent_insurance = Insurance.objects.filter(car__company=company).select_related('car').order_by('-end_date', '-id')[:10]
    if recent_insurance:
        parts.append("Recent insurance:")
        for i in recent_insurance:
            parts.append(
                f"  ins_id={i.id} car_id={i.car_id} plate={i.car.numplate} "
                f"{i.insurance_type} #{i.number} {i.start_date}→{i.end_date} cost={i.cost}"
            )
        parts.append("")

    recent_inspections = Inspection.objects.filter(car__company=company).select_related('car').order_by('-inspected_at', '-id')[:10]
    if recent_inspections:
        parts.append("Recent inspections:")
        for insp in recent_inspections:
            parts.append(
                f"  insp_id={insp.id} car_id={insp.car_id} plate={insp.car.numplate} "
                f"#{insp.number} date={insp.inspected_at} cost={insp.cost}"
            )

    return "\n".join(parts)


def _compress_context(context: str, max_lines: int = MAX_CONTEXT_LINES) -> str:
    """Keep the most useful context lines while staying below provider token limits."""
    lines = [line for line in context.splitlines() if line.strip()]
    if len(lines) <= max_lines:
        return "\n".join(lines)

    # Keep vehicle list (top) and recent records (bottom), trim middle
    head = lines[:25]
    tail = lines[-20:]
    middle_budget = max_lines - len(head) - len(tail) - 1
    middle = lines[25:25 + max(0, middle_budget)]
    compact = head + ["... (trimmed) ..."] + middle + tail
    return "\n".join(compact[:max_lines])


# =============================================================================
# Groq Function Calling — Tool Definitions
# =============================================================================

TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "tool_list_cars",
            "description": "List vehicles in the company fleet. Use filters to narrow results.",
            "parameters": {
                "type": "object",
                "properties": {
                    "status": {
                        "type": "string",
                        "enum": ["ACTIVE", "MAINTENANCE", "INACTIVE"],
                        "description": "Filter by vehicle status"
                    },
                    "brand": {
                        "type": "string",
                        "description": "Filter by brand (e.g., 'BMW', 'Toyota')"
                    },
                    "search": {
                        "type": "string",
                        "description": "Search by numplate, brand, driver name, or title"
                    }
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "tool_add_car",
            "description": "Add a new vehicle to the fleet",
            "parameters": {
                "type": "object",
                "required": ["brand", "title", "numplate"],
                "properties": {
                    "brand": {"type": "string", "description": "Vehicle brand (e.g., 'BMW', 'Toyota')"},
                    "title": {"type": "string", "description": "Vehicle model/title (e.g., 'X5', 'Camry')"},
                    "numplate": {"type": "string", "description": "License plate number"},
                    "vin": {"type": "string", "description": "Vehicle identification number"},
                    "fueltype": {"type": "string", "description": "Fuel type (e.g., 'Petrol', 'Diesel')"},
                    "type": {"type": "string", "description": "Vehicle type (e.g., 'Sedan', 'SUV')"},
                    "year": {"type": "integer", "description": "Year of manufacture"},
                    "driver": {"type": "string", "description": "Assigned driver name"},
                    "status": {"type": "string", "enum": ["ACTIVE", "MAINTENANCE", "INACTIVE"]},
                    "region": {"type": "string", "description": "Region"}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "tool_update_car",
            "description": "Update an existing vehicle's fields",
            "parameters": {
                "type": "object",
                "required": ["car_id"],
                "properties": {
                    "car_id": {"type": "integer", "description": "Vehicle ID to update"},
                    "brand": {"type": "string"},
                    "title": {"type": "string"},
                    "numplate": {"type": "string"},
                    "vin": {"type": "string"},
                    "fueltype": {"type": "string"},
                    "type": {"type": "string"},
                    "year": {"type": "integer"},
                    "driver": {"type": "string"},
                    "status": {"type": "string", "enum": ["ACTIVE", "MAINTENANCE", "INACTIVE"]},
                    "region": {"type": "string"}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "tool_delete_car",
            "description": "Delete a vehicle from the fleet",
            "parameters": {
                "type": "object",
                "required": ["car_id"],
                "properties": {
                    "car_id": {"type": "integer", "description": "Vehicle ID to delete"}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "tool_add_fuel",
            "description": "Add a fuel consumption record for a vehicle",
            "parameters": {
                "type": "object",
                "required": ["car_id", "year", "month", "liters"],
                "properties": {
                    "car_id": {"type": "integer", "description": "Vehicle ID"},
                    "year": {"type": "integer", "description": "Year (e.g., 2026)"},
                    "month": {"type": "integer", "description": "Month (1-12)"},
                    "liters": {"type": "integer", "description": "Liters of fuel consumed"},
                    "total_cost": {"type": "integer", "description": "Total cost of fuel"},
                    "monthly_mileage": {"type": "integer", "description": "Monthly mileage in km"}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "tool_add_spare",
            "description": "Add a spare part / maintenance record",
            "parameters": {
                "type": "object",
                "required": ["car_id", "title", "installed_at"],
                "properties": {
                    "car_id": {"type": "integer", "description": "Vehicle ID"},
                    "title": {"type": "string", "description": "Spare part name / maintenance title"},
                    "description": {"type": "string", "description": "Detailed description"},
                    "part_price": {"type": "integer", "description": "Cost of spare parts"},
                    "job_price": {"type": "integer", "description": "Labor cost"},
                    "job_description": {"type": "string", "description": "Description of work done"},
                    "installed_at": {"type": "string", "description": "Date of installation (YYYY-MM-DD)"}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "tool_add_insurance",
            "description": "Add an insurance policy record",
            "parameters": {
                "type": "object",
                "required": ["car_id", "number", "start_date", "end_date"],
                "properties": {
                    "car_id": {"type": "integer", "description": "Vehicle ID"},
                    "insurance_type": {"type": "string", "description": "Insurance type (e.g., 'OSAGO', 'KASKO')"},
                    "number": {"type": "string", "description": "Policy number"},
                    "start_date": {"type": "string", "description": "Start date (YYYY-MM-DD)"},
                    "end_date": {"type": "string", "description": "End date (YYYY-MM-DD)"},
                    "cost": {"type": "integer", "description": "Insurance cost"}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "tool_add_inspection",
            "description": "Add a technical inspection record",
            "parameters": {
                "type": "object",
                "required": ["car_id", "number", "inspected_at"],
                "properties": {
                    "car_id": {"type": "integer", "description": "Vehicle ID"},
                    "number": {"type": "string", "description": "Inspection certificate number"},
                    "inspected_at": {"type": "string", "description": "Inspection date (YYYY-MM-DD)"},
                    "cost": {"type": "integer", "description": "Inspection cost"}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "tool_delete_record",
            "description": "Delete a fuel, spare, insurance, or inspection record by ID",
            "parameters": {
                "type": "object",
                "required": ["model_name", "record_id"],
                "properties": {
                    "model_name": {
                        "type": "string",
                        "enum": ["fuel", "spare", "insurance", "inspection"],
                        "description": "Type of record to delete"
                    },
                    "record_id": {"type": "integer", "description": "Record ID to delete"}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "tool_list_custom_tables",
            "description": "List custom tables for the company. Use this to discover what custom tables exist before querying or adding data.",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {"type": "string", "description": "Filter by table name (partial match)"}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "tool_list_custom_records",
            "description": "Read records from a specific custom table. Use this to answer questions about data stored in custom tables (e.g., 'how many accidents this month', 'total expenses from my table').",
            "parameters": {
                "type": "object",
                "required": ["table_id"],
                "properties": {
                    "table_id": {"type": "integer", "description": "Custom table ID"},
                    "search": {"type": "string", "description": "Optional search term to filter records"},
                    "limit": {"type": "integer", "description": "Maximum records to return (default 50)"}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "tool_add_custom_table",
            "description": "Create a new custom table with flexible columns. AI should infer appropriate column types from user request (e.g., date column for event tables, price/number for financial tables).",
            "parameters": {
                "type": "object",
                "required": ["name", "columns"],
                "properties": {
                    "name": {"type": "string", "description": "Table name"},
                    "description": {"type": "string", "description": "Table description"},
                    "icon": {"type": "string", "description": "Icon name (default: table)"},
                    "columns": {
                        "type": "array",
                        "description": "Array of column definitions {name, type, required}. AI should choose types intelligently: date for dates, price/number for money, select for categories, text for notes.",
                        "items": {"type": "object", "properties": {"name": {"type": "string"}, "type": {"type": "string", "enum": ["text", "number", "price", "date", "photo", "select"]}, "required": {"type": "boolean"}}}
                    },
                    "settings": {"type": "object", "description": "Table settings (color, showTotals, etc.)"}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "tool_update_custom_table",
            "description": "Update an existing custom table schema. Use to add/remove columns or rename a table.",
            "parameters": {
                "type": "object",
                "required": ["table_id"],
                "properties": {
                    "table_id": {"type": "integer", "description": "Table ID to update"},
                    "name": {"type": "string", "description": "New table name"},
                    "description": {"type": "string", "description": "New description"},
                    "icon": {"type": "string", "description": "New icon name"},
                    "columns": {
                        "type": "array",
                        "description": "Full new column list (replaces existing columns)",
                        "items": {"type": "object", "properties": {"name": {"type": "string"}, "type": {"type": "string", "enum": ["text", "number", "price", "date", "photo", "select"]}, "required": {"type": "boolean"}}}
                    },
                    "settings": {"type": "object", "description": "Table settings"}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "tool_add_custom_record",
            "description": "Add a record to a custom table",
            "parameters": {
                "type": "object",
                "required": ["table_id", "record_data"],
                "properties": {
                    "table_id": {"type": "integer", "description": "Custom table ID"},
                    "car_id": {"type": "integer", "description": "Optional vehicle ID to link"},
                    "record_data": {"type": "object", "description": "Dict of column_name: value pairs"}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "tool_update_custom_record",
            "description": "Update an existing custom record",
            "parameters": {
                "type": "object",
                "required": ["record_id"],
                "properties": {
                    "record_id": {"type": "integer", "description": "Record ID to update"},
                    "table_id": {"type": "integer", "description": "Move to a different table"},
                    "car_id": {"type": "integer", "description": "Link to a vehicle (null to unlink)"},
                    "record_data": {"type": "object", "description": "Dict of column_name: value pairs to update"}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "tool_delete_custom_record",
            "description": "Delete a custom record by ID",
            "parameters": {
                "type": "object",
                "required": ["record_id"],
                "properties": {
                    "record_id": {"type": "integer", "description": "Custom record ID to delete"}
                }
            }
        }
    },
]


def _execute_tool(user, company, tool_name, arguments):
    """Execute a tool function and return the result."""
    tool_fn = TOOL_REGISTRY.get(tool_name)
    if not tool_fn:
        return json.dumps({"success": False, "error": f"Unknown tool: {tool_name}"})

    try:
        if tool_name == 'tool_list_cars':
            result = tool_fn(user, company, filters=arguments)
        elif tool_name == 'tool_add_car':
            result = tool_fn(user, company, data=arguments)
        elif tool_name == 'tool_update_car':
            car_id = arguments.pop('car_id')
            result = tool_fn(user, company, car_id=car_id, data=arguments)
        elif tool_name == 'tool_delete_car':
            car_id = arguments.get('car_id')
            result = tool_fn(user, company, car_id=car_id)
        elif tool_name in ('tool_add_fuel', 'tool_add_spare', 'tool_add_insurance', 'tool_add_inspection'):
            result = tool_fn(user, company, data=arguments)
        elif tool_name in (
            'tool_update_fuel',
            'tool_update_spare',
            'tool_update_insurance',
            'tool_update_inspection',
        ):
            record_id = arguments.pop('record_id')
            result = tool_fn(user, company, record_id=record_id, data=arguments)
        elif tool_name == 'tool_delete_record':
            model_name = arguments.get('model_name')
            record_id = arguments.get('record_id')
            result = tool_fn(user, company, model_name=model_name, record_id=record_id)
        elif tool_name == 'tool_list_custom_tables':
            result = tool_fn(user, company, filters=arguments)
        elif tool_name == 'tool_list_custom_records':
            table_id = arguments.pop('table_id')
            result = tool_fn(user, company, table_id=table_id, filters=arguments)
        elif tool_name == 'tool_add_custom_table':
            result = tool_fn(user, company, data=arguments)
        elif tool_name == 'tool_update_custom_table':
            table_id = arguments.pop('table_id')
            result = tool_fn(user, company, table_id=table_id, data=arguments)
        elif tool_name == 'tool_add_custom_record':
            result = tool_fn(user, company, data=arguments)
        elif tool_name == 'tool_update_custom_record':
            record_id = arguments.pop('record_id')
            result = tool_fn(user, company, record_id=record_id, data=arguments)
        elif tool_name == 'tool_delete_custom_record':
            record_id = arguments.get('record_id')
            result = tool_fn(user, company, record_id=record_id)
        else:
            result = {"success": False, "error": f"Tool {tool_name} not implemented"}

        return json.dumps(result, ensure_ascii=False)
    except PermissionError as e:
        return json.dumps({"success": False, "error": str(e)})
    except Exception as e:
        logger.error(f"Tool execution error [{tool_name}]: {e}")
        return json.dumps({"success": False, "error": str(e)})


def ask_ai(user, question: str, conversation=None) -> str:
    """
    Send a question to the AI provider (Groq) and return the response.

    Args:
        user: The user making the request
        question: The user's question
        conversation: Optional AIConversation object for context
    """
    # Check relevance
    if not _is_relevant_to_parko(question):
        logger.info(f"Irrelevant question from user {user.id}: {question[:100]}")
        return _get_irrelevant_response()

    # Collect company context
    context = _compress_context(collect_company_context(user))

    # Get Groq API settings
    ai_settings = getattr(settings, 'AI_SETTINGS', {})
    api_key = ai_settings.get('api_key', '')
    model = ai_settings.get('model', 'llama-3.1-8b-instant')

    # Log configuration (mask API key for security)
    masked_key = api_key[:10] + '...' + api_key[-4:] if len(api_key) > 14 else '***NOT SET***'
    logger.info(f"AI Settings - Provider: {ai_settings.get('provider')}, Model: {model}, API Key: {masked_key}")

    if not api_key:
        logger.warning("AI API key is not configured")
        return (
            "AI-ассистент временно недоступен: API-ключ не настроен. "
            "Обратитесь к администратору системы."
        )

    try:
        from groq import Groq
    except ImportError:
        logger.exception("Groq package import failed")
        return (
            "AI-ассистент временно недоступен: библиотека Groq не установлена или повреждена. "
            "Выполните: pip install groq. Обратитесь к администратору системы."
        )
    except Exception:
        logger.exception("Unexpected error during Groq import")
        return (
            "AI-ассистент временно недоступен: ошибка при загрузке библиотеки Groq. "
            "Обратитесь к администратору системы."
        )

    company = user.company

    try:
        client = Groq(api_key=api_key)
        logger.info(f"Groq client initialized for user {user.id}")

        # Build messages — single system prompt with context appended
        system_content = SYSTEM_PROMPT + context

        messages = [
            {"role": "system", "content": system_content},
        ]

        # Get recent conversation history for context
        if conversation:
            recent_msgs = AIChatMessage.objects.filter(
                conversation=conversation,
            ).order_by('-created_at')[:MAX_HISTORY_MESSAGES]
        else:
            recent_msgs = AIChatMessage.objects.filter(
                company=company,
                user=user,
            ).order_by('-created_at')[:MAX_HISTORY_MESSAGES]

        # Add conversation history (reversed to chronological order)
        for msg in reversed(list(recent_msgs)):
            role = "assistant" if msg.role == RoleChoices.ASSISTANT else "user"
            messages.append({"role": role, "content": msg.content})

        messages.append({"role": "user", "content": question})

        # Log the API call details
        logger.info(f"Making Groq API call for user {user.id}, model: {model}, messages: {len(messages)}")

        try:
            response = client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=0.3,
                max_tokens=2048,
            )

            logger.info(f"Groq API response received for user {user.id}")
            usage = getattr(response, 'usage', None)
            if usage:
                logger.info(f"Tokens - prompt: {usage.prompt_tokens}, completion: {usage.completion_tokens}")

            answer = response.choices[0].message.content
            logger.info(f"AI response for user {user.id}: {len(answer)} chars")
            return answer
        except Exception as api_error:
            error_type = type(api_error).__name__
            error_msg = str(api_error)
            logger.error(f"Groq API call failed for user {user.id}: {error_type}: {error_msg}", exc_info=True)
            raise

    except Exception as e:
        error_msg = str(e)
        error_type = type(e).__name__
        logger.error(f"Groq API error for user {user.id}: {error_msg}", exc_info=True)

        if 'api_key' in error_msg.lower() or 'invalid_api_key' in error_msg.lower() or 'authentication' in error_msg.lower():
            return (
                "🔑 Ошибка авторизации: API-ключ недействителен или истёк.\n\n"
                f"Детали: {error_msg}\n\n"
                "Обратитесь к администратору для проверки настроек AI."
            )
        elif 'rate_limit' in error_msg.lower() or 'rate limit' in error_msg.lower():
            return (
                "⏱️ Превышен лимит запросов к AI сервису.\n\n"
                "Подождите несколько секунд и попробуйте снова."
            )
        elif 'connection' in error_msg.lower() or 'timeout' in error_msg.lower():
            return (
                "🌐 Ошибка соединения с AI сервисом.\n\n"
                "Проверьте интернет-соединение или попробуйте позже."
            )
        else:
            return (
                f"❌ Произошла ошибка при обработке запроса.\n\n"
                f"📋 Детали: {error_msg}\n\n"
                f"💡 Попробуйте переформулировать запрос или обратитесь к администратору."
            )


def ask_ai_with_action(user, question: str, action_name: str, action_params: dict) -> str:
    """
    Execute a confirmed action directly via tool function.
    Called when user confirms an AI-suggested action.
    """
    company = user.company
    tool_result = _execute_tool(user, company, action_name, action_params)

    try:
        result = json.loads(tool_result)
    except json.JSONDecodeError:
        result = {"success": False, "error": "Invalid tool response"}

    if result.get("success"):
        return result.get("message", "Action completed successfully.")
    else:
        return f"Action failed: {result.get('error', 'Unknown error')}"


def ask_ai_streaming(user, question: str):
    """
    Stream AI response as generator for SSE.
    Yields dict events compatible with views_streaming.py.
    """
    yield {"type": "thought", "content": "Анализирую запрос..."}

    response = ask_ai(user, question)

    # Try to extract any JSON action blocks from the response
    actions = []
    try:
        from ai.tools import TOOL_REGISTRY
        # Simple extraction: look for {"action":...} patterns
        import re
        for match in re.finditer(r'\{[^}]*"action"[^}]*\}', response):
            try:
                action_obj = json.loads(match.group())
                if "action" in action_obj and "params" in action_obj:
                    actions.append(action_obj)
            except json.JSONDecodeError:
                pass
    except Exception:
        pass

    yield {"type": "content", "content": response}

    for action in actions:
        yield {"type": "action", "payload": action}

    yield {"type": "done"}
