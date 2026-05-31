import os
from .base import *

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'django-insecure-render-fallback-key-change-me')

DEBUG = True  # Temporary to diagnose admin 500 error

ALLOWED_HOSTS = ['*']

# Database - auto-switch: PostgreSQL if POSTGRES_HOST is set, else SQLite fallback
if os.environ.get('POSTGRES_HOST'):
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.environ.get('POSTGRES_DB', 'postgres'),
            'USER': os.environ.get('POSTGRES_USER', 'postgres'),
            'PASSWORD': os.environ.get('POSTGRES_PASSWORD', ''),
            'HOST': os.environ.get('POSTGRES_HOST', ''),
            'PORT': os.environ.get('POSTGRES_PORT', '5432'),
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

# Static files
# Use '/' as static URL so frontend assets (built with root-relative paths like /assets/...)
# are served directly by WhiteNoise without needing URL rewrites.
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [
    BASE_DIR / 'static',
]

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# WhiteNoise middleware for serving static files
MIDDLEWARE.insert(1, 'whitenoise.middleware.WhiteNoiseMiddleware')

STATICFILES_STORAGE = 'whitenoise.storage.CompressedStaticFilesStorage'

# CORS - allow all for demo
CORS_ALLOW_ALL_ORIGINS = True

# Security settings (relaxed for demo)
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False

# AI settings from environment
AI_SETTINGS = {
    'provider': os.environ.get('AI_PROVIDER', 'groq'),
    'api_key': os.environ.get('AI_API_KEY', ''),
    'model': os.environ.get('AI_MODEL', 'llama-3.1-8b-instant'),
}

# Email settings (optional)
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
