#!/usr/bin/env bash
set -o errexit

echo "=== Building Parko for Render ==="

# Build frontend
echo "→ Building frontend..."
cd frontend
npm install
npm run build
cd ..

# Prepare backend
echo "→ Preparing backend..."
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Copy frontend build to static directory for collectstatic
mkdir -p static
cp -r ../frontend/dist/* static/ 2>/dev/null || true

# Run migrations
python manage.py migrate --settings=config.settings.render

# Create demo user and data (needed for fresh SQLite on every deploy)
echo "→ Creating demo user and data..."
python manage.py shell --settings=config.settings.render << 'PYTHON'
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.render')
import django
django.setup()

from django.contrib.auth import get_user_model
from companies.models import Company
from fleet.models import Car, Fuel, Insurance, Inspection
from datetime import date, timedelta
import random
import calendar

User = get_user_model()

# Create demo company
company, _ = Company.objects.get_or_create(name='Demo Company', defaults={'inn': '1234567890'})

# Create demo user
demo, created = User.objects.get_or_create(
    username='demo',
    defaults={
        'email': 'demo@parko.demo',
        'company': company,
        'language': 'ru',
        'role': 'COMPANY_ADMIN'
    }
)
demo.set_password('demo')
demo.save()
print(f'{"Created" if created else "Updated"} demo user: demo / demo')

# Create superuser for Django admin access
if not User.objects.filter(username='admin').exists():
    admin = User.objects.create_superuser(
        username='admin',
        email='admin@parko.demo',
        password='admin123'
    )
    admin.company = company
    admin.save()
    print('Created superuser: admin / admin123')
else:
    print('Superuser already exists')

# Create demo cars only if none exist (idempotent for persistent DB)
if not Car.objects.filter(company=company).exists():
    cars_data = [
        {'numplate': 'A001AA', 'brand': 'Toyota', 'title': 'Camry', 'vin': 'DEMO1234567890001'},
        {'numplate': 'B002BB', 'brand': 'BMW', 'title': 'X5', 'vin': 'DEMO1234567890002'},
        {'numplate': 'C003CC', 'brand': 'Mercedes', 'title': 'E-Class', 'vin': 'DEMO1234567890003'},
    ]
    cars = []
    for c in cars_data:
        car = Car.objects.create(company=company, numplate=c['numplate'], brand=c['brand'], title=c['title'], vin=c['vin'], status='active')
        cars.append(car)
        today = date.today()
        for m in range(3):
            month = today.month - m
            year = today.year
            while month <= 0:
                month += 12
                year -= 1
            fuel_date = date(year, month, 1)
            odometer = 10000 + m * random.randint(500,2000)
            Fuel.objects.create(car=car, date=fuel_date, odometer=odometer, liters=random.randint(100,300), total_cost=random.randint(5000,15000), monthly_mileage=random.randint(500,2000))
        Insurance.objects.create(car=car, insurance_type='OSAGO', number=f'DEMO-{car.numplate}-OSAGO', start_date=date.today()-timedelta(days=30), end_date=date.today()+timedelta(days=335), cost=random.randint(5000,10000))
        Inspection.objects.create(car=car, number=f'DEMO-{car.numplate}-INSP', inspected_at=date.today()-timedelta(days=15), cost=random.randint(1000,3000))
    print(f'Created {len(cars)} demo cars with fuel/insurance/inspection data')
else:
    print('Demo cars already exist, skipping creation')
PYTHON

# Collect static files
python manage.py collectstatic --no-input --clear --settings=config.settings.render

echo "=== Build complete ==="
