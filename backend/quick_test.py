import requests
import time

print("Waiting 5 seconds for server...")
time.sleep(5)

print("\nTesting reports endpoints...\n")

try:
    r = requests.get('http://localhost:8000/api/v1/reports/types/', timeout=5)
    print(f"Reports Types: Status {r.status_code}")
    if r.status_code == 200:
        print("SUCCESS!")
        print(r.json())
    elif r.status_code == 401:
        print("SUCCESS! (requires auth)")
    else:
        print(f"Response: {r.text[:200]}")
except Exception as e:
    print(f"Error: {e}")
