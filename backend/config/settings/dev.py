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
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql' if env.str('POSTGRES_HOST', default='') else 'django.db.backends.sqlite3',
        'NAME': env.str('POSTGRES_DB', default=str(BASE_DIR / 'db.sqlite3')),
        'USER': env.str('POSTGRES_USER', default=''),
        'PASSWORD': env.str('POSTGRES_PASSWORD', default=''),
        'HOST': env.str('POSTGRES_HOST', default=''),
        'PORT': env.str('POSTGRES_PORT', default='5432'),
        # Supabase-specific connection pooling settings
        'CONN_MAX_AGE': 600 if env.str('POSTGRES_HOST', default='') else 0,
        'CONN_HEALTH_CHECKS': True if env.str('POSTGRES_HOST', default='') else False,
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
