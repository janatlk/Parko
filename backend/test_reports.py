import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
import django
django.setup()

from reports.report_generator import ReportGenerator
from companies.models import Company
from datetime import date

company = Company.objects.first()
print(f"Company: {company}")

if company:
    # Test Maintenance Costs
    print("\n=== Testing Maintenance Costs ===")
    try:
        result = ReportGenerator.generate(
            report_type='maintenance_costs',
            from_date=date(2026, 1, 1),
            to_date=date(2026, 3, 31),
            company=company,
            car_ids=None,
            filters={},
            include_charts=True
        )
        print(f"SUCCESS: {list(result.keys())}")
        print(f"Data items: {len(result.get('data', []))}")
        print(f"Charts: {len(result.get('charts', []))}")
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
    
    # Test Insurance Inspection
    print("\n=== Testing Insurance Inspection ===")
    try:
        result = ReportGenerator.generate(
            report_type='insurance_inspection',
            from_date=date(2026, 1, 1),
            to_date=date(2026, 3, 31),
            company=company,
            car_ids=None,
            filters={},
            include_charts=True
        )
        print(f"SUCCESS: {list(result.keys())}")
        print(f"Data items: {len(result.get('data', []))}")
        print(f"Charts: {len(result.get('charts', []))}")
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
    
    # Test Cost Analysis
    print("\n=== Testing Cost Analysis ===")
    try:
        result = ReportGenerator.generate(
            report_type='cost_analysis',
            from_date=date(2026, 1, 1),
            to_date=date(2026, 3, 31),
            company=company,
            car_ids=None,
            filters={},
            include_charts=True
        )
        print(f"SUCCESS: {list(result.keys())}")
        print(f"Data items: {len(result.get('data', []))}")
        print(f"Charts: {len(result.get('charts', []))}")
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
