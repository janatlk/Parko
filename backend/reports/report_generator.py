"""
Flexible report generation engine with chart data support
"""
from datetime import date
from typing import Any, Dict, List, Optional
from collections import defaultdict

from django.db.models import Sum, Avg, Count, Q
from companies.models import Company
from fleet.models import Car, Fuel, Insurance, Inspection, Spare


class ReportGenerator:
    """Main report generator with support for multiple report types"""

    CHART_COLORS = [
        'rgba(59, 130, 246, 0.7)',   # blue
        'rgba(16, 185, 129, 0.7)',   # green
        'rgba(245, 158, 11, 0.7)',   # amber
        'rgba(239, 68, 68, 0.7)',    # red
        'rgba(139, 92, 246, 0.7)',   # purple
        'rgba(236, 72, 153, 0.7)',   # pink
        'rgba(20, 184, 166, 0.7)',   # teal
        'rgba(249, 115, 22, 0.7)',   # orange
    ]

    @staticmethod
    def generate(
        report_type: str,
        from_date: date,
        to_date: date,
        company: Company,
        car_ids: Optional[List[int]] = None,
        filters: Optional[Dict[str, Any]] = None,
        include_charts: bool = True
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
            include_charts: Whether to include chart data

        Returns:
            Dictionary with report data, summary and charts
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

        result = generator_class.generate(from_date, to_date, company, car_ids, filters or {})
        
        if include_charts:
            result['charts'] = generator_class.generate_charts(result)
        
        return result


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

    @staticmethod
    def generate_charts(report_data):
        """Generate chart data for fuel consumption report"""
        charts = []
        data = report_data.get('data', [])
        
        if not data:
            return charts
        
        # Chart 1: Fuel Consumption by Vehicle (Bar Chart)
        car_liters = defaultdict(float)
        car_costs = defaultdict(float)
        for row in data:
            car_liters[row['car_numplate']] += row['total_liters']
            car_costs[row['car_numplate']] += row['total_cost']
        
        cars = list(car_liters.keys())
        liters = [car_liters[c] for c in cars]
        costs = [car_costs[c] for c in cars]
        
        charts.append({
            'type': 'bar',
            'title': 'Fuel Consumption by Vehicle',
            'data': {
                'labels': cars,
                'datasets': [
                    {
                        'label': 'Liters',
                        'data': liters,
                        'backgroundColor': 'rgba(59, 130, 246, 0.7)',
                    },
                    {
                        'label': 'Cost (som)',
                        'data': costs,
                        'backgroundColor': 'rgba(16, 185, 129, 0.7)',
                    },
                ]
            }
        })
        
        # Chart 2: Monthly Consumption Trend (Line Chart)
        monthly_data = defaultdict(lambda: {'liters': 0, 'cost': 0})
        for row in data:
            period = row['period']
            monthly_data[period]['liters'] += row['total_liters']
            monthly_data[period]['cost'] += row['total_cost']
        
        periods = sorted(monthly_data.keys())
        monthly_liters = [monthly_data[p]['liters'] for p in periods]
        monthly_costs = [monthly_data[p]['cost'] for p in periods]
        
        if len(periods) > 1:
            charts.append({
                'type': 'line',
                'title': 'Monthly Consumption Trend',
                'data': {
                    'labels': periods,
                    'datasets': [
                        {
                            'label': 'Liters',
                            'data': monthly_liters,
                            'borderColor': 'rgba(59, 130, 246, 1)',
                            'backgroundColor': 'rgba(59, 130, 246, 0.1)',
                            'tension': 0.3,
                        },
                        {
                            'label': 'Cost (som)',
                            'data': monthly_costs,
                            'borderColor': 'rgba(245, 158, 11, 1)',
                            'backgroundColor': 'rgba(245, 158, 11, 0.1)',
                            'tension': 0.3,
                        },
                    ]
                }
            })
        
        # Chart 3: Cost Distribution by Vehicle (Pie Chart)
        if len(cars) > 1:
            charts.append({
                'type': 'pie',
                'title': 'Fuel Cost Distribution by Vehicle',
                'data': {
                    'labels': cars,
                    'data': costs,
                    'backgroundColor': ReportGenerator.CHART_COLORS[:len(cars)],
                }
            })
        
        return charts


class MaintenanceCostsReportGenerator:
    """Maintenance costs report"""

    @staticmethod
    def generate(from_date, to_date, company, car_ids, filters):
        # Use existing service logic
        from .services import get_maintenance_costs_report
        from .exporters import prepare_maintenance_costs_for_export

        try:
            # The service expects: company_id, from_date, to_date, car_id (as keyword args)
            raw_data = get_maintenance_costs_report(
                company_id=company.id,
                from_date=str(from_date) if from_date else None,
                to_date=str(to_date) if to_date else None,
                car_id=car_ids[0] if car_ids else None
            )
            data = prepare_maintenance_costs_for_export(raw_data)
        except Exception as e:
            # Return empty data if there's an error
            data = []

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

    @staticmethod
    def generate_charts(report_data):
        """Generate chart data for maintenance costs report"""
        charts = []
        data = report_data.get('data', [])

        if not data:
            return charts

        # Filter out the total row - check for both Russian and English keys
        car_data = [d for d in data if d.get('Машина (номер)', d.get('car_numplate', '')) != 'ИТОГО']

        if not car_data:
            return charts

        # Chart 1: Maintenance Costs by Vehicle (Bar Chart)
        cars = [d.get('Машина (номер)', d.get('car_numplate', 'Unknown')) for d in car_data]
        part_costs = [float(d.get('Стоимость запчастей (сом)', d.get('parts_cost', 0))) for d in car_data]
        job_costs = [float(d.get('Стоимость работ (сом)', d.get('labor_cost', 0))) for d in car_data]
        totals = [float(d.get('Итого (сом)', d.get('total', 0))) for d in car_data]

        charts.append({
            'type': 'bar',
            'title': 'Maintenance Costs by Vehicle',
            'data': {
                'labels': cars,
                'datasets': [
                    {
                        'label': 'Parts Cost',
                        'data': part_costs,
                        'backgroundColor': 'rgba(59, 130, 246, 0.7)',
                    },
                    {
                        'label': 'Labor Cost',
                        'data': job_costs,
                        'backgroundColor': 'rgba(16, 185, 129, 0.7)',
                    },
                    {
                        'label': 'Total',
                        'data': totals,
                        'backgroundColor': 'rgba(245, 158, 11, 0.7)',
                    },
                ]
            }
        })

        # Chart 2: Parts vs Labor Ratio (Pie Chart)
        total_parts = sum(part_costs)
        total_labor = sum(job_costs)

        if total_parts > 0 or total_labor > 0:
            charts.append({
                'type': 'doughnut',
                'title': 'Parts vs Labor Ratio',
                'data': {
                    'labels': ['Parts', 'Labor'],
                    'data': [total_parts, total_labor],
                    'backgroundColor': ['rgba(59, 130, 246, 0.7)', 'rgba(16, 185, 129, 0.7)'],
                }
            })

        return charts


class InsuranceInspectionReportGenerator:
    """Insurance and inspection status report"""

    @staticmethod
    def generate(from_date, to_date, company, car_ids, filters):
        # Use existing service logic - note: this report doesn't use date ranges
        from .services_additional import get_insurance_inspection_report
        from .exporters import prepare_insurance_inspection_for_export

        try:
            # The service expects: company_id, status_filter, car_id
            raw_data = get_insurance_inspection_report(
                company_id=company.id,
                status_filter=None,  # No status filter
                car_id=car_ids[0] if car_ids else None
            )
            data = prepare_insurance_inspection_for_export(raw_data)
        except Exception as e:
            # Return empty data if there's an error
            data = []

        return {
            'report_type': 'insurance_inspection',
            'from_date': str(from_date),
            'to_date': str(to_date),
            'data': data,
            'summary': {
                'total_items': len(data),
            }
        }

    @staticmethod
    def generate_charts(report_data):
        """Generate chart data for insurance/inspection report"""
        charts = []
        data = report_data.get('data', [])

        if not data:
            return charts

        # Chart 1: Status Distribution (Pie Chart)
        status_counts = defaultdict(int)
        for item in data:
            # Support both Russian and English keys
            status = item.get('Статус', item.get('status', 'Unknown'))
            status_counts[status] += 1

        if status_counts:
            charts.append({
                'type': 'pie',
                'title': 'Insurance/Inspection Status Distribution',
                'data': {
                    'labels': list(status_counts.keys()),
                    'data': list(status_counts.values()),
                    'backgroundColor': [
                        'rgba(16, 185, 129, 0.7)',  # Active - green
                        'rgba(245, 158, 11, 0.7)',  # Expiring soon - amber
                        'rgba(239, 68, 68, 0.7)',   # Expired - red
                    ],
                }
            })

        # Chart 2: Type Distribution (Bar Chart)
        type_counts = defaultdict(int)
        for item in data:
            # Support both Russian and English keys
            item_type = item.get('Тип', item.get('type', 'Unknown'))
            type_counts[item_type] += 1

        if len(type_counts) > 1:
            charts.append({
                'type': 'bar',
                'title': 'Insurance vs Inspections',
                'data': {
                    'labels': list(type_counts.keys()),
                    'datasets': [
                        {
                            'label': 'Count',
                            'data': list(type_counts.values()),
                            'backgroundColor': 'rgba(59, 130, 246, 0.7)',
                        }
                    ]
                }
            })

        return charts


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

    @staticmethod
    def generate_charts(report_data):
        """Generate chart data for vehicle utilization report"""
        charts = []
        data = report_data.get('data', [])
        
        if not data:
            return charts
        
        # Chart 1: Mileage by Vehicle (Bar Chart)
        cars = [d['car_numplate'] for d in data]
        mileages = [d['total_mileage'] for d in data]
        avg_mileages = [d['avg_monthly_mileage'] for d in data]
        
        charts.append({
            'type': 'bar',
            'title': 'Total Mileage by Vehicle',
            'data': {
                'labels': cars,
                'datasets': [
                    {
                        'label': 'Total Mileage (km)',
                        'data': mileages,
                        'backgroundColor': 'rgba(59, 130, 246, 0.7)',
                    },
                ]
            }
        })
        
        # Chart 2: Average Monthly Mileage (Line Chart)
        if len(data) > 1:
            charts.append({
                'type': 'line',
                'title': 'Average Monthly Mileage',
                'data': {
                    'labels': cars,
                    'datasets': [
                        {
                            'label': 'Avg Monthly Mileage (km)',
                            'data': avg_mileages,
                            'borderColor': 'rgba(16, 185, 129, 1)',
                            'backgroundColor': 'rgba(16, 185, 129, 0.1)',
                            'tension': 0.3,
                        },
                    ]
                }
            })
        
        return charts


class CostAnalysisReportGenerator:
    """Comprehensive cost analysis report"""

    @staticmethod
    def generate(from_date, to_date, company, car_ids, filters):
        # Aggregate costs from different sources
        from decimal import Decimal
        
        try:
            qs_cars = Car.objects.filter(company=company)
            if car_ids:
                qs_cars = qs_cars.filter(id__in=car_ids)

            data = []
            for car in qs_cars:
                # Fuel costs
                fuel_agg = Fuel.objects.filter(car=car).aggregate(
                    total=Sum('total_cost')
                )
                fuel_cost = fuel_agg['total'] or 0
                if isinstance(fuel_cost, Decimal):
                    fuel_cost = float(fuel_cost)

                # Maintenance costs (spares)
                spare_agg = Spare.objects.filter(car=car).aggregate(
                    total=Sum('price')
                )
                spare_cost = spare_agg['total'] or 0
                if isinstance(spare_cost, Decimal):
                    spare_cost = float(spare_cost)

                # Insurance costs
                insurance_agg = Insurance.objects.filter(car=car).aggregate(
                    total=Sum('cost')
                )
                insurance_cost = insurance_agg['total'] or 0
                if isinstance(insurance_cost, Decimal):
                    insurance_cost = float(insurance_cost)

                # Inspection costs
                inspection_agg = Inspection.objects.filter(car=car).aggregate(
                    total=Sum('cost')
                )
                inspection_cost = inspection_agg['total'] or 0
                if isinstance(inspection_cost, Decimal):
                    inspection_cost = float(inspection_cost)

                total = fuel_cost + spare_cost + insurance_cost + inspection_cost

                data.append({
                    'car_id': car.id,
                    'car_numplate': car.numplate,
                    'fuel_cost': fuel_cost,
                    'maintenance_cost': spare_cost,
                    'insurance_cost': insurance_cost,
                    'inspection_cost': inspection_cost,
                    'total_cost': total,
                })
        except Exception as e:
            # Return empty data if there's an error
            data = []

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

    @staticmethod
    def generate_charts(report_data):
        """Generate chart data for cost analysis report"""
        charts = []
        data = report_data.get('data', [])
        
        if not data:
            return charts
        
        # Chart 1: Total Costs by Vehicle (Bar Chart)
        cars = [d['car_numplate'] for d in data]
        total_costs = [d['total_cost'] for d in data]
        
        charts.append({
            'type': 'bar',
            'title': 'Total Costs by Vehicle',
            'data': {
                'labels': cars,
                'datasets': [
                    {
                        'label': 'Total Cost (som)',
                        'data': total_costs,
                        'backgroundColor': 'rgba(59, 130, 246, 0.7)',
                    },
                ]
            }
        })
        
        # Chart 2: Cost Breakdown by Category (Stacked Bar Chart)
        fuel_costs = [d['fuel_cost'] for d in data]
        maintenance_costs = [d['maintenance_cost'] for d in data]
        insurance_costs = [d['insurance_cost'] for d in data]
        inspection_costs = [d['inspection_cost'] for d in data]
        
        charts.append({
            'type': 'bar',
            'title': 'Cost Breakdown by Category',
            'data': {
                'labels': cars,
                'datasets': [
                    {
                        'label': 'Fuel',
                        'data': fuel_costs,
                        'backgroundColor': 'rgba(59, 130, 246, 0.7)',
                    },
                    {
                        'label': 'Maintenance',
                        'data': maintenance_costs,
                        'backgroundColor': 'rgba(16, 185, 129, 0.7)',
                    },
                    {
                        'label': 'Insurance',
                        'data': insurance_costs,
                        'backgroundColor': 'rgba(245, 158, 11, 0.7)',
                    },
                    {
                        'label': 'Inspection',
                        'data': inspection_costs,
                        'backgroundColor': 'rgba(139, 92, 246, 0.7)',
                    },
                ]
            }
        })
        
        # Chart 3: Cost Distribution (Pie Chart)
        summary = report_data.get('summary', {})
        if summary:
            cost_types = {
                'Fuel': summary.get('total_fuel_cost', 0),
                'Maintenance': summary.get('total_maintenance_cost', 0),
                'Insurance': summary.get('total_insurance_cost', 0),
                'Inspection': summary.get('total_inspection_cost', 0),
            }
            non_zero_costs = {k: v for k, v in cost_types.items() if v > 0}
            
            if len(non_zero_costs) > 1:
                charts.append({
                    'type': 'pie',
                    'title': 'Cost Distribution by Category',
                    'data': {
                        'labels': list(non_zero_costs.keys()),
                        'data': list(non_zero_costs.values()),
                        'backgroundColor': [
                            'rgba(59, 130, 246, 0.7)',
                            'rgba(16, 185, 129, 0.7)',
                            'rgba(245, 158, 11, 0.7)',
                            'rgba(139, 92, 246, 0.7)',
                        ][:len(non_zero_costs)],
                    }
                })
        
        return charts
