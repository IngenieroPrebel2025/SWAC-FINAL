"""
Root URL configuration.

URL layout:
    /admin/           — Django admin (can be disabled by unsetting DJANGO_ADMIN_ENABLED)
    /api/v1/          — Versioned REST API routes
    /health/          — Health-check endpoints (no auth required)
    /api/schema/      — Raw OpenAPI 3 schema (YAML/JSON download)
    /api/docs/        — Swagger UI
    /api/redoc/       — ReDoc UI
"""
import os

from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

# ---------------------------------------------------------------------------
# Admin site customisation
# ---------------------------------------------------------------------------

admin.site.site_header = os.environ.get('ADMIN_SITE_HEADER', 'Service Administration')
admin.site.site_title = os.environ.get('ADMIN_SITE_TITLE', 'Service Admin')
admin.site.index_title = os.environ.get('ADMIN_INDEX_TITLE', 'Administration')

# ---------------------------------------------------------------------------
# URL patterns
# ---------------------------------------------------------------------------

urlpatterns = [
    # Health check — must be reachable without authentication for load-balancer probes
    path('health/', include('apps.health.urls', namespace='health')),

    # Versioned REST API
    path('api/v1/', include('core.config.api_router', namespace='api-v1')),

    # OpenAPI schema — download as YAML or JSON
    path(
        'api/schema/',
        SpectacularAPIView.as_view(),
        name='schema',
    ),

    # Interactive API documentation
    path(
        'api/docs/',
        SpectacularSwaggerView.as_view(url_name='schema'),
        name='swagger-ui',
    ),
    path(
        'api/redoc/',
        SpectacularRedocView.as_view(url_name='schema'),
        name='redoc',
    ),
]

# ---------------------------------------------------------------------------
# Django admin — can be disabled per deployment via env var
# ---------------------------------------------------------------------------

_admin_enabled = os.environ.get('DJANGO_ADMIN_ENABLED', 'true').lower() not in ('false', '0', 'no')
_admin_url = os.environ.get('DJANGO_ADMIN_URL', 'admin/')

if _admin_enabled:
    urlpatterns += [
        path(_admin_url, admin.site.urls),
    ]
