"""
Cache decorators for DRF views.

``cache_view``
    Caches the full response of a DRF view using Django's cache framework.
    The cache key is based on the request path, query string, and any
    specified ``vary_on_headers``.

``invalidate_cache_pattern``
    Deletes all cache keys matching a glob-style pattern using Redis
    ``SCAN`` + ``DEL``.  Falls back to a no-op when Redis is not configured.

Usage::

    from infrastructure.cache.decorators import cache_view, invalidate_cache_pattern

    class ProductListView(APIView):
        @cache_view(timeout=600, key_prefix="products")
        def get(self, request):
            ...

    # Invalidate after a product is updated:
    invalidate_cache_pattern("products:*")
"""

from __future__ import annotations

import functools
import hashlib
import logging
from collections.abc import Callable
from typing import Any

__all__ = ["cache_view", "invalidate_cache_pattern"]

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _build_cache_key(
    prefix: str,
    request: Any,
    vary_on_headers: list[str] | None,
) -> str:
    """Construct a deterministic, collision-resistant cache key.

    The key incorporates:
    - The configured ``key_prefix``.
    - The full request path including query string.
    - A hash of the selected request headers (when ``vary_on_headers`` is set).
    """
    parts: list[str] = [prefix, request.get_full_path()]

    if vary_on_headers:
        header_values = "|".join(
            f"{h}={request.headers.get(h, '')}" for h in sorted(vary_on_headers)
        )
        header_hash = hashlib.md5(header_values.encode(), usedforsecurity=False).hexdigest()[:8]
        parts.append(header_hash)

    return ":".join(parts)


# ---------------------------------------------------------------------------
# cache_view
# ---------------------------------------------------------------------------


def cache_view(
    timeout: int = 300,
    key_prefix: str = "view",
    vary_on_headers: list[str] | None = None,
) -> Callable[[Callable[..., Any]], Callable[..., Any]]:
    """Decorator to cache DRF view responses.

    Supports class-based views (applied to the ``get`` method or similar)
    and function-based views.

    Args:
        timeout:          Cache TTL in seconds (default: 300).
        key_prefix:       String prefix for the cache key.
        vary_on_headers:  List of header names whose values differentiate
                          cache entries (e.g. ``["Accept-Language"]``).

    Example::

        @cache_view(timeout=120, key_prefix="user_profile")
        def get(self, request, pk):
            ...
    """

    def decorator(view_func: Callable[..., Any]) -> Callable[..., Any]:
        @functools.wraps(view_func)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            from django.core.cache import cache

            # args[0] is ``self`` for methods, args[1] is ``request`` for methods
            # or args[0] is ``request`` for function-based views.
            request = args[1] if len(args) > 1 else args[0]

            cache_key = _build_cache_key(key_prefix, request, vary_on_headers)

            cached_response = cache.get(cache_key)
            if cached_response is not None:
                logger.debug("Cache hit: %s", cache_key)
                return cached_response

            response = view_func(*args, **kwargs)

            # Only cache successful responses.
            if hasattr(response, "status_code") and response.status_code == 200:
                cache.set(cache_key, response, timeout)
                logger.debug("Cache set: %s (ttl=%ds)", cache_key, timeout)

            return response

        return wrapper

    return decorator


# ---------------------------------------------------------------------------
# invalidate_cache_pattern
# ---------------------------------------------------------------------------


def invalidate_cache_pattern(pattern: str) -> int:
    """Delete all cache keys matching a glob-style *pattern* (Redis only).

    Uses Redis ``SCAN`` to find matching keys without blocking the server,
    then deletes them in a single pipeline.

    Args:
        pattern: Redis key glob pattern, e.g. ``"view:products:*"``.

    Returns:
        Number of keys deleted.  Returns 0 and logs a warning when the
        configured cache backend is not Redis or the operation fails.
    """
    try:
        from django.core.cache import cache

        # django-redis exposes the underlying Redis client via .client.
        redis_client = getattr(cache, "client", None)
        if redis_client is None:
            logger.warning(
                "invalidate_cache_pattern requires a Redis cache backend; "
                "current backend does not expose a .client attribute. "
                "Pattern: %r",
                pattern,
            )
            return 0

        get_client = getattr(redis_client, "get_client", None)
        if get_client is None:
            logger.warning(
                "Cache client does not support get_client(); cannot invalidate pattern: %r",
                pattern,
            )
            return 0

        conn = get_client(write=True)
        keys = list(conn.scan_iter(match=pattern))
        if not keys:
            return 0

        pipe = conn.pipeline()
        for key in keys:
            pipe.delete(key)
        pipe.execute()

        logger.info("Invalidated %d cache keys matching pattern: %r", len(keys), pattern)
        return len(keys)

    except Exception:
        logger.exception("Failed to invalidate cache pattern: %r", pattern)
        return 0
