"""
Development settings.

Inherits from base and overrides for a fast local development experience.
Never use this settings module in staging or production.
"""
import os

from .base import *  # noqa: F401, F403
from .base import INSTALLED_APPS, LOGGING, REST_FRAMEWORK

# ---------------------------------------------------------------------------
# Core overrides
# ---------------------------------------------------------------------------

DEBUG = True

# Insecure key for local development only — never commit a real key.
SECRET_KEY = os.environ.get(  # noqa: S105  (bandit: not a real secret)
    'DJANGO_SECRET_KEY',
    'django-insecure-dev-key-change-in-production',
)

ALLOWED_HOSTS = ['*']

# ---------------------------------------------------------------------------
# Database — SQLite for zero-setup local dev
# ---------------------------------------------------------------------------

BASE_DIR_RESOLVE = __import__('pathlib').Path(__file__).resolve().parent.parent.parent.parent

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR_RESOLVE / 'db.sqlite3',
    }
}

# ---------------------------------------------------------------------------
# Cache — simple in-memory (already in base, but explicit here for clarity)
# ---------------------------------------------------------------------------

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    }
}

# ---------------------------------------------------------------------------
# CORS — allow all in development
# ---------------------------------------------------------------------------

CORS_ALLOW_ALL_ORIGINS = True

# ---------------------------------------------------------------------------
# Security — relax cookie flags so http:// localhost works
# ---------------------------------------------------------------------------

SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False

# ---------------------------------------------------------------------------
# Email — print to console instead of sending
# ---------------------------------------------------------------------------

EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# ---------------------------------------------------------------------------
# Logging — human-readable console output (not JSON) for development
# ---------------------------------------------------------------------------

LOGGING = {
    **LOGGING,
    'formatters': {
        **LOGGING['formatters'],
        'dev_console': {
            'format': '[%(asctime)s] %(levelname)-8s %(name)s  %(message)s',
            'datefmt': '%H:%M:%S',
        },
    },
    'handlers': {
        **LOGGING['handlers'],
        'console_dev': {
            'class': 'logging.StreamHandler',
            'formatter': 'dev_console',
        },
    },
    'root': {
        'handlers': ['console_dev'],
        'level': 'DEBUG',
    },
    'loggers': {
        'django': {
            'handlers': ['console_dev'],
            'level': 'INFO',
            'propagate': False,
        },
        'django.request': {
            'handlers': ['console_dev'],
            'level': 'INFO',
            'propagate': False,
        },
        'django.db.backends': {
            'handlers': ['console_dev'],
            # Set to 'DEBUG' to log all SQL queries; 'WARNING' to suppress them.
            'level': 'WARNING',
            'propagate': False,
        },
        'core': {
            'handlers': ['console_dev'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'apps': {
            'handlers': ['console_dev'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}

# ---------------------------------------------------------------------------
# DRF — enable BrowsableAPIRenderer in dev for easy manual testing
# ---------------------------------------------------------------------------

REST_FRAMEWORK = {
    **REST_FRAMEWORK,
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',
    ],
}

# ---------------------------------------------------------------------------
# Optional development tools (installed only if present in the venv)
# ---------------------------------------------------------------------------

try:
    import django_extensions  # noqa: F401

    INSTALLED_APPS = INSTALLED_APPS + ['django_extensions']
except ImportError:
    pass
