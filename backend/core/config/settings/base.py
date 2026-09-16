"""
Base Django settings shared across all environments.

Environment variables are read via os.environ.get — no additional dependencies required.
All secrets MUST be provided via environment variables; no hardcoded defaults in this file.
"""
import os
from pathlib import Path

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

# Repository root: …/SERVICE-DjangoTemplate-NoAuth/
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent

# ---------------------------------------------------------------------------
# Core security
# ---------------------------------------------------------------------------

SECRET_KEY = os.environ['DJANGO_SECRET_KEY']  # Intentionally no default — must be set

DEBUG = False

ALLOWED_HOSTS = [
    h.strip()
    for h in os.environ.get('DJANGO_ALLOWED_HOSTS', '').split(',')
    if h.strip()
]

# ---------------------------------------------------------------------------
# Application definition
# ---------------------------------------------------------------------------

DJANGO_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

THIRD_PARTY_APPS = [
    'rest_framework',
    'drf_spectacular',
    'corsheaders',
    'django_filters',
]

LOCAL_APPS = [
    'apps.common',
    'apps.health',
    'apps.audit',
    'apps.notifications',
    'apps.users',
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

# ---------------------------------------------------------------------------
# Middleware  (order is significant — do not reorder without reason)
# ---------------------------------------------------------------------------

MIDDLEWARE = [
    # 1. Security headers first
    'django.middleware.security.SecurityMiddleware',
    # 2. WhiteNoise for static file serving (must be after SecurityMiddleware)
    'whitenoise.middleware.WhiteNoiseMiddleware',
    # 3. Session before CORS so session cookies are available to CORS logic
    'django.contrib.sessions.middleware.SessionMiddleware',
    # 4. CORS must be before CommonMiddleware
    'corsheaders.middleware.CorsMiddleware',
    # 5. Standard Django middleware
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    # 6. Custom middleware — correlation id before logging so the id is available
    'core.middleware.correlation.CorrelationMiddleware',
    'core.middleware.logging.RequestLoggingMiddleware',
]

# ---------------------------------------------------------------------------
# URL / ASGI / WSGI
# ---------------------------------------------------------------------------

ROOT_URLCONF = 'core.config.urls'
ASGI_APPLICATION = 'core.config.asgi.application'
WSGI_APPLICATION = 'core.config.wsgi.application'

# ---------------------------------------------------------------------------
# Templates
# ---------------------------------------------------------------------------

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# ---------------------------------------------------------------------------
# Authentication
# ---------------------------------------------------------------------------

# Placeholder — authentication backend is injected per-project.
# Projects that add auth should override AUTH_USER_MODEL and add the relevant
# authentication app to INSTALLED_APPS / AUTHENTICATION_BACKENDS.
AUTH_USER_MODEL = 'users.User'

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ---------------------------------------------------------------------------
# Database (no default — must be provided per environment)
# ---------------------------------------------------------------------------

DATABASES = {}  # Each environment settings file MUST define this.

# ---------------------------------------------------------------------------
# Caching
# ---------------------------------------------------------------------------

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake',
        'TIMEOUT': 300,
        'OPTIONS': {
            'MAX_ENTRIES': 1000,
        },
    }
}

# ---------------------------------------------------------------------------
# Internationalisation
# ---------------------------------------------------------------------------

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# ---------------------------------------------------------------------------
# Static / Media files
# ---------------------------------------------------------------------------

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'mediafiles'

# ---------------------------------------------------------------------------
# Primary key field type
# ---------------------------------------------------------------------------

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ---------------------------------------------------------------------------
# Django REST Framework
# ---------------------------------------------------------------------------

REST_FRAMEWORK = {
    # Renderers
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    # Parsers
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.MultiPartParser',
        'rest_framework.parsers.FileUploadParser',
    ],
    # Authentication — empty by default; projects inject their own scheme.
    'DEFAULT_AUTHENTICATION_CLASSES': [],
    # Permissions — AllowAny by default; projects override as required.
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
    # Pagination
    'DEFAULT_PAGINATION_CLASS': 'core.utils.pagination.StandardResultsPagination',
    'PAGE_SIZE': 20,
    # Filtering
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    # OpenAPI schema
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    # Exception handling
    'EXCEPTION_HANDLER': 'core.exceptions.handlers.custom_exception_handler',
    # Throttling — configured but rates can be overridden per environment / view.
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour',
    },
}

# ---------------------------------------------------------------------------
# drf-spectacular (OpenAPI)
# ---------------------------------------------------------------------------

