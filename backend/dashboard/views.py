from django.utils import timezone
from datetime import timedelta, date
from django.db.models import Sum, Count, Q, Avg, F
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from fleet.models import Car, Fuel, Insurance, Inspection, Spare, Tires, Accumulator


def _get_month_range(months_count):
    """Generate list of (year, month) tuples for the last N months."""
    now = timezone.now()
    months = []
    for i in range(months_count):
        month_date = now - timedelta(days=30 * i)
        months.append((month_date.year, month_date.month))
    return months


def _get_previous_month_stats(company, current_year, current_month, model, date_field):
    """Get stats for the previous month."""
    if current_month == 1:
        prev_year, prev_month = current_year - 1, 12
    else:
        prev_year, prev_month = current_year, current_month - 1

    kwargs = {
        f'{date_field}__year': prev_year,
        f'{date_field}__month': prev_month,
        'car__company': company,
    }
    return model.objects.filter(**kwargs)


class DashboardStatsView(APIView):
    """Get dashboard statistics for the current user's company."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        company = request.user.company
        now = timezone.now()
        current_month = now.month
        current_year = now.year

        # Car statistics
        total_cars = Car.objects.filter(company=company).count()
        active_cars = Car.objects.filter(company=company, status='ACTIVE').count()
        maintenance_cars = Car.objects.filter(company=company, status='MAINTENANCE').count()
        inactive_cars = Car.objects.filter(company=company, status='INACTIVE').count()

        # Fuel statistics - current month
        fuel_this_month = Fuel.objects.filter(
            car__company=company,
            month=current_month,
            year=current_year
        )

        # If no data for current month, find the most recent month with data
        if not fuel_this_month.exists():
            latest_fuel = Fuel.objects.filter(
                car__company=company
            ).order_by('-year', '-month').first()

            if latest_fuel:
                fuel_this_month = Fuel.objects.filter(
                    car__company=company,
                    month=latest_fuel.month,
                    year=latest_fuel.year
                )

        total_fuel_cost_month = fuel_this_month.aggregate(total=Sum('total_cost'))['total'] or 0

        # Previous month fuel for trend
        if current_month == 1:
            prev_year, prev_month = current_year - 1, 12
        else:
            prev_year, prev_month = current_year, current_month - 1

        fuel_prev_month = Fuel.objects.filter(
            car__company=company,
            month=prev_month,
            year=prev_year
        )
        total_fuel_cost_prev_month = fuel_prev_month.aggregate(total=Sum('total_cost'))['total'] or 0

        # Calculate average fuel consumption
        all_fuel_with_data = Fuel.objects.filter(
            car__company=company,
            liters__gt=0,
            monthly_mileage__gt=0
        )
        avg_fuel_consumption = 0
        if all_fuel_with_data.exists():
            avg_consumption_data = all_fuel_with_data.aggregate(
                total_liters=Sum('liters'),
                total_mileage=Sum('monthly_mileage')
            )
            if avg_consumption_data['total_liters'] and avg_consumption_data['total_mileage']:
                if avg_consumption_data['total_mileage'] > 0:
                    avg_fuel_consumption = round(
                        (avg_consumption_data['total_liters'] / avg_consumption_data['total_mileage']) * 100,
                        2
                    )

        # Previous month consumption for trend
        prev_month_fuel_with_data = Fuel.objects.filter(
            car__company=company,
            year=prev_year,
            month=prev_month,
            liters__gt=0,
            monthly_mileage__gt=0
        )
        prev_avg_consumption = 0
        if prev_month_fuel_with_data.exists():
            prev_data = prev_month_fuel_with_data.aggregate(
                total_liters=Sum('liters'),
                total_mileage=Sum('monthly_mileage')
            )
            if prev_data['total_liters'] and prev_data['total_mileage'] and prev_data['total_mileage'] > 0:
                prev_avg_consumption = (prev_data['total_liters'] / prev_data['total_mileage']) * 100

        # Maintenance cost for current month
        maintenance_cost_month = Spare.objects.filter(
            car__company=company,
            installed_at__year=current_year,
            installed_at__month=current_month
        ).aggregate(
            total=Sum('part_price') + Sum('job_price')
        )['total'] or 0

        # Previous month maintenance for trend
        prev_maintenance = Spare.objects.filter(
            car__company=company,
            installed_at__year=prev_year,
            installed_at__month=prev_month
        ).aggregate(
            total=Sum('part_price') + Sum('job_price')
        )['total'] or 0

        # Total operational cost (fuel + maintenance)
        total_operational_cost = total_fuel_cost_month + maintenance_cost_month
        prev_operational_cost = total_fuel_cost_prev_month + prev_maintenance

        # Insurance statistics
        active_insurances = Insurance.objects.filter(
            car__company=company,
            end_date__gte=now.date()
        ).count()

        # Inspection statistics
        active_inspections = Inspection.objects.filter(
            car__company=company,
            inspected_at__gte=now.date() - timedelta(days=365)
        ).count()

        # Count expiring items (within 30 days)
        expiring_count = Insurance.objects.filter(
            car__company=company,
            end_date__lte=now.date() + timedelta(days=30),
            end_date__gte=now.date()
        ).count()

        expiring_inspections = Inspection.objects.filter(
            car__company=company
        ).count()
        # Filter in Python for inspection expiry calculation
        expiring_inspections = sum(
            1 for i in Inspection.objects.filter(car__company=company)
            if 0 <= (i.inspected_at + timedelta(days=365) - now.date()).days <= 30
        )

        return Response({
            'total_cars': total_cars,
            'active_cars': active_cars,
            'maintenance_cars': maintenance_cars,
            'inactive_cars': inactive_cars,
            'total_fuel_cost_month': round(float(total_fuel_cost_month), 2),
            'total_fuel_cost_prev_month': round(float(total_fuel_cost_prev_month), 2),
            'total_maintenance_cost_month': round(float(maintenance_cost_month), 2),
            'total_maintenance_cost_prev_month': round(float(prev_maintenance), 2),
            'total_operational_cost': round(float(total_operational_cost), 2),
            'prev_operational_cost': round(float(prev_operational_cost), 2),
            'active_insurances': active_insurances,
            'active_inspections': active_inspections,
            'expiring_items_count': expiring_count + expiring_inspections,
            'avg_fuel_consumption': avg_fuel_consumption,
            'prev_avg_fuel_consumption': round(prev_avg_consumption, 2) if prev_avg_consumption else 0,
        })


class DashboardExpiringView(APIView):
    """Get expiring insurance and inspection items (including expired)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        company = request.user.company
        now = timezone.now().date()
        warning_days = 30

        expiring_items = []
        total_renewal_cost = 0

        # Expiring insurances (including already expired)
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
            total_renewal_cost += insurance.cost

        # Expiring inspections (including already expired)
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
                total_renewal_cost += inspection.cost

        # Sort by days until expiry (most urgent first, including negative/expired)
        expiring_items.sort(key=lambda x: x['days_until_expiry'])

        return Response({
            'items': expiring_items,
            'total_renewal_cost': round(float(total_renewal_cost), 2),
        })


