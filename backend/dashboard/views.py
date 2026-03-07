from django.utils import timezone
from datetime import timedelta
from django.db.models import Sum, Count, Q, Avg
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from fleet.models import Car, Fuel, Insurance, Inspection, Spare


class DashboardStatsView(APIView):
    """Get dashboard statistics for the current user's company."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        company = request.user.company
        
        # Car statistics
        total_cars = Car.objects.filter(company=company).count()
        active_cars = Car.objects.filter(company=company, status='ACTIVE').count()
        maintenance_cars = Car.objects.filter(company=company, status='MAINTENANCE').count()
        inactive_cars = Car.objects.filter(company=company, status='INACTIVE').count()
        
        # Fuel statistics for current month
        now = timezone.now()
        current_month = now.month
        current_year = now.year
        
        fuel_this_month = Fuel.objects.filter(
            car__company=company,
            month=current_month,
            year=current_year
        )
        total_fuel_cost_month = fuel_this_month.aggregate(total=Sum('total_cost'))['total'] or 0
        
        # Calculate average fuel consumption
        avg_consumption_data = fuel_this_month.aggregate(
            avg_liters=Avg('liters'),
            avg_mileage=Avg('monthly_mileage')
        )
        avg_fuel_consumption = 0
        if avg_consumption_data['avg_liters'] and avg_consumption_data['avg_mileage']:
            if avg_consumption_data['avg_mileage'] > 0:
                avg_fuel_consumption = round(
                    (avg_consumption_data['avg_liters'] / avg_consumption_data['avg_mileage']) * 100, 
                    2
                )
        
        # Maintenance cost for current month (from spares)
        maintenance_cost_month = Spare.objects.filter(
            car__company=company,
            installed_at__year=current_year,
            installed_at__month=current_month
        ).aggregate(
            total=Sum('part_price') + Sum('job_price')
        )['total'] or 0
        
        # Insurance statistics
        total_insurances = Insurance.objects.filter(car__company=company).count()
        active_insurances = Insurance.objects.filter(
            car__company=company,
            end_date__gte=now.date()
        ).count()
        
        # Inspection statistics  
        total_inspections = Inspection.objects.filter(car__company=company).count()
        active_inspections = Inspection.objects.filter(
            car__company=company,
            inspected_at__gte=now.date() - timedelta(days=365)
        ).count()
        
        return Response({
            'total_cars': total_cars,
            'active_cars': active_cars,
            'maintenance_cars': maintenance_cars,
            'inactive_cars': inactive_cars,
            'total_fuel_records': fuel_this_month.count(),
            'total_insurances': total_insurances,
            'active_insurances': active_insurances,
            'expiring_insurances': 0,
            'total_inspections': total_inspections,
            'active_inspections': active_inspections,
            'expiring_inspections': 0,
            'total_fuel_cost_month': round(float(total_fuel_cost_month), 2),
            'total_maintenance_cost_month': round(float(maintenance_cost_month), 2),
            'avg_fuel_consumption': avg_fuel_consumption,
        })


class DashboardExpiringView(APIView):
    """Get expiring insurance and inspection items."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        company = request.user.company
        now = timezone.now().date()
        warning_days = 30
        
        expiring_items = []
        
        # Expiring insurances
        insurances = Insurance.objects.filter(
            car__company=company,
            end_date__lte=now + timedelta(days=warning_days)
        ).select_related('car')
        
        for insurance in insurances:
            days_until = (insurance.end_date - now).days
            expiring_items.append({
                'id': insurance.id,
                'car_id': insurance.car.id,
                'car_numplate': insurance.car.numplate,
                'type': 'insurance',
                'end_date': insurance.end_date.isoformat(),
                'days_until_expiry': days_until,
                'cost': float(insurance.cost),
            })
        
        # Expiring inspections (valid for 1 year from inspection date)
        inspections = Inspection.objects.filter(
            car__company=company
        ).select_related('car')
        
        for inspection in inspections:
            expiry_date = inspection.inspected_at + timedelta(days=365)
            days_until = (expiry_date - now).days
            if days_until <= warning_days:
                expiring_items.append({
                    'id': inspection.id,
                    'car_id': inspection.car.id,
                    'car_numplate': inspection.car.numplate,
                    'type': 'inspection',
                    'end_date': expiry_date.isoformat(),
                    'days_until_expiry': days_until,
                    'cost': float(inspection.cost),
                })
        
        # Sort by days until expiry
        expiring_items.sort(key=lambda x: x['days_until_expiry'])
        
        return Response(expiring_items)


class DashboardRecentFuelView(APIView):
    """Get recent fuel entries."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        company = request.user.company
        limit = int(request.query_params.get('limit', 5))
        
        fuel_entries = Fuel.objects.filter(
            car__company=company
        ).select_related('car').order_by('-year', '-month', '-created_at')[:limit]
        
        data = []
        for fuel in fuel_entries:
            data.append({
                'id': fuel.id,
                'car_id': fuel.car.id,
                'car_numplate': fuel.car.numplate,
                'month': fuel.month,
                'year': fuel.year,
                'month_name': fuel.month_name,
                'liters': fuel.liters,
                'total_cost': fuel.total_cost,
                'monthly_mileage': fuel.monthly_mileage,
                'consumption': str(fuel.consumption),
                'created_at': fuel.created_at.isoformat() if fuel.created_at else None,
            })
        
        return Response(data)


class DashboardFuelByMonthView(APIView):
    """Get fuel statistics grouped by month."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        company = request.user.company
        months = int(request.query_params.get('months', 6))
        
        now = timezone.now()
        # Calculate the start date for the last N months
        start_date = now - timedelta(days=30 * months)
        
        fuel_data = Fuel.objects.filter(
            car__company=company,
            created_at__gte=start_date
        ).values('month', 'month_name').annotate(
            total_liters=Sum('liters'),
            total_cost=Sum('total_cost'),
            avg_consumption=Avg('liters')
        ).order_by('month')
        
        data = []
        for item in fuel_data:
            data.append({
                'month': item['month'],
                'month_name': item['month_name'],
                'total_liters': float(item['total_liters'] or 0),
                'total_cost': float(item['total_cost'] or 0),
                'avg_consumption': float(item['avg_consumption'] or 0),
            })
        
        return Response(data)