SPECTACULAR_SETTINGS = {
    'TITLE': os.environ.get('API_TITLE', 'Service API'),
    'DESCRIPTION': os.environ.get(
        'API_DESCRIPTION',
        'Enterprise Django REST API — auto-generated OpenAPI 3 schema.',
    ),
    'VERSION': os.environ.get('API_VERSION', '1.0.0'),
    'SERVE_INCLUDE_SCHEMA': False,
    'SCHEMA_PATH_PREFIX': r'/api/v[0-9]',
    'COMPONENT_SPLIT_REQUEST': True,
    'SORT_OPERATIONS': False,
    'ENUM_GENERATE_CHOICE_DESCRIPTION': True,
    'POSTPROCESSING_HOOKS': [
        'drf_spectacular.hooks.postprocess_schema_enums',
    ],
    'SWAGGER_UI_SETTINGS': {
        'deepLinking': True,
        'displayRequestDuration': True,
        'filter': True,
        'persistAuthorization': True,
    },
    'REDOC_UI_SETTINGS': {
        'hideDownloadButton': False,
    },
    'CONTACT': {
        'name': os.environ.get('API_CONTACT_NAME', 'Engineering Team'),
        'email': os.environ.get('API_CONTACT_EMAIL', ''),
    },
    'LICENSE': {
        'name': os.environ.get('API_LICENSE', 'Proprietary'),
    },
}

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------

CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = [
    o.strip()
    for o in os.environ.get('CORS_ALLOWED_ORIGINS', '').split(',')
    if o.strip()
]
CORS_ALLOWED_ORIGIN_REGEXES = []
CORS_EXPOSE_HEADERS = ['Content-Disposition', 'X-Correlation-ID', 'X-Request-ID']
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
    'x-correlation-id',
    'x-request-id',
]

# ---------------------------------------------------------------------------
# Security headers
# ---------------------------------------------------------------------------

SECURE_BROWSER_XSS_FILTER = True          # Deprecated in modern browsers but harmless
X_FRAME_OPTIONS = 'DENY'
SECURE_CONTENT_TYPE_NOSNIFF = True

# HSTS — disabled in base, enabled fully in production.
SECURE_HSTS_SECONDS = 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = False
SECURE_HSTS_PRELOAD = False

# SSL redirect — disabled in base, enabled in production.
SECURE_SSL_REDIRECT = False

# Cookie security
SESSION_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SECURE = True
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SAMESITE = 'Strict'

# Referrer-Policy header (set via middleware or web server; documented here for clarity)
SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'

# Content-Security-Policy — projects should tighten this via CSP middleware (e.g. django-csp).
# Provided as a project-level constant so it can be referenced in CSP configuration.
CSP_DEFAULT_SRC = ("'self'",)
CSP_SCRIPT_SRC = ("'self'",)
CSP_STYLE_SRC = ("'self'", "'unsafe-inline'")   # 'unsafe-inline' for Swagger/Redoc UI
CSP_IMG_SRC = ("'self'", 'data:')
CSP_FONT_SRC = ("'self'",)
CSP_CONNECT_SRC = ("'self'",)
CSP_FRAME_ANCESTORS = ("'none'",)

# ---------------------------------------------------------------------------
# Logging — structured JSON with Correlation/Request ID fields
# ---------------------------------------------------------------------------

LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'json': {
            '()': 'pythonjsonlogger.jsonlogger.JsonFormatter',
            'fmt': '%(asctime)s %(levelname)s %(name)s %(message)s',
            'datefmt': '%Y-%m-%dT%H:%M:%S',
            'static_fields': {
                'service': os.environ.get('SERVICE_NAME', 'django-service'),
                'environment': os.environ.get('ENVIRONMENT', 'unknown'),
            },
        },
        'verbose': {
            'format': (
                '[%(asctime)s] %(levelname)-8s %(name)s '
                '[cid=%(correlation_id)s] %(message)s'
            ),
            'datefmt': '%Y-%m-%d %H:%M:%S',
        },
    },
    'filters': {
        'require_debug_false': {'()': 'django.utils.log.RequireDebugFalse'},
        'require_debug_true': {'()': 'django.utils.log.RequireDebugTrue'},
        'correlation_id': {
            '()': 'core.logging.filters.CorrelationIdFilter',
        },
        'sensitive_data': {
            '()': 'core.logging.filters.SensitiveDataFilter',
        },
    },
    'handlers': {
        'console_json': {
            'class': 'logging.StreamHandler',
            'formatter': 'json',
            'filters': ['correlation_id', 'sensitive_data'],
        },
        'null': {
            'class': 'logging.NullHandler',
        },
    },
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
        'django.db.backends': {
            'handlers': ['console_json'],
            'level': 'WARNING',
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
# File upload limits
# ---------------------------------------------------------------------------

MAX_UPLOAD_SIZE = int(os.environ.get('MAX_UPLOAD_SIZE', str(10 * 1024 * 1024)))  # 10 MB
DATA_UPLOAD_MAX_MEMORY_SIZE = MAX_UPLOAD_SIZE
FILE_UPLOAD_MAX_MEMORY_SIZE = MAX_UPLOAD_SIZE

# ---------------------------------------------------------------------------
# Rate limiting constants (referenced by throttle classes / nginx config)
# ---------------------------------------------------------------------------

RATE_LIMIT_ANON = os.environ.get('RATE_LIMIT_ANON', '100/hour')
RATE_LIMIT_USER = os.environ.get('RATE_LIMIT_USER', '1000/hour')
RATE_LIMIT_BURST = os.environ.get('RATE_LIMIT_BURST', '20/minute')
