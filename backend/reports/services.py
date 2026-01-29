from __future__ import annotations

from typing import Any, Dict, List, Optional, TypedDict

from django.db.models import F, IntegerField, Sum
from django.db.models.functions import Coalesce

from fleet.models import Spare


class MaintenanceCostsFilters(TypedDict, total=False):
    from_date: Optional[str]
    to_date: Optional[str]
    car: Optional[int]


class MaintenanceCostsTotals(TypedDict):
    part_total: int
    job_total: int
    total: int


class MaintenanceCostsByCarRow(TypedDict):
    car_id: int
    car__numplate: str
    part_total: int
    job_total: int
    total: int


class MaintenanceCostsReport(TypedDict):
    filters: Dict[str, Any]
    totals: MaintenanceCostsTotals
    by_car: List[MaintenanceCostsByCarRow]


def get_maintenance_costs_report(*, company_id: int, from_date: str | None, to_date: str | None, car_id: int | None) -> MaintenanceCostsReport:
    qs = Spare.objects.filter(car__company_id=company_id)

    if from_date:
        qs = qs.filter(installed_at__gte=from_date)
    if to_date:
        qs = qs.filter(installed_at__lte=to_date)
    if car_id:
        qs = qs.filter(car_id=car_id)

    totals = qs.aggregate(
        total_part=Coalesce(Sum('part_price'), 0, output_field=IntegerField()),
        total_job=Coalesce(Sum('job_price'), 0, output_field=IntegerField()),
    )

    total_part = int(totals.get('total_part') or 0)
    total_job = int(totals.get('total_job') or 0)

    by_car = (
        qs.values('car_id', 'car__numplate')
        .annotate(
            part_total=Coalesce(Sum('part_price'), 0, output_field=IntegerField()),
            job_total=Coalesce(Sum('job_price'), 0, output_field=IntegerField()),
        )
        .annotate(total=F('part_total') + F('job_total'))
        .order_by('-total', 'car__numplate')
    )

    return {
        'filters': {
            'from': from_date,
            'to': to_date,
            'car': car_id,
        },
        'totals': {
            'part_total': total_part,
            'job_total': total_job,
            'total': total_part + total_job,
        },
        'by_car': list(by_car),
    }
