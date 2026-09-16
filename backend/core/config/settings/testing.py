"""
Testing settings.

Inherits from development (which already has DEBUG=True and relaxed security)
and further overrides for speed and isolation in automated test runs.

Usage:
    pytest --ds=core.config.settings.testing
    # or
    DJANGO_SETTINGS_MODULE=core.config.settings.testing python manage.py test
"""

from .development import *  # noqa: F401, F403

# ---------------------------------------------------------------------------
# Database — in-memory SQLite for maximum test isolation and speed
# ---------------------------------------------------------------------------

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
        'TEST': {
            'NAME': ':memory:',
        },
    }
}

# ---------------------------------------------------------------------------
# Password hashing — MD5 is insecure but very fast; acceptable in tests only
# ---------------------------------------------------------------------------

PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]

# ---------------------------------------------------------------------------
# Logging — suppress all output during tests to keep output clean
# ---------------------------------------------------------------------------

LOGGING = {
    'version': 1,
    'disable_existing_loggers': True,
    'handlers': {
        'null': {
            'class': 'logging.NullHandler',
        },
    },
    'root': {
        'handlers': ['null'],
        'level': 'CRITICAL',
    },
}

# ---------------------------------------------------------------------------
# Email — suppress sending during tests
# ---------------------------------------------------------------------------

EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'

# ---------------------------------------------------------------------------
# Caching — dummy cache to prevent cross-test state leakage
# ---------------------------------------------------------------------------

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
    }
}

# ---------------------------------------------------------------------------
# Media / Static — use temp dirs to avoid touching the filesystem
# ---------------------------------------------------------------------------

import tempfile  # noqa: E402

_TMP_DIR = tempfile.mkdtemp(prefix='django_test_')
MEDIA_ROOT = _TMP_DIR
STATIC_ROOT = _TMP_DIR

# ---------------------------------------------------------------------------
# Celery — run tasks synchronously so tests can assert on results immediately
# ---------------------------------------------------------------------------

CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True

# ---------------------------------------------------------------------------
# DRF — throttling disabled in tests to prevent rate-limit interference
# ---------------------------------------------------------------------------

REST_FRAMEWORK = {
    **REST_FRAMEWORK,  # noqa: F405
    'DEFAULT_THROTTLE_CLASSES': [],
    'DEFAULT_THROTTLE_RATES': {},
}

# ---------------------------------------------------------------------------
# Misc
# ---------------------------------------------------------------------------

# Disable CSRF in tests — DRF's APIClient handles this, but belt-and-suspenders.
MIDDLEWARE = [m for m in MIDDLEWARE if 'csrf' not in m.lower()]  # noqa: F405
