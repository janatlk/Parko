import environ
from .base import *

env = environ.Env()
environ.Env.read_env(BASE_DIR / '.env')

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = env.str('DJANGO_SECRET_KEY', default='django-insecure-change-this-in-production')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1']

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Cache for demo sessions
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.db.DatabaseCache',
        'LOCATION': 'demo_cache_table',
        'TIMEOUT': 7200,  # 2 hours
        'OPTIONS': {
            'MAX_ENTRIES': 1000
        }
    }
}

# Demo session settings
DEMO_SESSION_LIMIT = 100
DEMO_SESSION_TTL = 7200  # 2 hours in seconds

# CORS settings
CORS_ALLOW_ALL_ORIGINS = True  # Only for development!
