"""
AI tool functions that the AI assistant can call.
Each function validates permissions, ensures company data isolation,
and returns a structured result dict.
"""
import json
import logging
import re

from django.db import models

from accounts.models import UserRole
from fleet.models import Car, Fuel, Spare, Insurance, Inspection, CarStatus
from custom_tables.models import CustomTable, CustomRecord

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


def _get_company_car(company, car_id):
    try:
        return Car.objects.get(id=car_id, company=company)
    except Car.DoesNotExist:
        return None


def _get_company_record(model, company, record_id):
    try:
        return model.objects.get(id=record_id, car__company=company)
    except model.DoesNotExist:
        return None


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

    car = _get_company_car(company, car_id)
    if not car:
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

    car = _get_company_car(company, car_id)
    if not car:
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

    car = _get_company_car(company, car_id)
    if not car:
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

    car = _get_company_car(company, car_id)
    if not car:
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

    record = _get_company_record(model, company, record_id)
    if not record:
        return {'success': False, 'error': f"{model_name} record #{record_id} not found."}
    try:
        record.delete()
        return {
            'success': True,
            'message': f"{model_name.capitalize()} record #{record_id} deleted successfully.",
        }
    except Exception as e:
        logger.error(f"Error deleting {model_name} #{record_id} for user {user.id}: {e}")
        return {'success': False, 'error': str(e)}


def tool_update_fuel(user, company, record_id, data):
    """Update fuel record fields."""
    _check_admin(user)

    record = _get_company_record(Fuel, company, record_id)
    if not record:
        return {'success': False, 'error': f"Fuel record #{record_id} not found."}

    if 'car_id' in data:
        car_id = _parse_car_id(data['car_id'])
        if not isinstance(car_id, int):
            return {'success': False, 'error': f"Invalid car_id format: {data['car_id']}. Must be an integer."}
        car = _get_company_car(company, car_id)
        if not car:
            return {'success': False, 'error': f"Vehicle with ID {car_id} not found."}
        record.car = car

    numeric_fields = ['year', 'month', 'liters', 'total_cost', 'monthly_mileage']
    for field in numeric_fields:
        if field in data and data[field] is not None:
            setattr(record, field, int(data[field]))

    try:
        record.save()
        return {
            'success': True,
            'data': {
                'id': record.id,
                'car': str(record.car),
                'year': record.year,
                'month': record.month,
                'liters': record.liters,
                'total_cost': record.total_cost,
                'monthly_mileage': record.monthly_mileage,
                'consumption': str(record.consumption),
            },
            'message': f"Fuel record #{record.id} updated successfully.",
        }
    except Exception as e:
        logger.error(f"Error updating fuel #{record_id} for user {user.id}: {e}")
        return {'success': False, 'error': str(e)}


def tool_update_spare(user, company, record_id, data):
    """Update spare part record fields."""
    _check_admin(user)

    record = _get_company_record(Spare, company, record_id)
    if not record:
        return {'success': False, 'error': f"Spare record #{record_id} not found."}

    if 'car_id' in data:
        car_id = _parse_car_id(data['car_id'])
        if not isinstance(car_id, int):
            return {'success': False, 'error': f"Invalid car_id format: {data['car_id']}. Must be an integer."}
        car = _get_company_car(company, car_id)
        if not car:
            return {'success': False, 'error': f"Vehicle with ID {car_id} not found."}
        record.car = car

    direct_fields = ['title', 'description', 'job_description', 'installed_at']
    numeric_fields = ['part_price', 'job_price']

    for field in direct_fields:
        if field in data and data[field] is not None:
            setattr(record, field, data[field])

    for field in numeric_fields:
        if field in data and data[field] is not None:
            setattr(record, field, int(data[field]))

    try:
        record.save()
        return {
            'success': True,
            'data': {
                'id': record.id,
                'car': str(record.car),
                'title': record.title,
                'part_price': record.part_price,
                'job_price': record.job_price,
                'installed_at': str(record.installed_at),
            },
            'message': f"Spare record #{record.id} updated successfully.",
        }
    except Exception as e:
        logger.error(f"Error updating spare #{record_id} for user {user.id}: {e}")
        return {'success': False, 'error': str(e)}


