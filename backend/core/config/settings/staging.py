"""
Staging settings.

Inherits from base and configures external services (SQL Server, Redis)
via environment variables.  No secrets are hardcoded in this file.

Required environment variables:
    DJANGO_SECRET_KEY
    DJANGO_ALLOWED_HOSTS      (comma-separated)
    DB_NAME
    DB_HOST
    DB_PORT                   (default: 1433)
    DB_USER
    DB_PASSWORD
    REDIS_URL                 (e.g. redis://redis:6379/0)

Optional:
    CORS_ALLOWED_ORIGINS      (comma-separated)
    LOG_LEVEL                 (default: INFO)
    SERVICE_NAME
    ENVIRONMENT
"""
import os

from .base import *  # noqa: F401, F403
from .base import LOGGING

# ---------------------------------------------------------------------------
# Core
# ---------------------------------------------------------------------------

DEBUG = False

# SECRET_KEY is read from the environment in base.py via os.environ['DJANGO_SECRET_KEY']
# No override needed here — ensure the env var is set in the deployment manifest.

ALLOWED_HOSTS = [
    h.strip()
    for h in os.environ.get('DJANGO_ALLOWED_HOSTS', '').split(',')
    if h.strip()
]

# ---------------------------------------------------------------------------
# Database — SQL Server via mssql-django
# ---------------------------------------------------------------------------

DATABASES = {
    'default': {
        'ENGINE': 'mssql',
        'NAME': os.environ['DB_NAME'],
        'HOST': os.environ['DB_HOST'],
        'PORT': os.environ.get('DB_PORT', '1433'),
        'USER': os.environ['DB_USER'],
        'PASSWORD': os.environ['DB_PASSWORD'],
        'OPTIONS': {
            'driver': 'ODBC Driver 18 for SQL Server',
            'extra_params': 'TrustServerCertificate=yes',
            'unicode_results': True,
        },
    }
}

# ---------------------------------------------------------------------------
# Cache — Redis (override the base in-memory cache)
# ---------------------------------------------------------------------------

REDIS_URL = os.environ.get('REDIS_URL', 'redis://redis:6379/0')

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': REDIS_URL,
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'SOCKET_CONNECT_TIMEOUT': 5,
            'SOCKET_TIMEOUT': 5,
            'IGNORE_EXCEPTIONS': True,  # Degrade gracefully if Redis is unavailable
        },
        'KEY_PREFIX': os.environ.get('REDIS_KEY_PREFIX', 'django'),
        'TIMEOUT': 300,
    }
}

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------

CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = [
    o.strip()
    for o in os.environ.get('CORS_ALLOWED_ORIGINS', '').split(',')
    if o.strip()
]

# ---------------------------------------------------------------------------
# Email (configure per deployment; SMTP credentials injected via env)
# ---------------------------------------------------------------------------

EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = os.environ.get('EMAIL_HOST', 'localhost')
EMAIL_PORT = int(os.environ.get('EMAIL_PORT', '587'))
EMAIL_USE_TLS = os.environ.get('EMAIL_USE_TLS', 'True') == 'True'
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', 'noreply@example.com')

# ---------------------------------------------------------------------------
# Logging — structured JSON to stdout (same as base, explicit here for clarity)
# ---------------------------------------------------------------------------

LOGGING = {
    **LOGGING,
    'root': {
        'handlers': ['console_json'],
        'level': os.environ.get('LOG_LEVEL', 'INFO'),
    },
}

# ---------------------------------------------------------------------------
# Static files — WhiteNoise already configured in base
# ---------------------------------------------------------------------------

STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
