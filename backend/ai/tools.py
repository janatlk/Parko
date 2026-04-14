"""
AI tool functions that the AI assistant can call.
Each function validates permissions, ensures company data isolation,
and returns a structured result dict.
"""
import logging
import re

from django.db import models
from django.utils import timezone

from accounts.models import UserRole
from fleet.models import Car, Fuel, Spare, Insurance, Inspection, CarStatus

logger = logging.getLogger(__name__)


def _parse_car_id(value):
    """
    Extract integer car_id from various formats AI might send.
    Examples:
        - 32 → 32
        - "32" → 32
        - "car_id=32" → 32
        - "ID: 32" → 32
    """
    if isinstance(value, int):
        return value
    if isinstance(value, str):
        # Try to extract number from strings like "car_id=32" or "ID: 32"
        match = re.search(r'(\d+)', value)
        if match:
            return int(match.group(1))
        # Try direct conversion
        try:
            return int(value)
        except (ValueError, TypeError):
            pass
    return value  # Return as-is, will fail validation later


def _check_admin(user):
    """Raise ValueError if user is not a company admin."""
    if not user.company_id:
        raise PermissionError("User has no company assigned.")
    if user.role != UserRole.COMPANY_ADMIN:
        raise PermissionError("User does not have admin permissions.")


def tool_list_cars(user, company, filters=None):
    """List company vehicles. filters: status, brand, search (numplate/brand/driver)"""
    _check_admin(user)

    qs = Car.objects.filter(company=company)

    if filters:
        status = filters.get('status')
        if status:
            qs = qs.filter(status=status)

        brand = filters.get('brand')
        if brand:
            qs = qs.filter(brand__icontains=brand)

        search = filters.get('search')
        if search:
            qs = qs.filter(
                models.Q(numplate__icontains=search)
                | models.Q(brand__icontains=search)
                | models.Q(driver__icontains=search)
                | models.Q(title__icontains=search)
            )

    cars = qs.order_by('-created_at')
    data = []
    for car in cars:
        data.append({
            'id': car.id,
            'brand': car.brand,
            'title': car.title,
            'numplate': car.numplate,
            'vin': car.vin,
            'fueltype': car.fueltype,
            'type': car.type,
            'year': car.year,
            'driver': car.driver,
            'drivers_phone': car.drivers_phone,
            'fuel_card': car.fuel_card,
            'status': car.status,
            'region': car.region,
            'commissioned_at': str(car.commissioned_at) if car.commissioned_at else None,
        })

    return {'success': True, 'data': {'cars': data, 'total': len(data)}}


def tool_add_car(user, company, data):
    """Add a new car. Only brand, title, numplate are required. Rest defaults to empty/N/A."""
    _check_admin(user)

    required = ['brand', 'title', 'numplate']
    for field in required:
        if not data.get(field):
            return {'success': False, 'error': f"Required field missing: {field}"}

    try:
        car = Car.objects.create(
            company=company,
            brand=data['brand'].strip(),
            title=data['title'].strip(),
            numplate=data['numplate'].strip().upper(),
            vin=data.get('vin') or '',
            fueltype=data.get('fueltype') or '',
            type=data.get('type') or '',
            year=data.get('year') or None,
            driver=data.get('driver') or '-',
            status=data.get('status', CarStatus.ACTIVE),
            region=data.get('region') or '',
            drivers_phone=data.get('drivers_phone') or '',
            fuel_card=data.get('fuel_card') or '',
        )
        return {
            'success': True,
            'data': {
                'id': car.id,
                'brand': car.brand,
                'title': car.title,
                'numplate': car.numplate,
                'status': car.status,
            },
            'message': f"Vehicle {car.brand} {car.title} ({car.numplate}) added successfully.",
        }
    except Exception as e:
        logger.error(f"Error adding car for user {user.id}: {e}")
        return {'success': False, 'error': str(e)}


