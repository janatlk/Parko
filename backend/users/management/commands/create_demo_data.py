"""
Create demo data for Demo Company
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from companies.models import Company
from fleet.models import Car, Fuel, Insurance, Inspection
from datetime import date, timedelta
import random

User = get_user_model()


class Command(BaseCommand):
    help = 'Create demo data for Demo Company'

    def handle(self, *args, **options):
        # Get Demo Company
        try:
            company = Company.objects.get(name='Demo Company')
        except Company.DoesNotExist:
            self.stdout.write(self.style.ERROR('Demo Company not found. Run create_demo_user first.'))
            return

        # Clear existing demo data
        Car.objects.filter(company=company).delete()
        self.stdout.write('Cleared existing demo data')

        # Create demo cars
        cars_data = [
            {'numplate': 'A001AA', 'brand': 'Toyota', 'model': 'Camry', 'vin': 'DEMO1234567890001'},
            {'numplate': 'B002BB', 'brand': 'BMW', 'model': 'X5', 'vin': 'DEMO1234567890002'},
            {'numplate': 'C003CC', 'brand': 'Mercedes', 'model': 'E-Class', 'vin': 'DEMO1234567890003'},
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
            self.stdout.write(f'Created car: {car.numplate}')

        # Create fuel records for last 3 months
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
        
        self.stdout.write(self.style.SUCCESS(f'Created {Fuel.objects.filter(car__company=company).count()} fuel records'))

        # Create insurances
        for car in cars:
            Insurance.objects.create(
                car=car,
                insurance_type='OSAGO',
                number=f'DEMO-{car.numplate}-OSAGO',
                start_date=date.today() - timedelta(days=30),
                end_date=date.today() + timedelta(days=335),
                cost=random.randint(5000, 10000)
            )

        self.stdout.write(self.style.SUCCESS(f'Created {Insurance.objects.filter(car__company=company).count()} insurance records'))

        # Create inspections
        for car in cars:
            Inspection.objects.create(
                car=car,
                number=f'DEMO-{car.numplate}-INSP',
                inspected_at=date.today() - timedelta(days=15),
                cost=random.randint(1000, 3000)
            )

        self.stdout.write(self.style.SUCCESS(f'Created {Inspection.objects.filter(car__company=company).count()} inspection records'))
        
        self.stdout.write(self.style.SUCCESS('✅ Demo data created successfully!'))
        self.stdout.write(f'Total cars: {Car.objects.filter(company=company).count()}')
