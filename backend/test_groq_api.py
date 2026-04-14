"""
Test script to verify Groq API connectivity and key validity
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
django.setup()

from django.conf import settings
from groq import Groq
import logging

# Enable detailed logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def test_groq_api():
    print("=" * 60)
    print("Groq API Test")
    print("=" * 60)
    
    # Get settings
    ai_settings = getattr(settings, 'AI_SETTINGS', {})
    api_key = ai_settings.get('api_key', '')
    model = ai_settings.get('model', 'llama-3.1-8b-instant')
    
    print(f"\nAI Settings from Django:")
    print(f"  Provider: {ai_settings.get('provider')}")
    print(f"  Model: {model}")
    print(f"  API Key length: {len(api_key)}")
    print(f"  API Key starts with: {api_key[:15] if api_key else 'N/A'}")
    print(f"  API Key (masked): {api_key[:10]}...{api_key[-4:] if len(api_key) > 14 else 'N/A'}")
    
    if not api_key:
        print("\n❌ ERROR: API key is empty!")
        return
    
    print(f"\nInitializing Groq client...")
    try:
        client = Groq(api_key=api_key)
        print("✓ Groq client initialized successfully")
        
        print(f"\nMaking test request to model: {model}")
        print("This may take a few seconds...")
        
        try:
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": "You are a test system."},
                    {"role": "user", "content": "Say 'OK' if you can hear me."}
                ],
                temperature=0.7,
                max_tokens=100,
            )
            
            print("\n✓ API call successful!")
            print(f"  Response ID: {response.id}")
            print(f"  Response model: {response.model}")
            print(f"  Usage: {response.usage}")
            print(f"  Response: {response.choices[0].message.content}")
            
        except Exception as e:
            print(f"\n❌ API call FAILED!")
            print(f"  Error type: {type(e).__name__}")
            print(f"  Error message: {str(e)}")
            
            # Print all error attributes
            if hasattr(e, 'message'):
                print(f"  Error.message: {e.message}")
            if hasattr(e, 'status_code'):
                print(f"  Error.status_code: {e.status_code}")
            if hasattr(e, 'code'):
                print(f"  Error.code: {e.code}")
            if hasattr(e, 'type'):
                print(f"  Error.type: {e.type}")
            if hasattr(e, 'response') and e.response is not None:
                print(f"  Error.response.status_code: {e.response.status_code}")
                try:
                    print(f"  Error.response.body: {e.response.text[:500]}")
                except:
                    pass
            
            import traceback
            print(f"\n  Full traceback:")
            traceback.print_exc()
            
    except Exception as e:
        print(f"\n❌ Failed to initialize Groq client!")
        print(f"  Error type: {type(e).__name__}")
        print(f"  Error message: {str(e)}")
        import traceback
        print(f"\n  Full traceback:")
        traceback.print_exc()
    
    print("\n" + "=" * 60)

if __name__ == '__main__':
    test_groq_api()
