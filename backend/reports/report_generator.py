"""
Flexible report generation engine
"""
from datetime import date
from typing import Any, Dict, List, Optional

from django.db.models import Sum, Avg, Count, Q
from companies.models import Company
from fleet.models import Car, Fuel, Insurance, Inspection, Spare


class ReportGenerator:
    """Main report generator with support for multiple report types"""

    @staticmethod
    def generate(
        report_type: str,
        from_date: date,
        to_date: date,
        company: Company,
        car_ids: Optional[List[int]] = None,
        filters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Generate report based on type and filters
        
        Args:
            report_type: Type of report to generate
            from_date: Start date for report
            to_date: End date for report
            company: User's company for filtering
            car_ids: List of car IDs or None for all cars
            filters: Additional filters specific to report type
            
        Returns:
            Dictionary with report data and summary
        """
        generator_map = {
            'fuel_consumption': FuelConsumptionReportGenerator,
            'maintenance_costs': MaintenanceCostsReportGenerator,
            'insurance_inspection': InsuranceInspectionReportGenerator,
            'vehicle_utilization': VehicleUtilizationReportGenerator,
            'cost_analysis': CostAnalysisReportGenerator,
        }

        generator_class = generator_map.get(report_type)
        if not generator_class:
            raise ValueError(f'Unknown report type: {report_type}')

        return generator_class.generate(from_date, to_date, company, car_ids, filters or {})


class FuelConsumptionReportGenerator:
    """Fuel consumption and efficiency report"""

    @staticmethod
    def generate(from_date, to_date, company, car_ids, filters):
        # Base queryset
        qs = Fuel.objects.filter(
            car__company=company,
            year__gte=from_date.year,
            year__lte=to_date.year
        )

        # Filter by cars if specified
        if car_ids:
            qs = qs.filter(car_id__in=car_ids)

        # Aggregate data
        data = []
        for fuel in qs.select_related('car'):
            data.append({
                'car_id': fuel.car.id,
                'car_numplate': fuel.car.numplate,
                'period': f'{fuel.year}-{str(fuel.month).zfill(2)}',
                'total_liters': float(fuel.liters or 0),
                'total_cost': float(fuel.total_cost or 0),
                'avg_consumption': float(fuel.consumption or 0),
                'mileage': fuel.monthly_mileage or 0,
            })

        # Calculate summary
        summary = {
            'total_vehicles': len(set(d['car_id'] for d in data)),
            'total_liters': sum(d['total_liters'] for d in data),
            'total_cost': sum(d['total_cost'] for d in data),
            'avg_consumption': sum(d['avg_consumption'] for d in data) / len(data) if data else 0,
        }

        return {
            'report_type': 'fuel_consumption',
            'from_date': str(from_date),
            'to_date': str(to_date),
            'data': data,
            'summary': summary
        }


class MaintenanceCostsReportGenerator:
    """Maintenance costs report"""

    @staticmethod
    def generate(from_date, to_date, company, car_ids, filters):
        # Use existing service logic
        from .services import get_maintenance_costs_report
        from .exporters import prepare_maintenance_costs_for_export

        raw_data = get_maintenance_costs_report(company, from_date, to_date, car_ids)
        data = prepare_maintenance_costs_for_export(raw_data)

        summary = {
            'total_vehicles': len(set(d.get('car_id') for d in data if 'car_id' in d)),
            'total_cost': sum(float(d.get('total_cost', 0)) for d in data),
        }

        return {
            'report_type': 'maintenance_costs',
            'from_date': str(from_date),
            'to_date': str(to_date),
            'data': data,
            'summary': summary
        }


class InsuranceInspectionReportGenerator:
    """Insurance and inspection status report"""

    @staticmethod
    def generate(from_date, to_date, company, car_ids, filters):
        # Use existing service logic
        from .services_additional import get_insurance_inspection_report
        from .exporters import prepare_insurance_inspection_for_export

        raw_data = get_insurance_inspection_report(company, from_date, to_date, car_ids)
        data = prepare_insurance_inspection_for_export(raw_data)

        return {
            'report_type': 'insurance_inspection',
            'from_date': str(from_date),
            'to_date': str(to_date),
            'data': data,
            'summary': {
                'total_items': len(data),
            }
        }


class VehicleUtilizationReportGenerator:
    """Vehicle utilization and mileage report"""

    @staticmethod
    def generate(from_date, to_date, company, car_ids, filters):
        # Get fuel records for mileage data
        qs = Fuel.objects.filter(car__company=company)
        if car_ids:
            qs = qs.filter(car_id__in=car_ids)

        # Group by car
        car_data = {}
        for fuel in qs.select_related('car'):
            car_id = fuel.car.id
            if car_id not in car_data:
                car_data[car_id] = {
                    'car_id': car_id,
                    'car_numplate': fuel.car.numplate,
                    'total_mileage': 0,
                    'months': 0,
                }
            car_data[car_id]['total_mileage'] += fuel.monthly_mileage or 0
            car_data[car_id]['months'] += 1

        # Convert to list and calculate averages
        data = []
        for car_id, info in car_data.items():
            avg_monthly = info['total_mileage'] / info['months'] if info['months'] > 0 else 0
            data.append({
                **info,
                'avg_monthly_mileage': round(avg_monthly, 2),
            })

        summary = {
            'total_vehicles': len(data),
            'total_mileage': sum(d['total_mileage'] for d in data),
        }

        return {
            'report_type': 'vehicle_utilization',
            'from_date': str(from_date),
            'to_date': str(to_date),
            'data': data,
            'summary': summary
        }


class CostAnalysisReportGenerator:
    """Comprehensive cost analysis report"""

    @staticmethod
    def generate(from_date, to_date, company, car_ids, filters):
        # Aggregate costs from different sources
        qs_cars = Car.objects.filter(company=company)
        if car_ids:
            qs_cars = qs_cars.filter(id__in=car_ids)

        data = []
        for car in qs_cars:
            # Fuel costs
            fuel_cost = Fuel.objects.filter(car=car).aggregate(
                total=Sum('total_cost')
            )['total'] or 0

            # Maintenance costs (spares)
            spare_cost = Spare.objects.filter(car=car).aggregate(
                total=Sum('price')
            )['total'] or 0

            # Insurance costs
            insurance_cost = Insurance.objects.filter(car=car).aggregate(
                total=Sum('cost')
            )['total'] or 0

            # Inspection costs
            inspection_cost = Inspection.objects.filter(car=car).aggregate(
                total=Sum('cost')
            )['total'] or 0

            total = fuel_cost + spare_cost + insurance_cost + inspection_cost

            data.append({
                'car_id': car.id,
                'car_numplate': car.numplate,
                'fuel_cost': float(fuel_cost),
                'maintenance_cost': float(spare_cost),
                'insurance_cost': float(insurance_cost),
                'inspection_cost': float(inspection_cost),
                'total_cost': float(total),
            })

        summary = {
            'total_vehicles': len(data),
            'total_fuel_cost': sum(d['fuel_cost'] for d in data),
            'total_maintenance_cost': sum(d['maintenance_cost'] for d in data),
            'total_insurance_cost': sum(d['insurance_cost'] for d in data),
            'total_inspection_cost': sum(d['inspection_cost'] for d in data),
            'grand_total': sum(d['total_cost'] for d in data),
        }

        return {
            'report_type': 'cost_analysis',
            'from_date': str(from_date),
            'to_date': str(to_date),
            'data': data,
            'summary': summary
        }
