from __future__ import annotations

from typing import Any, Dict, List, Optional, TypedDict
from datetime import datetime, timedelta
from django.db.models import F, IntegerField, Sum, FloatField, Q
from django.db.models.functions import Coalesce

from fleet.models import Fuel, Spare, Insurance, Inspection


class CostPerKmFilters(TypedDict, total=False):
    start_date: Optional[str]
    end_date: Optional[str]
    vehicle_ids: Optional[List[int]]
    vehicle_type: Optional[str]
    region: Optional[str]


class CostPerKmSummary(TypedDict):
    total_cost: int
    total_distance: int
    avg_cost_per_km: float
    vehicle_count: int


class CostPerKmVehicleRow(TypedDict):
    vehicle_id: int
    numplate: str
    brand: str
    model: str
    fuel_cost: int
    maintenance_cost: int
    insurance_cost: int
    inspection_cost: int
    total_cost: int
    total_distance: int
    cost_per_km: float
    fuel_cost_per_km: float
    maintenance_cost_per_km: float


class CostPerKmReport(TypedDict):
    filters: Dict[str, Any]
    summary: CostPerKmSummary
    by_vehicle: List[CostPerKmVehicleRow]


def get_cost_per_km_report(
    *,
    company_id: int,
    start_date: str | None = None,
    end_date: str | None = None,
    vehicle_ids: list[int] | None = None,
    vehicle_type: str | None = None,
    region: str | None = None,
) -> CostPerKmReport:
    """
    Generate cost per kilometer report.
    
    Calculates total operating costs (fuel, maintenance, insurance, inspection)
    divided by total distance traveled for each vehicle.
    """
    
    # Build base querysets filtered by company
    fuel_qs = Fuel.objects.filter(car__company_id=company_id)
    spare_qs = Spare.objects.filter(car__company_id=company_id)
    insurance_qs = Insurance.objects.filter(car__company_id=company_id)
    inspection_qs = Inspection.objects.filter(car__company_id=company_id)
    
    # Apply date filters
    if start_date:
        fuel_qs = fuel_qs.filter(year__gte=int(start_date[:4]), month__gte=int(start_date[5:7]) if len(start_date) >= 7 else 1)
        spare_qs = spare_qs.filter(installed_at__gte=start_date)
        insurance_qs = insurance_qs.filter(start_date__gte=start_date)
        inspection_qs = inspection_qs.filter(inspected_at__gte=start_date)
    
    if end_date:
        fuel_qs = fuel_qs.filter(year__lte=int(end_date[:4]), month__lte=int(end_date[5:7]) if len(end_date) >= 7 else 12)
        spare_qs = spare_qs.filter(installed_at__lte=end_date)
        insurance_qs = insurance_qs.filter(end_date__lte=end_date)
        inspection_qs = inspection_qs.filter(inspected_at__lte=end_date)
    
    # Apply vehicle filters
    if vehicle_ids:
        fuel_qs = fuel_qs.filter(car_id__in=vehicle_ids)
        spare_qs = spare_qs.filter(car_id__in=vehicle_ids)
        insurance_qs = insurance_qs.filter(car_id__in=vehicle_ids)
        inspection_qs = inspection_qs.filter(car_id__in=vehicle_ids)
    
    # Apply vehicle type filter
    if vehicle_type:
        fuel_qs = fuel_qs.filter(car__type=vehicle_type)
        spare_qs = spare_qs.filter(car__type=vehicle_type)
        insurance_qs = insurance_qs.filter(car__type=vehicle_type)
        inspection_qs = inspection_qs.filter(car__type=vehicle_type)
    
    # Apply region filter
    if region:
        fuel_qs = fuel_qs.filter(car__region=region)
        spare_qs = spare_qs.filter(car__region=region)
        insurance_qs = insurance_qs.filter(car__region=region)
        inspection_qs = inspection_qs.filter(car__region=region)
    
    # Get unique vehicle IDs from fuel records (has mileage data)
    vehicle_ids_with_data = list(fuel_qs.values_list('car_id', flat=True).distinct())
    
    # Calculate costs by vehicle
    by_vehicle = []
    total_cost_all = 0
    total_distance_all = 0
    
    for car_id in vehicle_ids_with_data:
        # Get car info
        from fleet.models import Car
        try:
            car = Car.objects.get(id=car_id)
        except Car.DoesNotExist:
            continue
        
        # Fuel costs and distance
        fuel_data = fuel_qs.filter(car_id=car_id).aggregate(
            fuel_cost=Coalesce(Sum('total_cost'), 0, output_field=IntegerField()),
            distance=Coalesce(Sum('monthly_mileage'), 0, output_field=IntegerField()),
        )
        fuel_cost = int(fuel_data.get('fuel_cost') or 0)
        distance = int(fuel_data.get('distance') or 0)
        
        # Maintenance costs
        maintenance_data = spare_qs.filter(car_id=car_id).aggregate(
            maintenance_cost=Coalesce(Sum('part_price'), 0, output_field=IntegerField()) 
                          + Coalesce(Sum('job_price'), 0, output_field=IntegerField()),
        )
        maintenance_cost = int(maintenance_data.get('maintenance_cost') or 0)
        
        # Insurance costs (prorated by months in period)
        insurance_data = insurance_qs.filter(car_id=car_id).aggregate(
            insurance_cost=Coalesce(Sum('cost'), 0, output_field=IntegerField()),
        )
        insurance_cost = int(insurance_data.get('insurance_cost') or 0)
        
        # Inspection costs
        inspection_data = inspection_qs.filter(car_id=car_id).aggregate(
            inspection_cost=Coalesce(Sum('cost'), 0, output_field=IntegerField()),
        )
        inspection_cost = int(inspection_data.get('inspection_cost') or 0)
        
        # Totals
        vehicle_total_cost = fuel_cost + maintenance_cost + insurance_cost + inspection_cost
        total_cost_all += vehicle_total_cost
        total_distance_all += distance
        
        # Cost per km calculations
        cost_per_km = round(vehicle_total_cost / distance, 2) if distance > 0 else 0
        fuel_cost_per_km = round(fuel_cost / distance, 2) if distance > 0 else 0
        maintenance_cost_per_km = round(maintenance_cost / distance, 2) if distance > 0 else 0
        
        by_vehicle.append({
            'vehicle_id': car_id,
            'numplate': car.numplate,
            'brand': car.brand,
            'model': car.title,
            'fuel_cost': fuel_cost,
            'maintenance_cost': maintenance_cost,
            'insurance_cost': insurance_cost,
            'inspection_cost': inspection_cost,
            'total_cost': vehicle_total_cost,
            'total_distance': distance,
            'cost_per_km': cost_per_km,
            'fuel_cost_per_km': fuel_cost_per_km,
            'maintenance_cost_per_km': maintenance_cost_per_km,
        })
    
    # Sort by cost per km (highest first)
    by_vehicle.sort(key=lambda x: x['cost_per_km'], reverse=True)
    
    # Summary calculations
    vehicle_count = len(by_vehicle)
    avg_cost_per_km = round(total_cost_all / total_distance_all, 2) if total_distance_all > 0 else 0
    
    return {
        'filters': {
            'start_date': start_date,
            'end_date': end_date,
            'vehicle_ids': vehicle_ids,
            'vehicle_type': vehicle_type,
            'region': region,
        },
        'summary': {
            'total_cost': total_cost_all,
            'total_distance': total_distance_all,
            'avg_cost_per_km': avg_cost_per_km,
            'vehicle_count': vehicle_count,
        },
        'by_vehicle': by_vehicle,
    }
