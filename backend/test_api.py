import requests

# Test without authentication first to see if URL exists
print("Testing reports endpoints (without auth)...\n")

endpoints = [
    'http://localhost:8000/api/v1/reports/types/',
    'http://localhost:8000/api/v1/reports/cars/',
]

for url in endpoints:
    try:
        r = requests.get(url, timeout=5)
        print(f"URL: {url}")
        print(f"Status: {r.status_code}")
        if r.status_code == 401:
            print("  OK - URL exists (requires authentication)")
        elif r.status_code == 404:
            print("  ERROR - URL NOT FOUND (404)")
        else:
            print(f"  Response: {r.text[:100]}")
        print()
    except requests.exceptions.ConnectionError:
        print(f"  ERROR - Connection refused - server not running on port 8000")
        print()
    except Exception as e:
        print(f"  ERROR - {e}")
        print()
