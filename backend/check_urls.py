import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
django.setup()

from django.urls import get_resolver

def show_urls(urllist, prefix=''):
    for entry in urllist:
        if hasattr(entry, 'url_patterns'):
            show_urls(entry.url_patterns, prefix + str(entry.pattern))
        else:
            if 'reports' in str(entry.pattern) or 'reports' in str(entry.callback) if hasattr(entry, 'callback') else False:
                print(f"{prefix}{entry.pattern} -> {entry.callback}")

resolver = get_resolver()
print("=== All Reports URLs ===\n")
show_urls(resolver.url_patterns)