def tool_update_car(user, company, car_id, data):
    """Update car fields. data: any Car fields to update"""
    _check_admin(user)

    try:
        car = Car.objects.get(id=car_id, company=company)
    except Car.DoesNotExist:
        return {'success': False, 'error': f"Vehicle with ID {car_id} not found."}

    updatable_fields = [
        'brand', 'title', 'numplate', 'vin', 'fueltype', 'type',
        'year', 'driver', 'drivers_phone', 'fuel_card', 'status',
        'region', 'commissioned_at',
    ]

    for field in updatable_fields:
        if field in data:
            value = data[field]
            if field == 'numplate' and value:
                value = value.strip().upper()
            elif field == 'driver':
                value = Car._normalize_driver(value)
            setattr(car, field, value)

    car.save()

    return {
        'success': True,
        'data': {
            'id': car.id,
            'brand': car.brand,
            'title': car.title,
            'numplate': car.numplate,
            'status': car.status,
        },
        'message': f"Vehicle {car.brand} {car.title} ({car.numplate}) updated successfully.",
    }


def tool_delete_car(user, company, car_id):
    """Delete a car by ID"""
    _check_admin(user)

    try:
        car = Car.objects.get(id=car_id, company=company)
        car_info = f"{car.brand} {car.title} ({car.numplate})"
        car.delete()
        return {
            'success': True,
            'message': f"Vehicle {car_info} deleted successfully.",
        }
    except Car.DoesNotExist:
        return {'success': False, 'error': f"Vehicle with ID {car_id} not found."}
    except Exception as e:
        logger.error(f"Error deleting car {car_id} for user {user.id}: {e}")
        return {'success': False, 'error': str(e)}


def tool_add_fuel(user, company, data):
    """Add fuel record. data: car_id, year, month, liters, total_cost, monthly_mileage"""
    _check_admin(user)

    required = ['car_id', 'year', 'month', 'liters']
    for field in required:
        if field not in data or data[field] is None:
            return {'success': False, 'error': f"Required field missing: {field}"}

    # Parse car_id from various formats
    car_id = _parse_car_id(data['car_id'])
    if not isinstance(car_id, int):
        return {'success': False, 'error': f"Invalid car_id format: {data['car_id']}. Must be an integer."}

    try:
        car = Car.objects.get(id=car_id, company=company)
    except Car.DoesNotExist:
        return {'success': False, 'error': f"Vehicle with ID {car_id} not found."}

    try:
        fuel = Fuel.objects.create(
            car=car,
            year=int(data['year']),
            month=int(data['month']),
            liters=int(data['liters']),
            total_cost=int(data.get('total_cost', 0)),
            monthly_mileage=int(data.get('monthly_mileage', 0)),
        )
        return {
            'success': True,
            'data': {
                'id': fuel.id,
                'car': str(car),
                'year': fuel.year,
                'month': fuel.month,
                'liters': fuel.liters,
                'total_cost': fuel.total_cost,
                'consumption': str(fuel.consumption),
            },
            'message': f"Fuel record added for {car} ({fuel.month_name} {fuel.year}).",
        }
    except Exception as e:
        logger.error(f"Error adding fuel record for user {user.id}: {e}")
        return {'success': False, 'error': str(e)}


def tool_add_spare(user, company, data):
    """Add spare part record. data: car_id, title, description, part_price, job_price, job_description, installed_at"""
    _check_admin(user)

    required = ['car_id', 'title', 'installed_at']
    for field in required:
        if field not in data or data[field] is None:
            return {'success': False, 'error': f"Required field missing: {field}"}

    # Parse car_id from various formats
    car_id = _parse_car_id(data['car_id'])
    if not isinstance(car_id, int):
        return {'success': False, 'error': f"Invalid car_id format: {data['car_id']}. Must be an integer."}

    try:
        car = Car.objects.get(id=car_id, company=company)
    except Car.DoesNotExist:
        return {'success': False, 'error': f"Vehicle with ID {car_id} not found."}

    try:
        spare = Spare.objects.create(
            car=car,
            title=data['title'],
            description=data.get('description', ''),
            part_price=int(data.get('part_price', 0)),
            job_price=int(data.get('job_price', 0)),
            job_description=data.get('job_description', ''),
            installed_at=data['installed_at'],
        )
        total_cost = spare.part_price + spare.job_price
        return {
            'success': True,
            'data': {
                'id': spare.id,
                'car': str(car),
                'title': spare.title,
                'part_price': spare.part_price,
                'job_price': spare.job_price,
                'total_cost': total_cost,
                'installed_at': str(spare.installed_at),
            },
            'message': f"Spare part record added for {car}: {spare.title}.",
        }
    except Exception as e:
        logger.error(f"Error adding spare part record for user {user.id}: {e}")
        return {'success': False, 'error': str(e)}


