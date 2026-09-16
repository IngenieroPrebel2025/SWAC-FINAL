"""
Production settings.

Inherits from staging (which configures SQL Server, Redis, CORS from env vars)
and adds the strictest security posture, rate limits, and structured logging.

All the same environment variables as staging are required here.
Additional required variables for production:
    SECURE_HSTS_SECONDS       (recommended: 31536000)

No secrets are hardcoded in this file.
"""
import os

from .staging import *  # noqa: F401, F403
from .base import LOGGING, REST_FRAMEWORK

# ---------------------------------------------------------------------------
# HTTPS / HSTS
# ---------------------------------------------------------------------------

SECURE_SSL_REDIRECT = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

SECURE_HSTS_SECONDS = int(os.environ.get('SECURE_HSTS_SECONDS', '31536000'))  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# ---------------------------------------------------------------------------
# Cookie security (already True in base; reaffirmed here for clarity)
# ---------------------------------------------------------------------------

SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# ---------------------------------------------------------------------------
# CORS — wildcard explicitly forbidden in production
# ---------------------------------------------------------------------------

CORS_ALLOW_ALL_ORIGINS = False  # Must never be True in production
# CORS_ALLOWED_ORIGINS is populated from env in staging.py

# ---------------------------------------------------------------------------
# Rate limiting — tighter in production
# ---------------------------------------------------------------------------

RATE_LIMIT_ANON = os.environ.get('RATE_LIMIT_ANON', '60/hour')
RATE_LIMIT_USER = os.environ.get('RATE_LIMIT_USER', '600/hour')
RATE_LIMIT_BURST = os.environ.get('RATE_LIMIT_BURST', '10/minute')

REST_FRAMEWORK = {
    **REST_FRAMEWORK,
    'DEFAULT_THROTTLE_RATES': {
        'anon': RATE_LIMIT_ANON,
        'user': RATE_LIMIT_USER,
    },
}

# ---------------------------------------------------------------------------
# Logging — structured JSON to stdout, WARNING+ for Django internals
# ---------------------------------------------------------------------------

LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')

LOGGING = {
    **LOGGING,
    'root': {
        'handlers': ['console_json'],
        'level': LOG_LEVEL,
    },
    'loggers': {
        'django': {
            'handlers': ['console_json'],
            'level': 'WARNING',
            'propagate': False,
        },
        'django.request': {
            'handlers': ['console_json'],
            'level': 'ERROR',
            'propagate': False,
        },
        'django.security': {
            'handlers': ['console_json'],
            'level': 'WARNING',
            'propagate': False,
        },
        'django.db.backends': {
            'handlers': ['console_json'],
            'level': 'ERROR',
            'propagate': False,
        },
        'core': {
            'handlers': ['console_json'],
            'level': LOG_LEVEL,
            'propagate': False,
        },
        'apps': {
            'handlers': ['console_json'],
            'level': LOG_LEVEL,
            'propagate': False,
        },
    },
}

# ---------------------------------------------------------------------------
# Miscellaneous production hardening
# ---------------------------------------------------------------------------

# Prevent Django admin from leaking info about existing accounts.
SILENCED_SYSTEM_CHECKS = []

# Restrict DEBUG toolbar (should not be installed in prod, but guard anyway).
INTERNAL_IPS: list[str] = []