def tool_update_insurance(user, company, record_id, data):
    """Update insurance record fields."""
    _check_admin(user)

    record = _get_company_record(Insurance, company, record_id)
    if not record:
        return {'success': False, 'error': f"Insurance record #{record_id} not found."}

    if 'car_id' in data:
        car_id = _parse_car_id(data['car_id'])
        if not isinstance(car_id, int):
            return {'success': False, 'error': f"Invalid car_id format: {data['car_id']}. Must be an integer."}
        car = _get_company_car(company, car_id)
        if not car:
            return {'success': False, 'error': f"Vehicle with ID {car_id} not found."}
        record.car = car

    direct_fields = ['insurance_type', 'number', 'start_date', 'end_date']
    for field in direct_fields:
        if field in data and data[field] is not None:
            setattr(record, field, data[field])

    if 'cost' in data and data['cost'] is not None:
        record.cost = int(data['cost'])

    try:
        record.save()
        return {
            'success': True,
            'data': {
                'id': record.id,
                'car': str(record.car),
                'insurance_type': record.insurance_type,
                'number': record.number,
                'start_date': str(record.start_date),
                'end_date': str(record.end_date),
                'cost': record.cost,
            },
            'message': f"Insurance record #{record.id} updated successfully.",
        }
    except Exception as e:
        logger.error(f"Error updating insurance #{record_id} for user {user.id}: {e}")
        return {'success': False, 'error': str(e)}


def tool_update_inspection(user, company, record_id, data):
    """Update inspection record fields."""
    _check_admin(user)

    record = _get_company_record(Inspection, company, record_id)
    if not record:
        return {'success': False, 'error': f"Inspection record #{record_id} not found."}

    if 'car_id' in data:
        car_id = _parse_car_id(data['car_id'])
        if not isinstance(car_id, int):
            return {'success': False, 'error': f"Invalid car_id format: {data['car_id']}. Must be an integer."}
        car = _get_company_car(company, car_id)
        if not car:
            return {'success': False, 'error': f"Vehicle with ID {car_id} not found."}
        record.car = car

    direct_fields = ['number', 'inspected_at']
    for field in direct_fields:
        if field in data and data[field] is not None:
            setattr(record, field, data[field])

    if 'cost' in data and data['cost'] is not None:
        record.cost = int(data['cost'])

    try:
        record.save()
        return {
            'success': True,
            'data': {
                'id': record.id,
                'car': str(record.car),
                'number': record.number,
                'inspected_at': str(record.inspected_at),
                'cost': record.cost,
            },
            'message': f"Inspection record #{record.id} updated successfully.",
        }
    except Exception as e:
        logger.error(f"Error updating inspection #{record_id} for user {user.id}: {e}")
        return {'success': False, 'error': str(e)}


def tool_list_custom_tables(user, company, filters=None):
    """List custom tables for the company."""
    _check_admin(user)
    qs = CustomTable.objects.filter(company=company).order_by('-created_at')
    if filters and filters.get('name'):
        qs = qs.filter(name__icontains=filters['name'])
    data = []
    for table in qs:
        data.append({
            'id': table.id,
            'name': table.name,
            'description': table.description,
            'icon': table.icon,
            'record_count': table.records.count(),
            'columns': [c.get('name') for c in table.schema.get('columns', [])],
            'column_types': {c.get('name'): c.get('type') for c in table.schema.get('columns', [])},
        })
    return {'success': True, 'data': {'tables': data, 'total': len(data)}}


def tool_list_custom_records(user, company, table_id, filters=None):
    """List records from a specific custom table."""
    _check_admin(user)
    try:
        table = CustomTable.objects.get(id=table_id, company=company)
    except CustomTable.DoesNotExist:
        return {'success': False, 'error': f"Custom table #{table_id} not found."}

    qs = CustomRecord.objects.filter(table=table).select_related('car').order_by('-created_at')
    if filters and filters.get('search'):
        search = filters['search'].lower()
        # Simple search in data JSON values
        filtered = []
        for record in qs:
            data_str = json.dumps(record.data, ensure_ascii=False).lower()
            car_str = str(record.car or '').lower()
            if search in data_str or search in car_str:
                filtered.append(record)
        qs = filtered
        total = len(qs)
        # Apply limit
        limit = filters.get('limit', 50)
        qs = qs[:limit]
    else:
        total = qs.count()
        limit = filters.get('limit', 50) if filters else 50
        qs = qs[:limit]

    data = []
    for record in qs:
        # Flatten data fields for easy AI consumption
        fields = {k: str(v) for k, v in record.data.items()}
        data.append({
            'id': record.id,
            'table_id': table.id,
            'table_name': table.name,
            'car': str(record.car) if record.car else None,
            'fields': fields,
            'created_at': str(record.created_at),
        })
    return {
        'success': True,
        'data': {
            'records': data,
            'total': total,
            'table': {
                'id': table.id,
                'name': table.name,
                'columns': table.schema.get('columns', []),
            },
        },
    }