def tool_add_insurance(user, company, data):
    """Add insurance. data: car_id, insurance_type, number, start_date, end_date, cost"""
    _check_admin(user)

    required = ['car_id', 'number', 'start_date', 'end_date']
    for field in required:
        if field not in data or data[field] is None:
            return {'success': False, 'error': f"Required field missing: {field}"}

    # Parse car_id from various formats
    car_id = _parse_car_id(data['car_id'])
    if not isinstance(car_id, int):
        return {'success': False, 'error': f"Invalid car_id format: {data['car_id']}. Must be an integer."}

    try:
        car = Car.objects.get(id=car_id, company=company)
    except Car.DoesNotExist:
        return {'success': False, 'error': f"Vehicle with ID {car_id} not found."}

    try:
        insurance = Insurance.objects.create(
            car=car,
            insurance_type=data.get('insurance_type', 'OSAGO'),
            number=data['number'],
            start_date=data['start_date'],
            end_date=data['end_date'],
            cost=int(data.get('cost', 0)),
        )
        return {
            'success': True,
            'data': {
                'id': insurance.id,
                'car': str(car),
                'insurance_type': insurance.insurance_type,
                'number': insurance.number,
                'start_date': str(insurance.start_date),
                'end_date': str(insurance.end_date),
                'cost': insurance.cost,
            },
            'message': f"Insurance added for {car}: {insurance.number}.",
        }
    except Exception as e:
        logger.error(f"Error adding insurance for user {user.id}: {e}")
        return {'success': False, 'error': str(e)}


def tool_add_inspection(user, company, data):
    """Add inspection. data: car_id, number, inspected_at, cost"""
    _check_admin(user)

    required = ['car_id', 'number', 'inspected_at']
    for field in required:
        if field not in data or data[field] is None:
            return {'success': False, 'error': f"Required field missing: {field}"}

    # Parse car_id from various formats
    car_id = _parse_car_id(data['car_id'])
    if not isinstance(car_id, int):
        return {'success': False, 'error': f"Invalid car_id format: {data['car_id']}. Must be an integer."}

    try:
        car = Car.objects.get(id=car_id, company=company)
    except Car.DoesNotExist:
        return {'success': False, 'error': f"Vehicle with ID {car_id} not found."}

    try:
        inspection = Inspection.objects.create(
            car=car,
            number=data['number'],
            inspected_at=data['inspected_at'],
            cost=int(data.get('cost', 0)),
        )
        return {
            'success': True,
            'data': {
                'id': inspection.id,
                'car': str(car),
                'number': inspection.number,
                'inspected_at': str(inspection.inspected_at),
                'cost': inspection.cost,
            },
            'message': f"Inspection added for {car}: {inspection.number}.",
        }
    except Exception as e:
        logger.error(f"Error adding inspection for user {user.id}: {e}")
        return {'success': False, 'error': str(e)}


def tool_delete_record(user, company, model_name, record_id):
    """Delete any record: fuel, spare, insurance, inspection by ID"""
    _check_admin(user)

    model_map = {
        'fuel': Fuel,
        'spare': Spare,
        'insurance': Insurance,
        'inspection': Inspection,
    }

    model = model_map.get(model_name.lower())
    if not model:
        return {
            'success': False,
            'error': f"Unknown model: {model_name}. Supported: fuel, spare, insurance, inspection.",
        }

    try:
        record = model.objects.get(id=record_id, car__company=company)
        record.delete()
        return {
            'success': True,
            'message': f"{model_name.capitalize()} record #{record_id} deleted successfully.",
        }
    except model.DoesNotExist:
        return {'success': False, 'error': f"{model_name} record #{record_id} not found."}
    except Exception as e:
        logger.error(f"Error deleting {model_name} #{record_id} for user {user.id}: {e}")
        return {'success': False, 'error': str(e)}


# Registry of all tool functions for dynamic lookup
TOOL_REGISTRY = {
    'tool_list_cars': tool_list_cars,
    'tool_add_car': tool_add_car,
    'tool_update_car': tool_update_car,
    'tool_delete_car': tool_delete_car,
    'tool_add_fuel': tool_add_fuel,
    'tool_add_spare': tool_add_spare,
    'tool_add_insurance': tool_add_insurance,
    'tool_add_inspection': tool_add_inspection,
    'tool_delete_record': tool_delete_record,
}
