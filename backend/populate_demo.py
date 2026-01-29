"""
Простой скрипт для создания демо данных
Запускается через: python manage.py shell < populate_demo.py
"""
from django.contrib.auth import get_user_model
from companies.models import Company
from fleet.models import Car, Fuel, Insurance, Inspection
from datetime import date, timedelta
import random

User = get_user_model()

# Получаем Demo Company
try:
    company = Company.objects.get(name='Demo Company')
    print(f"✅ Найдена компания: {company.name}")
except Company.DoesNotExist:
    print("❌ Demo Company не найдена. Сначала запустите create_demo_user.py")
    exit(1)

# Удаляем старые демо данные
Car.objects.filter(company=company).delete()
print("🗑️  Удалены старые демо данные")

# Создаём 3 демо машины
cars_data = [
    {'numplate': 'А001АА', 'brand': 'Toyota', 'model': 'Camry', 'vin': 'DEMO1234567890001'},
    {'numplate': 'Б002ББ', 'brand': 'BMW', 'model': 'X5', 'vin': 'DEMO1234567890002'},
    {'numplate': 'В003ВВ', 'brand': 'Mercedes', 'model': 'E-Class', 'vin': 'DEMO1234567890003'},
]

cars = []
for car_data in cars_data:
    car = Car.objects.create(
        company=company,
        numplate=car_data['numplate'],
        brand=car_data['brand'],
        vin=car_data['vin'],
        status='active'
    )
    cars.append(car)
    print(f"🚗 Создана машина: {car.numplate} ({car.brand})")

# Создаём топливные записи за последние 3 месяца
fuel_count = 0
for car in cars:
    for month_ago in range(3):
        month_date = date.today() - timedelta(days=30 * month_ago)
        Fuel.objects.create(
            car=car,
            year=month_date.year,
            month=month_date.month,
            liters=random.randint(100, 300),
            total_cost=random.randint(5000, 15000),
            monthly_mileage=random.randint(500, 2000)
        )
        fuel_count += 1

print(f"⛽ Создано {fuel_count} топливных записей")

# Создаём страховки
insurance_count = 0
for car in cars:
    Insurance.objects.create(
        car=car,
        insurance_type='OSAGO',
        number=f'DEMO-{car.numplate}-OSAGO',
        start_date=date.today() - timedelta(days=30),
        end_date=date.today() + timedelta(days=335),
        cost=random.randint(5000, 10000)
    )
    insurance_count += 1

print(f"🛡️  Создано {insurance_count} страховок")

# Создаём техосмотры
inspection_count = 0
for car in cars:
    Inspection.objects.create(
        car=car,
        number=f'DEMO-{car.numplate}-INSP',
        inspected_at=date.today() - timedelta(days=15),
        cost=random.randint(1000, 3000)
    )
    inspection_count += 1

print(f"🔧 Создано {inspection_count} техосмотров")

print("\n✅ Демо данные успешно созданы!")
print(f"Всего машин: {Car.objects.filter(company=company).count()}")
print(f"Всего топливных записей: {Fuel.objects.filter(car__company=company).count()}")
print(f"Всего страховок: {Insurance.objects.filter(car__company=company).count()}")
print(f"Всего техосмотров: {Inspection.objects.filter(car__company=company).count()}")
