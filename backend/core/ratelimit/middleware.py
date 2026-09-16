"""
Rate limiting middleware for non-DRF views.

DRF views use throttle_classes. This middleware handles any other
request path (e.g., Django admin, custom views) with IP-based limiting.
"""

from __future__ import annotations

import logging
import time
from typing import TYPE_CHECKING, Callable

from django.conf import settings
from django.core.cache import cache
from django.http import JsonResponse

if TYPE_CHECKING:
    from django.http import HttpRequest, HttpResponse

logger = logging.getLogger(__name__)

RATE_LIMIT_ENABLED = getattr(settings, "MIDDLEWARE_RATE_LIMIT_ENABLED", False)
RATE_LIMIT_MAX = getattr(settings, "MIDDLEWARE_RATE_LIMIT_MAX", 500)
RATE_LIMIT_WINDOW = getattr(settings, "MIDDLEWARE_RATE_LIMIT_WINDOW", 3600)


class RateLimitMiddleware:
    """
    Simple IP-based rate limiting middleware.

    This is a secondary safeguard. Primary rate limiting for API endpoints
    is handled by DRF throttle classes (core.ratelimit.throttles).

    Disabled by default (MIDDLEWARE_RATE_LIMIT_ENABLED=False).
    Enable in production settings if needed.
    """

    def __init__(self, get_response: Callable) -> None:
        self.get_response = get_response

    def __call__(self, request: "HttpRequest") -> "HttpResponse":
        if RATE_LIMIT_ENABLED and not self._is_allowed(request):
            return JsonResponse(
                {
                    "success": False,
                    "error": {
                        "code": "RATE_LIMIT_EXCEEDED",
                        "message": "Too many requests. Please try again later.",
                        "details": [],
                    },
                },
                status=429,
            )
        return self.get_response(request)

    def _get_client_ip(self, request: "HttpRequest") -> str:
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            return x_forwarded_for.split(",")[0].strip()
        return request.META.get("REMOTE_ADDR", "unknown")

    def _is_allowed(self, request: "HttpRequest") -> bool:
        ip = self._get_client_ip(request)
        cache_key = f"ratelimit:mw:{ip}"
        current = cache.get(cache_key, 0)
        if current >= RATE_LIMIT_MAX:
            logger.warning("Rate limit exceeded for IP %s", ip)
            return False
        cache.set(cache_key, current + 1, RATE_LIMIT_WINDOW)
        return True
