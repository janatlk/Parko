# Groq API Authentication Issue - Diagnosis & Fix

## Problem
Error message: "🔑 Ошибка авторизации: API-ключ недействителен или истёк. Обратитесь к администратору для проверки настроек AI."

## Root Cause Analysis
✅ **The Groq API key is VALID** - tested successfully with test script
✅ **The API key is loading correctly** - confirmed in Django settings
✅ **The Groq client initializes** - no errors during initialization

## Most Likely Causes

### 1. Django Server Not Restarted (MOST LIKELY)
When you update `.env` file, Django's development server might not reload the environment variables. The server caches the settings on startup.

**Solution**: **RESTART the Django server completely**
```bash
# Stop the current server (Ctrl+C)
# Then restart it:
cd C:\Parko\backend
python manage.py runserver
```

### 2. Wrong Settings File Being Used
Make sure you're running with `dev.py` settings which loads from `.env`:
```bash
python manage.py runserver --settings=config.settings.dev
```

### 3. Environment Variable Not Loaded
The `python-dotenv` package might not be loading the `.env` file.

**Check**: Add this to `manage.py` before Django setup:
```python
from dotenv import load_dotenv
load_dotenv()  # Add this line
```

## Changes Made

### 1. Enhanced Logging in `backend/ai/services.py`
Added comprehensive logging to track:
- ✅ API key configuration (masked for security)
- ✅ Groq client initialization
- ✅ API request details (model, messages count)
- ✅ API response details (tokens, response ID)
- ✅ Full error details with all attributes when errors occur

### 2. Updated Django Logging Configuration (`backend/config/settings/dev.py`)
Added specific logger for the `ai` module at DEBUG level to ensure all logs are output.

### 3. Created Test Script (`backend/test_groq_api.py`)
Standalone script to test Groq API connectivity independently of Django.

## How to Diagnose

### Step 1: Run the Test Script
```bash
cd C:\Parko\backend
python test_groq_api.py
```

Expected output:
```
✓ Groq client initialized successfully
✓ API call successful!
Response: OK
```

### Step 2: Check Django Server Logs
After restarting the Django server and making an AI request, you should see logs like:

```
INFO AI Settings - Provider: groq, Model: llama-3.1-8b-instant, API Key: gsk_*****...*****
INFO API Key length: 56, starts with: gsk_
INFO Groq client initialized for user 1
INFO Making Groq API call for user 1
INFO Model: llama-3.1-8b-instant
INFO Messages count: 4
INFO Groq API response received for user 1
INFO Response ID: chatcmpl-xxxxx
INFO AI response for user 1: 150 chars, first 100 chars: ...
```

If you see error logs, they will include:
```
ERROR Groq API error for user 1: <detailed error message>
ERROR Error type name: <error type>
ERROR Error.message: <message>
ERROR Error.status_code: <status code>
ERROR Error.response.body: <response body>
```

### Step 3: Check the Response
The error message now includes the actual Groq error details:
```
🔑 Ошибка авторизации: API-ключ недействителен или истёк.

Детали ошибки: <actual error from Groq>

Обратитесь к администратору для проверки настроек AI.
```

## Next Steps

1. **RESTART Django server** (most important!)
2. Make an AI request
3. Check the console logs for the detailed error message
4. If still failing, the logs will show you exactly what Groq is returning

## API Key Status
- Length: 56 characters
- Format: Valid Groq key (starts with `gsk_`)
- Status: ✅ **VALID** (tested successfully)

## Files Modified
- `backend/ai/services.py` - Added comprehensive logging
- `backend/config/settings/dev.py` - Added AI logger configuration
- `backend/test_groq_api.py` - Created standalone test script
