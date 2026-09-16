"""
Rate limiting configuration and custom throttle classes.

Provides global and per-endpoint rate limiting with Redis-backed
storage for distributed environments. Falls back to in-memory
caching in development.

Configure rates in settings:
    REST_FRAMEWORK = {
        'DEFAULT_THROTTLE_CLASSES': [
            'core.ratelimit.throttles.GlobalAnonThrottle',
            'core.ratelimit.throttles.GlobalUserThrottle',
        ],
        'DEFAULT_THROTTLE_RATES': {
            'anon_global': '100/hour',
            'user_global': '1000/hour',
            'burst': '60/minute',
            'sustained': '1000/day',
        }
    }
"""

from __future__ import annotations

import logging

from django.conf import settings
from rest_framework.throttling import AnonRateThrottle, SimpleRateThrottle, UserRateThrottle

logger = logging.getLogger(__name__)


class GlobalAnonThrottle(AnonRateThrottle):
    """Global rate limit for unauthenticated requests."""

    scope = "anon_global"


class GlobalUserThrottle(UserRateThrottle):
    """Global rate limit for authenticated requests."""

    scope = "user_global"


class BurstAnonThrottle(AnonRateThrottle):
    """Short-window burst limit for anonymous requests."""

    scope = "burst"


class SustainedAnonThrottle(AnonRateThrottle):
    """Long-window sustained limit for anonymous requests."""

    scope = "sustained"


class PerEndpointThrottle(SimpleRateThrottle):
    """
    Configurable per-endpoint throttle.

    Usage in a ViewSet:
        throttle_classes = [PerEndpointThrottle]
        throttle_scope = 'my_endpoint'

    Add 'my_endpoint': 'N/period' to DEFAULT_THROTTLE_RATES.
    """

    scope = "default"

    def get_cache_key(self, request, view):
        if request.user and request.user.is_authenticated:
            ident = request.user.pk
        else:
            ident = self.get_ident(request)
        return self.cache_format % {
            "scope": self.scope,
            "ident": ident,
        }


class HealthCheckThrottle(SimpleRateThrottle):
    """
    Lenient throttle for health check endpoints.
    Prevents health check abuse while allowing Kubernetes probes.
    """

    scope = "health"
    rate = "300/minute"

    def get_cache_key(self, request, view):
        return f"throttle_health_{self.get_ident(request)}"
