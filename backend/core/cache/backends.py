"""
Cache abstraction layer.

Thin wrappers around ``django.core.cache`` that provide:

- A consistent key-generation helper (``get_cache_key``).
- Type-annotated convenience functions for get / set / delete.
- A ``cache_get_or_set`` helper that accepts a plain callable as the value
  factory (the built-in ``cache.get_or_set`` also accepts callables, but this
  version is explicitly typed and adds a prefix shortcut).

All functions delegate to Django's ``default`` cache backend, which is
configured via ``CACHES`` in ``settings.py``.  Swap the backend (Redis,
Memcached, local-memory, etc.) without changing application code.
"""

from __future__ import annotations

import hashlib
from collections.abc import Callable
from typing import Any, TypeVar

from django.core.cache import cache

__all__ = [
    "cache_delete",
    "cache_get",
    "cache_get_or_set",
    "cache_set",
    "get_cache_key",
]

_T = TypeVar("_T")

# ---------------------------------------------------------------------------
# Key generation
# ---------------------------------------------------------------------------


def get_cache_key(*args: Any, prefix: str = "") -> str:
    """Generate a safe, consistent cache key from arbitrary arguments.

    The function stringifies every positional argument, joins them with
    ``:``, optionally prepends *prefix*, then SHA-256-hashes the result so
    that the final key is always within cache-backend length limits and free
    of illegal characters.

    Args:
        *args:  Arbitrary values that identify the cached resource, e.g.
                ``("user", user_id, "profile")``.
        prefix: Optional namespace string prepended before hashing, e.g.
                ``"orders"``.

    Returns:
        A 64-character hexadecimal string.

    Examples:
        >>> get_cache_key("user", 42, "profile")
        'a3f8...'
        >>> get_cache_key("product", 7, prefix="shop")
        'b1c2...'
    """
    raw_parts = [str(a) for a in args]
    if prefix:
        raw_parts.insert(0, prefix)
    raw = ":".join(raw_parts)
    return hashlib.sha256(raw.encode()).hexdigest()


# ---------------------------------------------------------------------------
# get / set / delete
# ---------------------------------------------------------------------------


def cache_get(key: str, default: Any = None) -> Any:
    """Retrieve a value from the cache.

    Args:
        key:     Cache key (typically produced by ``get_cache_key``).
        default: Value to return when the key is absent (default: ``None``).

    Returns:
        The cached value, or *default* if the key is not found.
    """
    return cache.get(key, default)


def cache_set(key: str, value: Any, timeout: int = 300) -> None:
    """Store a value in the cache.

    Args:
        key:     Cache key.
        value:   Value to store (must be picklable for most backends).
        timeout: TTL in seconds (default: 300 / 5 minutes).
                 Pass ``None`` to store indefinitely (backend-dependent).
    """
    cache.set(key, value, timeout)


def cache_delete(key: str) -> None:
    """Delete a key from the cache.

    This is a no-op if the key does not exist.

    Args:
        key: Cache key to remove.
    """
    cache.delete(key)


# ---------------------------------------------------------------------------
# get-or-set
# ---------------------------------------------------------------------------


def cache_get_or_set(
    key: str,
    callable: Callable[[], _T],  # noqa: A002  — shadows built-in deliberately
    timeout: int = 300,
) -> _T:
    """Return the cached value for *key*, computing it on cache miss.

    On a cache miss the result of calling *callable* (with no arguments) is
    stored under *key* with the given *timeout* and then returned.

    Args:
        key:      Cache key.
        callable: Zero-argument factory that produces the value to cache.
        timeout:  TTL in seconds (default: 300 / 5 minutes).

    Returns:
        The cached or freshly-computed value.

    Example::

        def fetch_summary() -> dict:
            return SomeModel.objects.aggregate(total=Count("id"))

        summary = cache_get_or_set(
            get_cache_key("summary", "all"),
            fetch_summary,
            timeout=60,
        )
    """
    cached = cache.get(key)
    if cached is not None:
        return cached  # type: ignore[return-value]
    value: _T = callable()
    cache.set(key, value, timeout)
    return value
