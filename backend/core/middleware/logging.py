"""
Request / response logging middleware.

Logs a structured entry for every inbound request and its corresponding
response.  Health-check endpoints are silenced to avoid log spam.
Sensitive query-string parameters are redacted before logging.
"""

from __future__ import annotations

import logging
import time
from collections.abc import Callable
from urllib.parse import urlencode, urlparse, parse_qs

from django.http import HttpRequest, HttpResponse

from core.middleware.correlation import get_correlation_id, get_request_id

__all__ = ["RequestLoggingMiddleware"]

logger = logging.getLogger("core.requests")

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

# Query-string parameter names whose values will be replaced with "***".
_SENSITIVE_PARAMS: frozenset[str] = frozenset(
    {"password", "token", "key", "secret", "api_key", "access_token", "auth"}
)

# URL path prefixes that should NOT be logged.
_SKIP_PREFIXES: tuple[str, ...] = ("/health",)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _sanitize_query_string(raw_qs: str) -> str:
    """Replace values of sensitive query-string parameters with ``***``."""
    if not raw_qs:
        return ""
    params: dict[str, list[str]] = parse_qs(raw_qs, keep_blank_values=True)
    sanitized: dict[str, list[str]] = {
        k: (["***"] * len(v) if k.lower() in _SENSITIVE_PARAMS else v)
        for k, v in params.items()
    }
    return urlencode(sanitized, doseq=True)


def _get_client_ip(request: HttpRequest) -> str:
    """Resolve the real client IP, honouring X-Forwarded-For."""
    forwarded_for: str | None = request.META.get("HTTP_X_FORWARDED_FOR")
    if forwarded_for:
        # The leftmost address is the originating client.
        return forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "")


def _should_skip(path: str) -> bool:
    """Return True for paths that should not be logged."""
    return any(path.startswith(prefix) for prefix in _SKIP_PREFIXES)


# ---------------------------------------------------------------------------
# Middleware
# ---------------------------------------------------------------------------


class RequestLoggingMiddleware:
    """Log every HTTP request and its response with structured metadata."""

    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]) -> None:
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        if _should_skip(request.path):
            return self.get_response(request)

        start_ns: int = time.perf_counter_ns()

        logger.info(
            "request started",
            extra={
                "event": "request_started",
                "method": request.method,
                "path": request.path,
                "query_string": _sanitize_query_string(request.META.get("QUERY_STRING", "")),
                "user_agent": request.META.get("HTTP_USER_AGENT", ""),
                "client_ip": _get_client_ip(request),
                "correlation_id": get_correlation_id(),
                "request_id": get_request_id(),
            },
        )

        response: HttpResponse = self.get_response(request)

        duration_ms: float = (time.perf_counter_ns() - start_ns) / 1_000_000

        logger.info(
            "request completed",
            extra={
                "event": "request_completed",
                "method": request.method,
                "path": request.path,
                "status_code": response.status_code,
                "duration_ms": round(duration_ms, 3),
                "correlation_id": get_correlation_id(),
                "request_id": get_request_id(),
            },
        )

        return response
