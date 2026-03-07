import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
import django
django.setup()

from core.renderers import StandardJSONRenderer
from reports.report_generator import ReportGenerator
from companies.models import Company
from datetime import date
import json

company = Company.objects.first()
print(f"Company: {company}")

if company:
    # Test Maintenance Costs rendering
    print("\n=== Testing Maintenance Costs Rendering ===")
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
        print(f"Generated report with keys: {list(result.keys())}")
        
        # Test rendering
        renderer = StandardJSONRenderer()
        response_mock = type('obj', (object,), {'status_code': 200})()
        rendered = renderer.render(result, renderer_context={'response': response_mock})
        print(f"Rendered successfully! Length: {len(rendered)}")
        print(f"First 200 chars: {rendered[:200]}")
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
    
    # Test Insurance Inspection rendering
    print("\n=== Testing Insurance Inspection Rendering ===")
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
        print(f"Generated report with keys: {list(result.keys())}")
        
        # Test rendering
        renderer = StandardJSONRenderer()
        response_mock = type('obj', (object,), {'status_code': 200})()
        rendered = renderer.render(result, renderer_context={'response': response_mock})
        print(f"Rendered successfully! Length: {len(rendered)}")
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
    
    # Test Cost Analysis rendering
    print("\n=== Testing Cost Analysis Rendering ===")
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
        print(f"Generated report with keys: {list(result.keys())}")
        
        # Test rendering
        renderer = StandardJSONRenderer()
        response_mock = type('obj', (object,), {'status_code': 200})()
        rendered = renderer.render(result, renderer_context={'response': response_mock})
        print(f"Rendered successfully! Length: {len(rendered)}")
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