def tool_add_custom_table(user, company, data):
    """Add a new custom table. data: name, description, icon, columns"""
    _check_admin(user)
    required = ['name', 'columns']
    for field in required:
        if not data.get(field):
            return {'success': False, 'error': f"Required field missing: {field}"}

    name = data['name'].strip()
    if CustomTable.objects.filter(company=company, name=name).exists():
        return {'success': False, 'error': f"Custom table '{name}' already exists."}

    columns = data['columns']
    if not isinstance(columns, list) or len(columns) == 0:
        return {'success': False, 'error': "columns must be a non-empty list."}

    schema_columns = []
    for col in columns:
        if isinstance(col, str):
            schema_columns.append({'name': col, 'type': 'text', 'required': False})
        elif isinstance(col, dict):
            schema_columns.append({
                'name': col.get('name', 'Unnamed'),
                'type': col.get('type', 'text'),
                'required': col.get('required', False),
                'options': col.get('options', []),
            })
        else:
            return {'success': False, 'error': f"Invalid column format: {col}"}

    try:
        table = CustomTable.objects.create(
            company=company,
            name=name,
            description=data.get('description', ''),
            icon=data.get('icon', 'table'),
            schema={'columns': schema_columns},
        )
        return {
            'success': True,
            'data': {
                'id': table.id,
                'name': table.name,
                'description': table.description,
                'columns': schema_columns,
            },
            'message': f"Custom table '{table.name}' created successfully.",
        }
    except Exception as e:
        logger.error(f"Error adding custom table for user {user.id}: {e}")
        return {'success': False, 'error': str(e)}


def tool_add_custom_record(user, company, data):
    """Add a record to a custom table. data: table_id, (car_id), record_data"""
    _check_admin(user)
    required = ['table_id', 'record_data']
    for field in required:
        if field not in data or data[field] is None:
            return {'success': False, 'error': f"Required field missing: {field}"}

    table_id = data['table_id']
    try:
        table = CustomTable.objects.get(id=table_id, company=company)
    except CustomTable.DoesNotExist:
        return {'success': False, 'error': f"Custom table #{table_id} not found."}

    car = None
    if data.get('car_id'):
        car_id = _parse_car_id(data['car_id'])
        if isinstance(car_id, int):
            car = _get_company_car(company, car_id)

    try:
        record = CustomRecord.objects.create(
            table=table,
            car=car,
            data=data['record_data'],
        )
        return {
            'success': True,
            'data': {
                'id': record.id,
                'table_id': table.id,
                'table_name': table.name,
                'car': str(car) if car else None,
                'data': record.data,
            },
            'message': f"Record added to '{table.name}'.",
        }
    except Exception as e:
        logger.error(f"Error adding custom record for user {user.id}: {e}")
        return {'success': False, 'error': str(e)}


