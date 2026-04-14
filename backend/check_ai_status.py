"""
Quick diagnostic to check AI settings while Django is running
Run with: python manage.py shell < check_ai_status.py
"""
from django.conf import settings
from groq import Groq

print("=" * 70)
print("Parko AI Status Check")
print("=" * 70)

# Check settings
ai_settings = getattr(settings, 'AI_SETTINGS', {})
api_key = ai_settings.get('api_key', '')
model = ai_settings.get('model', 'N/A')
provider = ai_settings.get('provider', 'N/A')

print(f"\n✓ AI Settings loaded from settings.AI_SETTINGS")
print(f"  Provider: {provider}")
print(f"  Model: {model}")
print(f"  API Key present: {bool(api_key)}")
print(f"  API Key length: {len(api_key)}")

if api_key:
    print(f"  API Key prefix: {api_key[:10]}...")
    
    # Test Groq client
    print(f"\n🔄 Testing Groq API connection...")
    try:
        client = Groq(api_key=api_key)
        print("✓ Groq client initialized")
        
        # Quick test
        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": "Say 'OK'"}],
            max_tokens=10,
        )
        print(f"✓ Groq API call successful!")
        print(f"  Response: {response.choices[0].message.content.strip()}")
        print(f"\n✅ AI Assistant is WORKING correctly")
        
    except Exception as e:
        print(f"❌ Groq API test FAILED")
        print(f"  Error: {type(e).__name__}: {str(e)}")
        
        # Show detailed error
        if hasattr(e, 'message'):
            print(f"  Message: {e.message}")
        if hasattr(e, 'status_code'):
            print(f"  Status: {e.status_code}")
        if hasattr(e, 'response') and e.response:
            try:
                print(f"  Response: {e.response.text[:300]}")
            except:
                pass
        
        print(f"\n❌ AI Assistant has an issue")
else:
    print(f"\n❌ API key is not configured!")
    print(f"  Check your .env file and make sure AI_API_KEY is set")

print("\n" + "=" * 70)
