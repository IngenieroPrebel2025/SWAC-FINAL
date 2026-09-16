"""
View decorators.

``@cache_response(timeout, key_func)``
    Cache the full response body and status code for function-based views.
    Uses Django's default cache backend.  Cached responses are keyed by the
    view's full request URL by default; a custom ``key_func`` can be supplied
    for finer-grained control (e.g. per-user caching).

    **Class-based views:** use DRF's ``method_decorator`` to apply this to
    individual methods, or subclass and call ``cache_response`` inside
    ``dispatch``.

``@no_cache``
    Unconditionally add ``Cache-Control: no-store`` to the response so that
    browsers and intermediate proxies never store the response.
"""

from __future__ import annotations

import functools
import hashlib
from collections.abc import Callable
from typing import Any

from django.core.cache import cache
from django.http import HttpRequest, HttpResponse

__all__ = ["cache_response", "no_cache"]

# ---------------------------------------------------------------------------
# Default cache-key builder
# ---------------------------------------------------------------------------


def _default_key_func(request: HttpRequest) -> str:
    """Build a cache key from the request's absolute URI."""
    raw = f"cache_response:{request.method}:{request.build_absolute_uri()}"
    return hashlib.sha256(raw.encode()).hexdigest()


# ---------------------------------------------------------------------------
# @cache_response
# ---------------------------------------------------------------------------


def cache_response(
    timeout: int = 300,
    key_func: Callable[[HttpRequest], str] | None = None,
) -> Callable[[Callable[..., HttpResponse]], Callable[..., HttpResponse]]:
    """Cache the view's response for *timeout* seconds.

    Args:
        timeout:  Cache TTL in seconds (default: 300 / 5 minutes).
        key_func: Optional callable ``(request) -> str`` that returns the
                  cache key.  Defaults to a SHA-256 of the absolute URI.

    Usage::

        @cache_response(timeout=60)
        def my_view(request):
            ...

        @cache_response(timeout=120, key_func=lambda r: f"user:{r.user.id}:data")
        def user_data_view(request):
            ...
    """
    _key_fn = key_func or _default_key_func

    def decorator(
        view_func: Callable[..., HttpResponse],
    ) -> Callable[..., HttpResponse]:
        @functools.wraps(view_func)
        def wrapper(request: HttpRequest, *args: Any, **kwargs: Any) -> HttpResponse:
            key = _key_fn(request)
            cached = cache.get(key)
            if cached is not None:
                return cached

            response: HttpResponse = view_func(request, *args, **kwargs)

            # Only cache successful responses to avoid persisting transient errors.
            if response.status_code == 200:
                cache.set(key, response, timeout)

            return response

        return wrapper

    return decorator


# ---------------------------------------------------------------------------
# @no_cache
# ---------------------------------------------------------------------------


def no_cache(
    view_func: Callable[..., HttpResponse],
) -> Callable[..., HttpResponse]:
    """Set ``Cache-Control: no-store`` on every response from the view.

    Usage::

        @no_cache
        def sensitive_view(request):
            ...
    """

    @functools.wraps(view_func)
    def wrapper(request: HttpRequest, *args: Any, **kwargs: Any) -> HttpResponse:
        response: HttpResponse = view_func(request, *args, **kwargs)
        response["Cache-Control"] = "no-store"
        return response

    return wrapper