def tool_update_custom_record(user, company, record_id, data):
    """Update a custom record. data: (table_id), (car_id), record_data"""
    _check_admin(user)
    try:
        record = CustomRecord.objects.get(id=record_id, table__company=company)
    except CustomRecord.DoesNotExist:
        return {'success': False, 'error': f"Custom record #{record_id} not found."}

    if 'table_id' in data:
        try:
            record.table = CustomTable.objects.get(id=data['table_id'], company=company)
        except CustomTable.DoesNotExist:
            return {'success': False, 'error': f"Custom table #{data['table_id']} not found."}

    if 'car_id' in data and data['car_id'] is not None:
        car_id = _parse_car_id(data['car_id'])
        if isinstance(car_id, int):
            car = _get_company_car(company, car_id)
            if car:
                record.car = car
            else:
                record.car = None
        else:
            record.car = None
    elif 'car_id' in data and data['car_id'] is None:
        record.car = None

    if 'record_data' in data:
        record.data = data['record_data']

    try:
        record.save()
        return {
            'success': True,
            'data': {
                'id': record.id,
                'table_id': record.table.id,
                'table_name': record.table.name,
                'car': str(record.car) if record.car else None,
                'data': record.data,
            },
            'message': f"Custom record #{record.id} updated successfully.",
        }
    except Exception as e:
        logger.error(f"Error updating custom record #{record_id} for user {user.id}: {e}")
        return {'success': False, 'error': str(e)}


def tool_update_custom_table(user, company, table_id, data):
    """Update a custom table schema (name, description, columns, settings)."""
    _check_admin(user)
    try:
        table = CustomTable.objects.get(id=table_id, company=company)
    except CustomTable.DoesNotExist:
        return {'success': False, 'error': f"Custom table #{table_id} not found."}

    if 'name' in data and data['name']:
        new_name = data['name'].strip()
        if new_name != table.name and CustomTable.objects.filter(company=company, name=new_name).exists():
            return {'success': False, 'error': f"Custom table '{new_name}' already exists."}
        table.name = new_name

    if 'description' in data:
        table.description = data.get('description', '')
    if 'icon' in data:
        table.icon = data.get('icon', 'table')


    if 'columns' in data and isinstance(data['columns'], list):
        schema_columns = []
        for col in data['columns']:
            if isinstance(col, str):
                schema_columns.append({'name': col, 'type': 'text', 'required': False})
            elif isinstance(col, dict):
                schema_columns.append({
                    'name': col.get('name', 'Unnamed'),
                    'type': col.get('type', 'text'),
                    'required': col.get('required', False),
                    'options': col.get('options', []),
                })
            else:
                return {'success': False, 'error': f"Invalid column format: {col}"}
        table.schema = {'columns': schema_columns}

    try:
        table.save()
        return {
            'success': True,
            'data': {
                'id': table.id,
                'name': table.name,
                'description': table.description,
                'columns': table.schema.get('columns', []),
            },
            'message': f"Custom table '{table.name}' updated successfully.",
        }
    except Exception as e:
        logger.error(f"Error updating custom table #{table_id} for user {user.id}: {e}")
        return {'success': False, 'error': str(e)}


def tool_delete_custom_record(user, company, record_id):
    """Delete a custom record by ID."""
    _check_admin(user)
    try:
        record = CustomRecord.objects.get(id=record_id, table__company=company)
        table_name = record.table.name
        record.delete()
        return {
            'success': True,
            'message': f"Record deleted from '{table_name}'.",
        }
    except CustomRecord.DoesNotExist:
        return {'success': False, 'error': f"Custom record #{record_id} not found."}
    except Exception as e:
        logger.error(f"Error deleting custom record #{record_id} for user {user.id}: {e}")
        return {'success': False, 'error': str(e)}


# Registry of all tool functions for dynamic lookup
TOOL_REGISTRY = {
    'tool_list_cars': tool_list_cars,
    'tool_add_car': tool_add_car,
    'tool_update_car': tool_update_car,
    'tool_delete_car': tool_delete_car,
    'tool_add_fuel': tool_add_fuel,
    'tool_update_fuel': tool_update_fuel,
    'tool_add_spare': tool_add_spare,
    'tool_update_spare': tool_update_spare,
    'tool_add_insurance': tool_add_insurance,
    'tool_update_insurance': tool_update_insurance,
    'tool_add_inspection': tool_add_inspection,
    'tool_update_inspection': tool_update_inspection,
    'tool_delete_record': tool_delete_record,
    'tool_list_custom_tables': tool_list_custom_tables,
    'tool_add_custom_table': tool_add_custom_table,
    'tool_add_custom_record': tool_add_custom_record,
    'tool_update_custom_record': tool_update_custom_record,
    'tool_delete_custom_record': tool_delete_custom_record,
    'tool_list_custom_records': tool_list_custom_records,
    'tool_update_custom_table': tool_update_custom_table,
}