class DashboardActivityFeedView(APIView):
    """Get unified activity feed (fuel, maintenance, new cars, car edits)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        company = request.user.company
        limit = int(request.query_params.get('limit', 10))

        activities = []
        now = timezone.now()

        # Recent fuel entries
        fuel_entries = Fuel.objects.filter(
            car__company=company
        ).select_related('car').order_by('-created_at')[:limit]

        for fuel in fuel_entries:
            activities.append({
                'id': fuel.id,
                'type': 'fuel',
                'car_id': fuel.car.id,
                'car_numplate': fuel.car.numplate,
                'title': f"Fuel: {fuel.month_name} {fuel.year}",
                'description': f"{fuel.liters}L - {fuel.total_cost} с.",
                'date': fuel.created_at.isoformat() if fuel.created_at else now.isoformat(),
                'cost': float(fuel.total_cost),
            })

        # Recent maintenance (spares)
        spares = Spare.objects.filter(
            car__company=company
        ).select_related('car').order_by('-installed_at')[:limit]

        for spare in spares:
            activities.append({
                'id': spare.id,
                'type': 'maintenance',
                'car_id': spare.car.id,
                'car_numplate': spare.car.numplate,
                'title': f"Maintenance: {spare.title}",
                'description': f"Parts: {spare.part_price} с. + Labor: {spare.job_price} с.",
                'date': spare.installed_at.isoformat() if spare.installed_at else now.isoformat(),
                'cost': float(spare.part_price or 0) + float(spare.job_price or 0),
            })

        # Recent car additions
        new_cars = Car.objects.filter(
            company=company
        ).order_by('-created_at')[:limit]

        for car in new_cars:
            activities.append({
                'id': car.id,
                'type': 'car_added',
                'car_id': car.id,
                'car_numplate': car.numplate,
                'title': f"Vehicle added: {car.brand} {car.title or ''}",
                'description': f"VIN: {car.vin or 'N/A'}",
                'date': car.created_at.isoformat() if car.created_at else now.isoformat(),
                'cost': 0,
            })

        # Recent car edits (updated but not newly created)
        # Get cars that have been updated after they were created
        all_cars = Car.objects.filter(
            company=company,
            updated_at__isnull=False
        ).order_by('-updated_at')[:limit * 2]  # Get more to filter

        for car in all_cars:
            # Skip if updated very recently (likely the same as created)
            if car.updated_at and car.created_at:
                time_diff = abs((car.updated_at - car.created_at).total_seconds())
                if time_diff < 60:  # Less than 1 minute difference - likely just creation
                    continue
                # Skip if updated_at equals created_at (no actual edit)
                if car.updated_at == car.created_at:
                    continue
            activities.append({
                'id': car.id,
                'type': 'car_edited',
                'car_id': car.id,
                'car_numplate': car.numplate,
                'title': f"Vehicle updated: {car.brand} {car.title or ''}",
                'description': f"Last modified: {car.updated_at.strftime('%d.%m.%Y %H:%M') if car.updated_at else 'N/A'}",
                'date': car.updated_at.isoformat() if car.updated_at else now.isoformat(),
                'cost': 0,
            })

        # Sort all activities by date (most recent first)
        activities.sort(key=lambda x: x['date'], reverse=True)

        # Take top N activities (no deduplication - show all recent activity)
        return Response(activities[:limit])


class DashboardCostByMonthView(APIView):
    """Get cost breakdown (fuel + all maintenance costs) by month."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        company = request.user.company
        months = int(request.query_params.get('months', 6))

        now = timezone.now()

        # Generate month ranges
        month_ranges = []
        for i in range(months):
            month_date = now - timedelta(days=30 * i)
            month_ranges.append((month_date.year, month_date.month))

        # Remove duplicates while preserving order
        seen = set()
        unique_months = []
        for yr, mn in month_ranges:
            if (yr, mn) not in seen:
                seen.add((yr, mn))
                unique_months.append((yr, mn))

        data = []
        for year, month in unique_months:
            # Get month name
            month_date = date(year, month, 1)
            month_name = month_date.strftime('%B')

            # Fuel costs for this month
            fuel_data = Fuel.objects.filter(
                car__company=company,
                year=year,
                month=month
            ).aggregate(
                total_liters=Sum('liters'),
                total_cost=Sum('total_cost')
            )

            # Spare parts costs for this month
            spare_data = Spare.objects.filter(
                car__company=company,
                installed_at__year=year,
                installed_at__month=month
            ).aggregate(
                total_parts=Sum('part_price'),
                total_labor=Sum('job_price')
            )

            # Insurance costs for this month (start_date)
            insurance_data = Insurance.objects.filter(
                car__company=company,
                start_date__year=year,
                start_date__month=month
            ).aggregate(
                total_cost=Sum('cost')
            )

            # Inspection costs for this month (inspected_at)
            inspection_data = Inspection.objects.filter(
                car__company=company,
                inspected_at__year=year,
                inspected_at__month=month
            ).aggregate(
                total_cost=Sum('cost')
            )

            # Tires costs for this month (installed_at)
            tires_data = Tires.objects.filter(
                car__company=company,
                installed_at__year=year,
                installed_at__month=month
            ).aggregate(
                total_cost=Sum('price')
            )

            # Accumulator costs for this month (installed_at)
            accumulator_data = Accumulator.objects.filter(
                car__company=company,
                installed_at__year=year,
                installed_at__month=month
            ).aggregate(
                total_cost=Sum('price')
            )

            fuel_cost = float(fuel_data['total_cost'] or 0)
            spare_cost = float(spare_data['total_parts'] or 0) + float(spare_data['total_labor'] or 0)
            insurance_cost = float(insurance_data['total_cost'] or 0)
            inspection_cost = float(inspection_data['total_cost'] or 0)
            tires_cost = float(tires_data['total_cost'] or 0)
            accumulator_cost = float(accumulator_data['total_cost'] or 0)

            data.append({
                'year': year,
                'month': month,
                'month_name': month_name,
                'fuel_cost': round(fuel_cost, 2),
                'spare_cost': round(spare_cost, 2),
                'insurance_cost': round(insurance_cost, 2),
                'inspection_cost': round(inspection_cost, 2),
                'tires_cost': round(tires_cost, 2),
                'accumulator_cost': round(accumulator_cost, 2),
                'total_cost': round(fuel_cost + spare_cost + insurance_cost + inspection_cost + tires_cost + accumulator_cost, 2),
                'fuel_liters': round(float(fuel_data['total_liters'] or 0), 2),
            })

        # Sort chronologically (oldest first)
        data.sort(key=lambda x: (x['year'], x['month']))

        return Response(data)


