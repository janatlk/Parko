import environ
from .base import *

env = environ.Env()
environ.Env.read_env(BASE_DIR / '.env')

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = env.str('DJANGO_SECRET_KEY', default='django-insecure-change-this-in-production')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = env.list('ALLOWED_HOSTS', default=['localhost', '127.0.0.1'])

# Database - Support both SQLite (local) and PostgreSQL (Supabase)
# Use PostgreSQL if POSTGRES_HOST is set, otherwise use SQLite
if env.str('POSTGRES_HOST', default=''):
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': env.str('POSTGRES_DB', default='postgres'),
            'USER': env.str('POSTGRES_USER', default='postgres'),
            'PASSWORD': env.str('POSTGRES_PASSWORD', default=''),
            'HOST': env.str('POSTGRES_HOST', default=''),
            'PORT': env.str('POSTGRES_PORT', default='5432'),
            'CONN_MAX_AGE': 600,
            'CONN_HEALTH_CHECKS': True,
            'OPTIONS': {
                'connect_timeout': 30,
                'sslmode': 'require',
            },
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# Cache for dashboard and API responses
# Using database cache for better persistence
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.db.DatabaseCache',
        'LOCATION': 'django_cache_table',
        'TIMEOUT': 300,  # 5 минут
        'OPTIONS': {
            'MAX_ENTRIES': 500,
            'CULL_FREQUENCY': 3,
        }
    }
}

# Demo session settings
DEMO_SESSION_LIMIT = 100
DEMO_SESSION_TTL = 7200  # 2 hours in seconds

# CORS settings
CORS_ALLOW_ALL_ORIGINS = True  # Only for development!
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
]
CORS_ALLOW_HEADERS = [
    'accept',
    'authorization',
    'content-type',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# Logging configuration for debugging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'ai': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'reports': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'reports.services_email': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}

# AI Assistant settings (override base defaults)
AI_SETTINGS = {
    'provider': env.str('AI_PROVIDER', default='groq'),
    'api_key': env.str('AI_API_KEY', default=''),
    'model': env.str('AI_MODEL', default='llama-3.1-8b-instant'),
}
