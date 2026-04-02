"""
Скрипт для создания тестовых данных Parko

Использование:
    python create_test_data.py
"""

import os
import sys
import django
from pathlib import Path
from datetime import datetime, timedelta

# Добавляем backend в path
sys.path.insert(0, str(Path(__file__).parent))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
django.setup()

from django.contrib.auth import get_user_model
from companies.models import Company
from fleet.models import Car, Fuel, Insurance, Inspection, Spare
from decimal import Decimal

User = get_user_model()


def create_test_data():
    print("=" * 60)
    print("СОЗДАНИЕ ТЕСТОВЫХ ДАННЫХ")
    print("=" * 60)
    
    # Создание компании
    print("\n1. Создание компании...")
    company, created = Company.objects.get_or_create(
        slug='demo-company',
        defaults={
            'name': 'Демо Компания',
            'default_language': 'ru',
            'default_currency': 'KGS',
        }
    )
    if created:
        print(f"   ✓ Компания создана: {company.name}")
    else:
        print(f"   ✓ Компания найдена: {company.name}")
    
    # Создание пользователей
    print("\n2. Создание пользователей...")
    
    users_data = [
        {'username': 'admin', 'email': 'admin@parko.com', 'role': 'admin', 'is_staff': True, 'is_superuser': True},
        {'username': 'dispatcher', 'email': 'dispatcher@parko.com', 'role': 'dispatcher', 'is_staff': False},
        {'username': 'mechanic', 'email': 'mechanic@parko.com', 'role': 'mechanic', 'is_staff': False},
        {'username': 'driver1', 'email': 'driver1@parko.com', 'role': 'driver', 'is_staff': False},
        {'username': 'accountant', 'email': 'accountant@parko.com', 'role': 'accountant', 'is_staff': False},
    ]
    
    created_users = []
    for user_data in users_data:
        user, created = User.objects.get_or_create(
            username=user_data['username'],
            defaults={
                'email': user_data['email'],
                'role': user_data['role'],
                'company': company,
                'is_staff': user_data.get('is_staff', False),
                'is_superuser': user_data.get('is_superuser', False),
            }
        )
        if created:
            user.set_password('parko123')
            user.save()
            print(f"   ✓ Пользователь создан: {user.username} ({user.role})")
        else:
            print(f"   ✓ Пользователь найден: {user.username} ({user.role})")
        created_users.append(user)
    
    admin_user = created_users[0]
    driver_user = created_users[3]
    
    # Создание автомобилей
    print("\n3. Создание автомобилей...")
    
    cars_data = [
        {'numplate': 'B 001 AA', 'vin': 'WVWZZZ3CZWE123456', 'brand': 'Volkswagen', 'title': 'Passat B5', 'year': 2020, 'fueltype': 'Бензин', 'type': 'Седан'},
        {'numplate': 'B 002 BB', 'vin': 'WVWZZZ3CZWE123457', 'brand': 'Volkswagen', 'title': 'Golf 8', 'year': 2021, 'fueltype': 'Бензин', 'type': 'Хэтчбек'},
        {'numplate': 'B 003 CC', 'vin': 'WVWZZZ3CZWE123458', 'brand': 'Toyota', 'title': 'Camry', 'year': 2022, 'fueltype': 'Бензин', 'type': 'Седан'},
        {'numplate': 'B 004 DD', 'vin': 'WVWZZZ3CZWE123459', 'brand': 'Honda', 'title': 'Accord', 'year': 2021, 'fueltype': 'Бензин', 'type': 'Седан'},
        {'numplate': 'B 005 EE', 'vin': 'WVWZZZ3CZWE123460', 'brand': 'Mercedes-Benz', 'title': 'E-Class', 'year': 2023, 'fueltype': 'Бензин', 'type': 'Седан'},
    ]
    
    created_cars = []
    for i, car_data in enumerate(cars_data):
        car, created = Car.objects.get_or_create(
            numplate=car_data['numplate'],
            defaults={
                'company': company,
                'region': 'Bishkek',
                'vin': car_data['vin'],
                'brand': car_data['brand'],
                'title': car_data['title'],
                'year': car_data['year'],
                'fueltype': car_data['fueltype'],
                'type': car_data['type'],
                'driver': 'Водитель' if i == 0 else '-',
                'status': 'ACTIVE',
            }
        )
        if created:
            print(f"   ✓ Автомобиль создан: {car.numplate} ({car.brand} {car.title})")
        else:
            print(f"   ✓ Автомобиль найден: {car.numplate} ({car.brand} {car.title})")
        created_cars.append(car)
    
    # Создание записей о топливе
    print("\n4. Создание записей о топливе...")
    
    for car in created_cars[:3]:  # Для первых 3 автомобилей
        for month_offset in range(3):  # За последние 3 месяца
            date = datetime.now() - timedelta(days=30 * month_offset)
            fuel, created = Fuel.objects.get_or_create(
                car=car,
                year=date.year,
                month=date.month,
                defaults={
                    'liters': 150,
                    'monthly_mileage': 1500,
                    'total_cost': 7500,
                    'consumption': Decimal('10.00'),
                }
            )
            if created:
                print(f"   ✓ Топливо: {car.numplate} ({date.year}-{date.month:02d}) - {fuel.liters}л")
    
    # Создание страховок
    print("\n5. Создание страховок...")
    
    for car in created_cars[:2]:  # Для первых 2 автомобилей
        insurance, created = Insurance.objects.get_or_create(
            car=car,
            number=f'POL-{car.numplate.replace(" ", "")}-2026',
            defaults={
                'insurance_type': 'OSAGO',
                'start_date': datetime.now().date(),
                'end_date': (datetime.now() + timedelta(days=365)).date(),
                'cost': 15000,
            }
        )
        if created:
            print(f"   ✓ Страховка: {car.numplate} ({insurance.number})")
    
    # Создание техосмотров
    print("\n6. Создание техосмотров...")
    
    for car in created_cars[:2]:  # Для первых 2 автомобилей
        inspection, created = Inspection.objects.get_or_create(
            car=car,
            number=f'TO-{car.numplate.replace(" ", "")}-2026',
            defaults={
                'inspected_at': datetime.now().date(),
                'cost': 5000,
            }
        )
        if created:
            print(f"   ✓ Техосмотр: {car.numplate} ({inspection.number})")
    
    # Создание записей о запчастях
    print("\n7. Создание записей о запчастях...")
    
    spares_data = [
        {'title': 'Замена масла', 'part_price': 3000, 'job_price': 1000},
        {'title': 'Замена тормозных колодок', 'part_price': 5000, 'job_price': 2000},
        {'title': 'Замена фильтров', 'part_price': 1500, 'job_price': 500},
    ]
    
    for car in created_cars[:2]:  # Для первых 2 автомобилей
        for spare_data in spares_data:
            spare, created = Spare.objects.get_or_create(
                car=car,
                title=spare_data['title'],
                defaults={
                    'part_price': spare_data['part_price'],
                    'job_price': spare_data['job_price'],
                    'installed_at': (datetime.now() - timedelta(days=15)).date(),
                }
            )
            if created:
                print(f"   ✓ Запчасть: {car.numplate} - {spare.title}")
    
    # Итоговая статистика
    print("\n" + "=" * 60)
    print("ИТОГИ:")
    print(f"  Компаний: {Company.objects.count()}")
    print(f"  Пользователей: {User.objects.count()}")
    print(f"  Автомобилей: {Car.objects.count()}")
    print(f"  Записей о топливе: {Fuel.objects.count()}")
    print(f"  Страховок: {Insurance.objects.count()}")
    print(f"  Техосмотров: {Inspection.objects.count()}")
    print(f"  Запчастей: {Spare.objects.count()}")
    print("=" * 60)
    print("\n✓ Тестовые данные созданы успешно!")
    print("\nЛогин для входа:")
    print("  Username: admin")
    print("  Password: parko123")
    print("=" * 60)


if __name__ == '__main__':
    create_test_data()
