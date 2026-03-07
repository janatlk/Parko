import requests
import time

time.sleep(3)

print("Testing: http://localhost:8000/api/v1/reports/types/")
try:
    r = requests.get('http://localhost:8000/api/v1/reports/types/', timeout=5)
    print(f"Status: {r.status_code}")
    print(f"Content-Type: {r.headers.get('content-type')}")
    print(f"Response: {r.text[:500]}")
except Exception as e:
    print(f"Error: {e}")