class DashboardVehicleConsumptionView(APIView):
    """Get fuel consumption per vehicle."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        company = request.user.company
        limit = int(request.query_params.get('limit', 10))

        # Get all cars with their fuel data
        cars = Car.objects.filter(company=company).select_related('company')

        data = []
        for car in cars:
            # Get all fuel records for this car
            fuel_records = Fuel.objects.filter(car=car, liters__gt=0, monthly_mileage__gt=0)

            if fuel_records.exists():
                totals = fuel_records.aggregate(
                    total_liters=Sum('liters'),
                    total_mileage=Sum('monthly_mileage'),
                    total_cost=Sum('total_cost')
                )

                total_liters = totals['total_liters'] or 0
                total_mileage = totals['total_mileage'] or 0
                total_cost = totals['total_cost'] or 0

                # Calculate average consumption (L/100km)
                avg_consumption = 0
                if total_mileage > 0:
                    avg_consumption = round((total_liters / total_mileage) * 100, 2)

                # Get latest fuel record date
                latest_fuel = fuel_records.order_by('-year', '-month').first()

                data.append({
                    'id': car.id,
                    'numplate': car.numplate,
                    'brand': car.brand,
                    'title': car.title,
                    'total_fuel_liters': round(total_liters, 2),
                    'total_cost': round(float(total_cost), 2),
                    'avg_consumption': avg_consumption,
                    'records_count': fuel_records.count(),
                    'last_updated': f"{latest_fuel.month_name} {latest_fuel.year}" if latest_fuel else None,
                })

        # Sort by consumption (highest first)
        data.sort(key=lambda x: x['avg_consumption'], reverse=True)

        return Response(data[:limit])


class DashboardRecentFuelView(APIView):
    """Get recent fuel entries (legacy endpoint)."""
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
    """Get fuel statistics grouped by month (legacy endpoint)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        company = request.user.company
        months = int(request.query_params.get('months', 6))

        now = timezone.now()

        # Get the last N months with data, ordered by year and month
        fuel_data = Fuel.objects.filter(
            car__company=company
        ).values('year', 'month', 'month_name').annotate(
            total_liters=Sum('liters'),
            total_cost=Sum('total_cost'),
            avg_consumption=Avg('liters')
        ).order_by('-year', '-month')[:months]

        # Sort by month number (ascending) for the chart
        fuel_data = sorted(fuel_data, key=lambda x: (x['year'], x['month']))

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
