import json
import logging

from django.conf import settings
from django.db.models import Count, Sum, Q
from django.utils import timezone
from datetime import timedelta

from ai.models import AIChatMessage, RoleChoices
from ai.tools import TOOL_REGISTRY

logger = logging.getLogger(__name__)

MAX_CONTEXT_LINES = 80
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

ABOUT PARKO:
Parko is a multi-tenant SaaS fleet management platform. Companies track:
- Vehicles (cars, trucks) with brand, model, VIN, license plates, drivers
- Fuel consumption with monthly reports and L/100km calculation
- Maintenance records (spare parts, repairs, labor costs)
- Tire and accumulator tracking
- Insurance policies with validity dates
- Technical inspections
- Dashboard analytics and reports

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

JSON BLOCKS — place inside ```json ... ``` fences:

TABLE:
```json
{"type":"table","title":"Fleet vehicles","headers":["ID","Vehicle","Plate","Status"],"rows":[[1,"Toyota Camry","O143O","Active"]],"filename":"fleet_vehicles"}
```

CHART (bar, line, or pie):
```json
{"type":"chart","title":"Fuel by month","chart_type":"bar","x_label":"Month","y_label":"Liters","filename":"fuel_chart","series":[{"name":"Fuel","color":"#2563eb","points":[{"label":"Jan","value":120}]}]}
```

ACTION (add/update/delete data):
```json
{"action":"tool_add_fuel","params":{"car_id":32,"year":2026,"month":4,"liters":150},"description":"Add 150L fuel to car #32 for April 2026"}
```

ACTION RULES:
- Generate the action JSON IMMEDIATELY when you have all required fields. Do NOT ask for confirmation.
- car_id and record_id must be INTEGERS, never strings.
- If the user references a car by plate or name, find the matching ID from context.
- If required fields are missing, ask for them in a short sentence. Do NOT generate the JSON.
- For DELETE operations ONLY, briefly state what will be deleted before the JSON block.

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
- tool_delete_record: model_name in ["fuel","spare","insurance","inspection"], record_id
- tool_list_cars: (status, brand, search)

HOW TO PARSE USER INPUT FOR ADDING A CAR:
"add car Toyota Camry O143O" → brand="Toyota", title="Camry", numplate="O143O"
"добавь машину Volkswagen Passat AKO534" → brand="Volkswagen", title="Passat", numplate="AKO534"

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
    'осмотр', 'отчет', 'дашборд', 'водитель', 'гараж', 'автопарк',
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
        logger.error("Groq package is not installed")
        return (
            "AI-ассистент временно недоступен: библиотека Groq не установлена. "
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
