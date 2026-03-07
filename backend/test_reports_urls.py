import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
django.setup()

from django.urls import path, include

# Try importing reports urls directly
try:
    from reports import urls as reports_urls
    print("=== Reports URLs module loaded successfully ===\n")
    print(f"urlpatterns: {reports_urls.urlpatterns}")
    print(f"\nNumber of URL patterns: {len(reports_urls.urlpatterns)}")
    
    for pattern in reports_urls.urlpatterns:
        print(f"  - {pattern.pattern} -> {pattern.callback if hasattr(pattern, 'callback') else 'include'}")
except Exception as e:
    print(f"ERROR loading reports.urls: {e}")
    import traceback
    traceback.print_exc()
