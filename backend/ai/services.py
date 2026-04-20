import json
import logging

from django.conf import settings
from django.db.models import Count, Sum, Q
from django.utils import timezone
from datetime import timedelta

from ai.models import AIChatMessage, RoleChoices
from ai.tools import TOOL_REGISTRY

logger = logging.getLogger(__name__)

MAX_CONTEXT_LINES = 70
MAX_HISTORY_MESSAGES = 6

SYSTEM_PROMPT = """\
You are Parko AI Assistant — a specialized AI assistant for the Parko fleet management system.

ABOUT PARKO:
Parko is a multi-tenant SaaS platform for enterprise fleet management. Companies use it to track and manage their vehicle fleets, including:
- Vehicle management (cars, trucks, etc.) with details like brand, model, VIN, license plates, assigned drivers
- Fuel consumption tracking with monthly reports and automatic L/100km calculation
- Maintenance records (spare parts, repairs, job costs)
- Tire and accumulator tracking
- Insurance policy management with validity dates
- Technical inspection records
- Dashboard analytics and reports (fuel consumption, maintenance costs, insurance status)
- Multi-company (multi-tenant) architecture where each company's data is isolated

YOUR ROLE:
- You ONLY answer questions about Parko fleet management system (cars, fuel, maintenance, insurance, inspections, reports, dashboards)
- You refuse to answer questions unrelated to Parko
- You never share data between companies — each company's data is strictly isolated
- You identify yourself as "Parko AI Assistant"
- You answer in the same language the user writes in (Russian, English, or Kyrgyz)

COLOR TEXT USAGE:
- You can use colored text to highlight important information when displaying large amounts of data
- Use HTML span tags with inline styles: <span style="color: #FF0000">red text</span>, <span style="color: #00FF00">green text</span>, etc.
- Available colors and their purposes:
  - <span style="color: #FF0000">Red (#FF0000)</span> — critical alerts, errors, expired items, high costs
  - <span style="color: #FFA500">Orange (#FFA500)</span> — warnings, expiring soon, attention needed
  - <span style="color: #FFD700">Gold (#FFD700)</span> — important notices, key metrics
  - <span style="color: #00AA00">Green (#00AA00)</span> — success, active status, good metrics
  - <span style="color: #0066FF">Blue (#0066FF)</span> — informational, links, references
  - <span style="color: #9933FF">Purple (#9933FF)</span> — special highlights, categories
  - <span style="color: #FF1493">Pink (#FF1493)</span> — highlights, emphasis
- Use colors sparing — only for key data points, costs, dates, or status indicators
- Do NOT color entire paragraphs — only highlight specific values, numbers, or key terms
- Example: "Vehicle `O143O` status: <span style="color: #00AA00">ACTIVE</span>, fuel: <span style="color: #FF0000">150 liters</span> used this month"
- When user asks you to "use colors" or "highlight", apply appropriate colors to important data

FORMATTING RULES — ALWAYS USE MARKDOWN:
- Use **bold** for important values, numbers, and key terms
- Use *italic* for emphasis and descriptions
- Use `inline code` for field names, IDs, technical terms, and license plates
- Use bullet points (- item) for lists of items
- Use numbered lists (1. item) for steps and sequences
- Use ### headings for section titles when listing data
- Use > blockquotes for tips or important notes
- Use tables when comparing data
- Make your responses clean, structured, and easy to read
- Always highlight: car numbers, costs, dates, percentages in **bold**
- License plates should be in `code` format like `O143O`
- Vehicle IDs should be in `code` format like `ID: 5`
- HTML color spans work alongside markdown — you can combine them: `**<span style="color: #FF0000">critical</span>**`

CRITICAL RULE FOR JSON ACTIONS:
- When generating JSON action blocks, car_id MUST be an INTEGER (e.g., 32), NOT a string
- NEVER write "car_id=32" or "car_id=32" as a string — use just the number: 32
- CORRECT: {"action": "tool_add_fuel", "params": {"car_id": 32, "year": 2026, "month": 4, "liters": 150}}
- WRONG: {"action": "tool_add_fuel", "params": {"car_id": "car_id=32", ...}}
- WRONG: {"action": "tool_add_fuel", "params": {"car_id": "32", ...}}

EXAMPLE RESPONSE STYLE:
### 🚗 Автопарк

В компании **Demo Company** найдено **10** автомобилей:

| Номер | Марка | Статус |
|-------|-------|--------|
| `O143O` | Toyota Camry | <span style="color: #00AA00">Активна</span> |
| `AA642401KG` | BMW X7 | <span style="color: #00AA00">Активна</span> |

> 💡 Чтобы добавить топливо для машины, укажите номер машины, литры и месяц.

IMPORTANT: When the user asks about current data (how many cars, what vehicles exist, etc.), ALWAYS refer to the COMPANY CONTEXT section below — it contains the LIVE data from the database. The conversation history may be outdated if actions were performed.

TOOL USAGE:
- You have access to tools that can list, add, update, and delete fleet data (vehicles, fuel records, maintenance, insurance, inspections)
- When a user asks you to add, update, or delete data, respond with a tool call to perform the action
- The system will execute the tool and return the result to you
- When a user asks you to perform an action (add, update, delete), first describe what you will do and ask for confirmation
- After the user confirms, use the appropriate tool to execute the action
- Always confirm the result of any action to the user

COMPANY CONTEXT:
The data you see below belongs ONLY to the user's company. Use this context to answer questions accurately.
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
]

# Keywords that suggest the question is NOT related to Parko
IRRELEVANT_KEYWORDS = [
    'рецепт', 'рецепт', 'готовка', 'кулинар', 'еда', 'блюдо',
    'рецепт', 'погода', 'прогноз', 'спорт', 'футбол', 'хоккей',
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

    # Default: allow the question if it's a general query that could be about Parko
    # This is permissive — we let the system prompt handle edge cases
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
    parts.append(f"Company: {company.name}")
    parts.append(f"Country: {company.country}")
    parts.append(f"Default currency: {company.default_currency}")
    parts.append("Use ONLY this company data. Never invent rows, totals, IDs, dates, tables, or chart points.")
    parts.append("")

    # Car statistics
    total_cars = Car.objects.filter(company=company).count()
    active_cars = Car.objects.filter(company=company, status='ACTIVE').count()
    maintenance_cars = Car.objects.filter(company=company, status='MAINTENANCE').count()
    inactive_cars = Car.objects.filter(company=company, status='INACTIVE').count()

    parts.append(f"Vehicles: {total_cars} total, {active_cars} active, {maintenance_cars} in maintenance, {inactive_cars} inactive")

    # List ALL cars with IDs — IMPORTANT: user may reference by ID
    all_cars = Car.objects.filter(company=company).order_by('id')
    if all_cars:
        parts.append("All vehicles (use the ID number when adding fuel/spare/insurance/inspection):")
        for car in all_cars:
            driver_info = f"Driver: {car.driver}" if car.driver and car.driver != '-' else "No driver"
            fc = f"Fuel card: {car.fuel_card}" if car.fuel_card else "No fuel card"
            parts.append(
                f"  ID: {car.id} | {car.brand} {car.title} | Numplate: {car.numplate} | "
                f"Status: {car.status} | {driver_info} | {fc}"
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
            f"{fuel_stats['total_liters'] or 0} liters, "
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
            f"Total fuel records: {all_fuel.count()}, "
            f"total liters: {total_fuel['total_liters'] or 0}, "
            f"total cost: {total_fuel['total_cost'] or 0} {company.default_currency}, "
            f"avg consumption: {avg_consumption} L/100km"
        )
    parts.append("")

    # Maintenance (spare parts / запчасти)
    spares = Spare.objects.filter(car__company=company)
    if spares.exists():
        spare_stats = spares.aggregate(
            total_parts=Sum('part_price'),
            total_labor=Sum('job_price'),
            count=Count('id'),
        )
        parts.append(
            f"Spare parts / запчасти (maintenance records): {spare_stats['count']} entries, "
            f"parts cost: {spare_stats['total_parts'] or 0} {company.default_currency}, "
            f"labor cost: {spare_stats['total_labor'] or 0} {company.default_currency}"
        )
        # List individual spare records
        for spare in spares.order_by('-installed_at')[:5]:
            parts.append(
                f"  - {spare.title} (car_id={spare.car_id}), "
                f"parts: {spare.part_price}, labor: {spare.job_price}, "
                f"date: {spare.installed_at}"
            )
    else:
        parts.append("Spare parts / запчасти: 0 records")
    parts.append("")

    # Insurance
    active_insurances = Insurance.objects.filter(car__company=company, end_date__gte=now.date())
    expired_insurances = Insurance.objects.filter(car__company=company, end_date__lt=now.date())
    parts.append(
        f"Insurance: {active_insurances.count()} active, {expired_insurances.count()} expired"
    )
    parts.append("")

    # Inspections
    active_inspections = Inspection.objects.filter(
        car__company=company,
        inspected_at__gte=now.date() - timedelta(days=365)
    )
    parts.append(
        f"Inspections: {active_inspections.count()} active (within last year)"
    )
    parts.append("")

    # Tires
    tire_count = Tires.objects.filter(car__company=company).count()
    parts.append(f"Tire records: {tire_count}")

    # Accumulators
    acc_count = Accumulator.objects.filter(car__company=company).count()
    parts.append(f"Accumulator records: {acc_count}")

    # Extended live datasets for accurate tables/charts and safe update/delete by record ID
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
    parts.append("")
    parts.append("Fuel monthly totals (latest 12 months in DB):")
    for row in monthly_fuel_rows:
        parts.append(
            f"  fuel_month year={row['year']} month={row['month']} "
            f"liters={row['total_liters'] or 0} cost={row['total_cost'] or 0} "
            f"mileage={row['total_mileage'] or 0}"
        )

    parts.append("Recent fuel records with IDs:")
    for fuel in Fuel.objects.filter(car__company=company).select_related('car').order_by('-year', '-month', '-id')[:12]:
        parts.append(
            f"  fuel_id={fuel.id} | car_id={fuel.car_id} | car={fuel.car.numplate} | "
            f"year={fuel.year} | month={fuel.month} | liters={fuel.liters} | "
            f"cost={fuel.total_cost} | mileage={fuel.monthly_mileage} | consumption={fuel.consumption}"
        )

    parts.append("")
    parts.append("Recent maintenance records with IDs:")
    for spare in Spare.objects.filter(car__company=company).select_related('car').order_by('-installed_at', '-id')[:12]:
        parts.append(
            f"  spare_id={spare.id} | car_id={spare.car_id} | car={spare.car.numplate} | "
            f"title={spare.title} | part_price={spare.part_price} | job_price={spare.job_price} | "
            f"installed_at={spare.installed_at}"
        )

    parts.append("")
    parts.append("Recent insurance records with IDs:")
    for insurance in Insurance.objects.filter(car__company=company).select_related('car').order_by('-end_date', '-id')[:12]:
        parts.append(
            f"  insurance_id={insurance.id} | car_id={insurance.car_id} | car={insurance.car.numplate} | "
            f"type={insurance.insurance_type} | number={insurance.number} | "
            f"start_date={insurance.start_date} | end_date={insurance.end_date} | cost={insurance.cost}"
        )

    parts.append("")
    parts.append("Recent inspection records with IDs:")
    for inspection in Inspection.objects.filter(car__company=company).select_related('car').order_by('-inspected_at', '-id')[:12]:
        parts.append(
            f"  inspection_id={inspection.id} | car_id={inspection.car_id} | car={inspection.car.numplate} | "
            f"number={inspection.number} | inspected_at={inspection.inspected_at} | cost={inspection.cost}"
        )

    return "\n".join(parts)


def _compress_context(context: str, max_lines: int = MAX_CONTEXT_LINES) -> str:
    """Keep the most useful context lines while staying below provider token limits."""
    lines = [line for line in context.splitlines() if line.strip()]
    if len(lines) <= max_lines:
        return "\n".join(lines)

    head = lines[:22]
    tail = lines[-18:]
    middle_budget = max_lines - len(head) - len(tail) - 1
    middle = lines[22:22 + max(0, middle_budget)]
    compact = head + ["... context trimmed to fit model token limits ..."] + middle + tail
    return "\n".join(compact[:max_lines])


def _build_action_prompt() -> str:
    """Compact prompt focused on structured analytics and safe company-scoped actions."""
    return (
        "Use the live COMPANY CONTEXT above as the source of truth.\n"
        "For vehicle lists and record lists, ALWAYS return a table JSON block. Do not answer with plain text.\n"
        "For analytics, expenses, totals, trends, comparisons, reports, or summaries:\n"
        "1. Return at least one table JSON block.\n"
        "2. Return at least one chart JSON block.\n"
        "3. Then write 1 short conclusion line.\n"
        "4. End with one short follow-up question.\n"
        "5. Never invent values.\n\n"
        "Use only these JSON types: table, chart, action.\n"
        "Do not use markdown tables.\n"
        "TABLE JSON:\n"
        '```json\n'
        '{"type":"table","title":"Fuel expenses","headers":["Month","Liters","Cost"],"rows":[["2026-04",120,8400]],"filename":"fuel_expenses"}\n'
        '```\n\n'
        "CHART JSON:\n"
        '```json\n'
        '{"type":"chart","title":"Fuel expenses by month","chart_type":"bar","x_label":"Month","y_label":"Cost","filename":"fuel_expenses_chart","series":[{"name":"Fuel cost","color":"#2563eb","points":[{"label":"2026-04","value":8400}]}]}\n'
        '```\n\n'
        "For add/update/delete, first describe the change and ask for confirmation.\n"
        "Then return exactly one action JSON block.\n"
        "car_id and record_id must be integers, never strings.\n"
        "Use only live IDs from context: car_id, fuel_id, spare_id, insurance_id, inspection_id.\n\n"
        "Available actions:\n"
        "- tool_add_car: brand, title, numplate, (vin, fueltype, type, year, driver, status, region, fuel_card, drivers_phone)\n"
        "- tool_update_car: car_id + any editable car fields\n"
        "- tool_delete_car: car_id\n"
        "- tool_add_fuel: car_id, year, month, liters, (total_cost, monthly_mileage)\n"
        "- tool_update_fuel: record_id, (car_id, year, month, liters, total_cost, monthly_mileage)\n"
        "- tool_add_spare: car_id, title, installed_at, (description, part_price, job_price, job_description)\n"
        "- tool_update_spare: record_id, (car_id, title, description, part_price, job_price, job_description, installed_at)\n"
        "- tool_add_insurance: car_id, number, start_date, end_date, (insurance_type, cost)\n"
        "- tool_update_insurance: record_id, (car_id, insurance_type, number, start_date, end_date, cost)\n"
        "- tool_add_inspection: car_id, number, inspected_at, (cost)\n"
        "- tool_update_inspection: record_id, (car_id, number, inspected_at, cost)\n"
        '- tool_delete_record: model_name in ["fuel","spare","insurance","inspection"], record_id\n'
        "- tool_list_cars: (status, brand, search)\n\n"
        "ACTION JSON:\n"
        '```json\n'
        '{"action":"tool_update_fuel","params":{"record_id":12,"total_cost":9200},"description":"Update fuel record #12 cost to 9200"}\n'
        '```'
    )


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
    Supports function calling with tool loop (max 3 iterations).
    
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
    logger.info(f"API Key length: {len(api_key)}, starts with: {api_key[:15] if len(api_key) > 15 else 'N/A'}")

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

        # Build the messages (no Groq tool calling — too slow with 9 tools)
        # Instead, instruct AI to respond with JSON for actions
        action_prompt = (
            "\n\n"
            "IMPORTANT: If the user asks you to ADD, UPDATE, or DELETE data, "
            "you MUST have all the REQUIRED information before generating a JSON action block.\n\n"
            "REQUIRED information for each action:\n"
            "- tool_add_car: brand, title, numplate (3 fields minimum)\n"
            "- tool_add_fuel: car_id (vehicle ID), year, month, liters\n"
            "- tool_add_spare: car_id, title, installed_at\n"
            "- tool_add_insurance: car_id, number, start_date, end_date\n"
            "- tool_add_inspection: car_id, number, inspected_at\n"
            "- tool_delete_car: car_id\n\n"
            "HOW TO PARSE USER INPUT FOR ADDING A CAR:\n"
            "If user says 'add car Toyota Camry O143O' or 'добавь машину Toyota Camry O143O':\n"
            "  → brand = 'Toyota' (first word = brand)\n"
            "  → title = 'Camry' (second word = model/title)\n"
            "  → numplate = 'O143O' (last alphanumeric string = license plate)\n"
            "If user says 'add car Volkswagen Passat AKO534':\n"
            "  → brand = 'Volkswagen'\n"
            "  → title = 'Passat'\n"
            "  → numplate = 'AKO534'\n"
            "ONLY ask for missing fields if they are genuinely absent from the user's message.\n\n"
            "RULES:\n"
            "1. If the user asks to add something but does NOT provide all required fields, "
            "DO NOT generate a JSON action block. Instead, respond with text asking for the missing information.\n"
            "2. For example, if user says 'add fuel' — reply: 'Which vehicle? How many liters? What month and year?'\n"
            "3. If user says 'add car BMW' (missing title and numplate) — reply: 'I need a model name and license plate number.'\n"
            "4. If user provides brand + model + numplate in one message — GENERATE THE JSON ACTION IMMEDIATELY.\n"
            "5. If user says 'for car #1' or 'for the first car', look at the vehicle list in the context above and find the ID number (e.g., ID: 32 means car_id=32).\n"
            "6. CRITICAL: In JSON params, car_id must be an INTEGER, not a string. Use 32, NOT '32' or 'car_id=32'.\n"
            "7. ALWAYS remember the conversation context. If user previously said '90 liters for April 2026', remember it.\n\n"
            "CORRECT JSON examples:\n"
            '```json\n{"action": "tool_add_fuel", "params": {"car_id": 32, "year": 2026, "month": 4, "liters": 150}, "description": "Add 150L fuel to car #32"}\n```\n'
            '```json\n{"action": "tool_add_car", "params": {"brand": "Toyota", "title": "Camry", "numplate": "ABC123"}, "description": "Add new Toyota Camry"}\n```\n'
            '```json\n{"action": "tool_update_car", "params": {"car_id": 32, "driver": "Иванов"}, "description": "Assign driver to car #32"}\n```\n\n'
            "WRONG (DO NOT DO THIS):\n"
            '```json\n{"action": "tool_add_fuel", "params": {"car_id": "car_id=32", ...}}  ← WRONG! Use 32, not "car_id=32"\n```\n'
            '```json\n{"action": "tool_add_fuel", "params": {"car_id": "32", ...}}  ← WRONG! Use 32 (integer), not "32" (string)\n```\n\n'
            "When you DO have all required fields, respond in this EXACT format:\n\n"
            "I will [describe what you're going to do in 1-2 sentences].\n\n"
            "```json\n"
            '{"action": "tool_name", "params": {...}, "description": "Brief summary of the action"}\n'
            '```\n\n'
            "IMPORTANT: Always write a clear description of what you will do BEFORE the JSON block. "
            "Never just output a JSON block without explaining what will happen. "
            "Always tell the user exactly what data will be changed, added, or deleted.\n\n"
            "DATA TABLES — ALWAYS USE JSON FORMAT:\n"
            "- NEVER use markdown tables for data. ALWAYS use a JSON code block.\n"
            "- Format:\n"
            '  ```json\n'
            '  {"type": "table", "headers": ["Header1", "Header2", "Header3"], "rows": [["val1", "val2", "val3"], ["val1", "val2", "val3"]]}\n'
            '  ```\n'
            "- The system will automatically render this as a beautiful table.\n"
            "- Example for listing cars:\n"
            '  ```json\n'
            '  {"type": "table", "headers": ["ID", "Машина", "Номер", "Статус"], "rows": [[1, "Toyota Camry", "O143O", "Активна"], [2, "BMW X5", "AA642401KG", "Активна"]]}\n'
            '  ```\n'
            "- Use short, clear column names. Keep cell values concise.\n"
            "- For fuel records: {\"type\": \"table\", \"headers\": [\"Машина\", \"Месяц\", \"Литры\", \"Расход\"], \"rows\": [...]}\n"
            "- For spare parts: {\"type\": \"table\", \"headers\": [\"Запчасть\", \"Цена\", \"Дата\"], \"rows\": [...]}\n"
            "- ALWAYS include this JSON when listing data — it's how the user sees tables.\n\n"
            "Available actions (optional fields in parentheses):\n"
            "- tool_add_car: brand, title, numplate, (vin, fueltype, type, year, driver, status, region, fuel_card, drivers_phone)\n"
            "- tool_update_car: car_id + fields to update\n"
            "- tool_delete_car: car_id\n"
            "- tool_add_fuel: car_id, year, month, liters, (total_cost, monthly_mileage)\n"
            "- tool_add_spare: car_id, title, installed_at, (description, part_price, job_price, job_description)\n"
            "- tool_add_insurance: car_id, number, start_date, end_date, (insurance_type, cost)\n"
            "- tool_add_inspection: car_id, number, inspected_at, (cost)\n"
            "- tool_list_cars: (status, brand, search)\n\n"
            "For questions (not actions), just respond normally."
        )

        action_prompt = (
            "\n\n"
            "You must base every answer on the live COMPANY CONTEXT above.\n"
            "When the user asks for analytics, expenses, totals, trends, consumption, comparisons, reports, or summaries:\n"
            "1. Output at least one table JSON block if data exists.\n"
            "2. Output at least one chart JSON block if data exists.\n"
            "3. Then write a short conclusion in the user's language.\n"
            "4. End with one follow-up question like 'Что еще хотите узнать?'.\n"
            "5. Never invent missing values. If data is missing, say that directly.\n\n"
            "TABLE FORMAT:\n"
            '```json\n'
            '{"type":"table","title":"Fuel expenses","headers":["Month","Liters","Cost"],"rows":[["2026-04",120,8400],["2026-03",95,6400]],"filename":"fuel_expenses"}\n'
            '```\n\n'
            "CHART FORMAT:\n"
            '```json\n'
            '{"type":"chart","title":"Fuel expenses by month","chart_type":"bar","x_label":"Month","y_label":"Cost","filename":"fuel_expenses_chart","series":[{"name":"Fuel cost","color":"#2563eb","points":[{"label":"2026-04","value":8400},{"label":"2026-03","value":6400}]}]}\n'
            '```\n\n'
            "ACTION RULES:\n"
            "- For add/update/delete actions, describe the change in 1-2 sentences before the JSON action block.\n"
            "- Do not generate an action block until you have all required fields.\n"
            "- For destructive or modifying actions, ask for confirmation and then return one JSON action block.\n"
            "- car_id and record_id must always be integers, never strings.\n"
            "- Use live IDs from context: car_id, fuel_id, spare_id, insurance_id, inspection_id.\n\n"
            "AVAILABLE ACTIONS:\n"
            "- tool_add_car: brand, title, numplate, (vin, fueltype, type, year, driver, status, region, fuel_card, drivers_phone)\n"
            "- tool_update_car: car_id + any editable car fields\n"
            "- tool_delete_car: car_id\n"
            "- tool_add_fuel: car_id, year, month, liters, (total_cost, monthly_mileage)\n"
            "- tool_update_fuel: record_id, (car_id, year, month, liters, total_cost, monthly_mileage)\n"
            "- tool_add_spare: car_id, title, installed_at, (description, part_price, job_price, job_description)\n"
            "- tool_update_spare: record_id, (car_id, title, description, part_price, job_price, job_description, installed_at)\n"
            "- tool_add_insurance: car_id, number, start_date, end_date, (insurance_type, cost)\n"
            "- tool_update_insurance: record_id, (car_id, insurance_type, number, start_date, end_date, cost)\n"
            "- tool_add_inspection: car_id, number, inspected_at, (cost)\n"
            "- tool_update_inspection: record_id, (car_id, number, inspected_at, cost)\n"
            '- tool_delete_record: model_name in ["fuel","spare","insurance","inspection"], record_id\n'
            "- tool_list_cars: (status, brand, search)\n\n"
            "ACTION JSON FORMAT:\n"
            '```json\n'
            '{"action":"tool_update_fuel","params":{"record_id":12,"total_cost":9200},"description":"Update fuel record #12 cost to 9200"}\n'
            '```\n'
        )

        action_prompt = _build_action_prompt()

        # Get recent conversation history for context
        if conversation:
            # Use the specific conversation's messages
            recent_msgs = AIChatMessage.objects.filter(
                conversation=conversation,
            ).order_by('-created_at')[:MAX_HISTORY_MESSAGES]
        else:
            # Fallback to user's messages (legacy behavior)
            recent_msgs = AIChatMessage.objects.filter(
                company=company,
                user=user,
            ).order_by('-created_at')[:MAX_HISTORY_MESSAGES]

        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "system", "content": f"COMPANY CONTEXT:\n{context}"},
            {"role": "system", "content": action_prompt},
        ]

        # Add conversation history (reversed to chronological order)
        for msg in reversed(list(recent_msgs)):
            role = "assistant" if msg.role == RoleChoices.ASSISTANT else "user"
            messages.append({"role": role, "content": msg.content})

        messages.append({"role": "user", "content": question})

        # Log the API call details
        logger.info(f"Making Groq API call for user {user.id}")
        logger.info(f"Model: {model}")
        logger.info(f"Messages count: {len(messages)}")
        logger.debug(f"First 500 chars of last message: {messages[-1]['content'][:500] if messages else 'N/A'}")

        try:
            response = client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=0.4,
                max_tokens=1100,
            )
            
            # Log successful response
            logger.info(f"Groq API response received for user {user.id}")
            logger.info(f"Response ID: {getattr(response, 'id', 'N/A')}")
            logger.info(f"Response model: {getattr(response, 'model', 'N/A')}")
            logger.info(f"Usage - Prompt tokens: {getattr(getattr(response, 'usage', None), 'prompt_tokens', 'N/A')}, "
                       f"Completion tokens: {getattr(getattr(response, 'usage', None), 'completion_tokens', 'N/A')}")
            
            answer = response.choices[0].message.content
            logger.info(f"AI response for user {user.id}: {len(answer)} chars, first 100 chars: {answer[:100]}")
            return answer
        except Exception as api_error:
            # Log the full API error details
            error_type = type(api_error).__name__
            error_msg = str(api_error)
            logger.error(f"Groq API call failed for user {user.id}")
            logger.error(f"Error type: {error_type}")
            logger.error(f"Error message: {error_msg}")
            logger.error(f"Full traceback:", exc_info=True)
            
            # If it's a Groq error, try to get more details
            if hasattr(api_error, 'message'):
                logger.error(f"Groq error message attribute: {api_error.message}")
            if hasattr(api_error, 'status_code'):
                logger.error(f"HTTP status code: {api_error.status_code}")
            if hasattr(api_error, 'response'):
                logger.error(f"Response object: {api_error.response}")
            
            raise  # Re-raise to be caught by outer exception handler

    except Exception as e:
        error_msg = str(e)
        error_type = type(e).__name__
        logger.error(f"Groq API error for user {user.id}: {error_msg}", exc_info=True)
        logger.error(f"Error type name: {error_type}")
        
        # Log all error attributes
        if hasattr(e, 'message'):
            logger.error(f"Error.message: {e.message}")
        if hasattr(e, 'status_code'):
            logger.error(f"Error.status_code: {e.status_code}")
        if hasattr(e, 'code'):
            logger.error(f"Error.code: {e.code}")
        if hasattr(e, 'type'):
            logger.error(f"Error.type: {e.type}")
        if hasattr(e, 'response') and e.response is not None:
            logger.error(f"Error.response.status: {e.response.status_code if hasattr(e.response, 'status_code') else 'N/A'}")
            try:
                error_body = e.response.text if hasattr(e.response, 'text') else str(e.response)
                logger.error(f"Error.response.body: {error_body[:500]}")
            except:
                pass

        # Determine error type and return detailed message
        if 'api_key' in error_msg.lower() or 'invalid_api_key' in error_msg.lower() or 'authentication' in error_msg.lower():
            return (
                "🔑 Ошибка авторизации: API-ключ недействителен или истёк.\n\n"
                f"Детали ошибки: {error_msg}\n\n"
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
                f"📋 Технические детали: {error_msg}\n\n"
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
