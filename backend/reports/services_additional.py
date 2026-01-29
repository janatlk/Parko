"""
Дополнительные сервисы для отчетов по топливу и страховкам/техосмотрам.
"""
from __future__ import annotations

from datetime import date, timedelta
from typing import Any, Dict, List, Optional, TypedDict

from django.db.models import Sum, Count, Q
from django.db.models.functions import Coalesce
from django.utils import timezone

from fleet.models import Fuel, Insurance, Inspection


# --- Fuel Report Types ---

class FuelConsumptionRow(TypedDict):
    car_id: int
    car__numplate: str
    car__brand: str
    total_liters: int
    total_cost: int
    total_mileage: int
    avg_consumption: float


class FuelConsumptionReport(TypedDict):
    filters: Dict[str, Any]
    totals: Dict[str, Any]
    by_car: List[FuelConsumptionRow]


def get_fuel_consumption_report(
    *, company_id: int, from_date: str | None, to_date: str | None, car_id: int | None
) -> FuelConsumptionReport:
    """
    Отчет по расходу топлива и пробегу.
    
    Args:
        company_id: ID компании
        from_date: Дата начала периода (YYYY-MM-DD)
        to_date: Дата окончания периода (YYYY-MM-DD)
        car_id: ID машины (опционально)
    """
    qs = Fuel.objects.filter(car__company_id=company_id)

    # Фильтрация по датам (используем year и month для фильтрации)
    if from_date:
        year, month, _ = from_date.split('-')
        qs = qs.filter(Q(year__gt=int(year)) | (Q(year=int(year)) & Q(month__gte=int(month))))
    if to_date:
        year, month, _ = to_date.split('-')
        qs = qs.filter(Q(year__lt=int(year)) | (Q(year=int(year)) & Q(month__lte=int(month))))
    if car_id:
        qs = qs.filter(car_id=car_id)

    # Общие итоги
    totals = qs.aggregate(
        total_liters=Coalesce(Sum('quantity'), 0),
        total_cost=Coalesce(Sum('total_cost'), 0),
        total_mileage=Coalesce(Sum('monthly_mileage'), 0),
    )

    total_liters = int(totals.get('total_liters') or 0)
    total_cost = int(totals.get('total_cost') or 0)
    total_mileage = int(totals.get('total_mileage') or 0)
    
    # Средний расход (л/100км)
    avg_consumption = (total_liters / total_mileage * 100) if total_mileage > 0 else 0

    # По машинам
    by_car = (
        qs.values('car_id', 'car__numplate', 'car__brand')
        .annotate(
            total_liters=Coalesce(Sum('quantity'), 0),
            total_cost=Coalesce(Sum('total_cost'), 0),
            total_mileage=Coalesce(Sum('monthly_mileage'), 0),
        )
        .order_by('-total_cost', 'car__numplate')
    )

    # Добавляем средний расход для каждой машины
    by_car_with_avg = []
    for car in by_car:
        liters = car.get('total_liters', 0)
        mileage = car.get('total_mileage', 0)
        car['avg_consumption'] = round((liters / mileage * 100), 2) if mileage > 0 else 0
        by_car_with_avg.append(car)

    return {
        'filters': {
            'from': from_date,
            'to': to_date,
            'car': car_id,
        },
        'totals': {
            'total_liters': total_liters,
            'total_cost': total_cost,
            'total_mileage': total_mileage,
            'avg_consumption': round(avg_consumption, 2),
        },
        'by_car': by_car_with_avg,
    }


# --- Insurance/Inspection Report Types ---

class InsuranceInspectionRow(TypedDict):
    type: str  # 'insurance' or 'inspection'
    car_id: int
    car__numplate: str
    number: str
    start_date: Optional[str]
    end_date: str
    cost: int
    status: str  # 'active', 'expiring_soon', 'expired'


class InsuranceInspectionReport(TypedDict):
    filters: Dict[str, Any]
    summary: Dict[str, int]
    items: List[InsuranceInspectionRow]


def get_insurance_inspection_report(
    *, company_id: int, status_filter: str | None = None, car_id: int | None = None
) -> InsuranceInspectionReport:
    """
    Отчет по страховкам и техосмотрам.
    
    Args:
        company_id: ID компании
        status_filter: Фильтр по статусу ('active', 'expiring_soon', 'expired')
        car_id: ID машины (опционально)
    """
    today = timezone.now().date()
    expiring_threshold = today + timedelta(days=30)  # Скоро истекает = в течение 30 дней

    # Страховки
    insurance_qs = Insurance.objects.filter(car__company_id=company_id)
    if car_id:
        insurance_qs = insurance_qs.filter(car_id=car_id)

    # Техосмотры
    inspection_qs = Inspection.objects.filter(car__company_id=company_id)
    if car_id:
        inspection_qs = inspection_qs.filter(car_id=car_id)

    items = []
    
    # Обработка страховок
    for ins in insurance_qs.select_related('car'):
        if ins.end_date < today:
            status = 'expired'
        elif ins.end_date <= expiring_threshold:
            status = 'expiring_soon'
        else:
            status = 'active'

        if status_filter and status != status_filter:
            continue

        items.append({
            'type': 'insurance',
            'car_id': ins.car_id,
            'car__numplate': ins.car.numplate,
            'number': ins.number,
            'start_date': str(ins.start_date) if ins.start_date else None,
            'end_date': str(ins.end_date),
            'cost': ins.cost,
            'status': status,
        })

    # Обработка техосмотров (предполагаем, что inspected_at - это дата окончания действия)
    for insp in inspection_qs.select_related('car'):
        # Техосмотр действует 1 год от даты проведения
        end_date = insp.inspected_at + timedelta(days=365)
        
        if end_date < today:
            status = 'expired'
        elif end_date <= expiring_threshold:
            status = 'expiring_soon'
        else:
            status = 'active'

        if status_filter and status != status_filter:
            continue

        items.append({
            'type': 'inspection',
            'car_id': insp.car_id,
            'car__numplate': insp.car.numplate,
            'number': insp.number,
            'start_date': str(insp.inspected_at),
            'end_date': str(end_date),
            'cost': insp.cost,
            'status': status,
        })

    # Сортировка по дате окончания
    items.sort(key=lambda x: x['end_date'])

    # Подсчет по статусам
    summary = {
        'active': len([i for i in items if i['status'] == 'active']),
        'expiring_soon': len([i for i in items if i['status'] == 'expiring_soon']),
        'expired': len([i for i in items if i['status'] == 'expired']),
    }

    return {
        'filters': {
            'status': status_filter,
            'car': car_id,
        },
        'summary': summary,
        'items': items,
    }
