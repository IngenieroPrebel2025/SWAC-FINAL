"""
Correlation ID middleware.

Reads (or generates) X-Correlation-ID and X-Request-ID from incoming request
headers and makes them available both on the request object and as
thread-local globals so that any code running in the same thread (e.g. log
formatters) can access them without explicit parameter threading.
"""

from __future__ import annotations

import threading
import uuid
from collections.abc import Callable
from typing import Any

from django.http import HttpRequest, HttpResponse

__all__ = [
    "CorrelationMiddleware",
    "get_correlation_id",
    "get_request_id",
]

_local: threading.local = threading.local()

# ---------------------------------------------------------------------------
# Public accessors
# ---------------------------------------------------------------------------


def get_correlation_id() -> str:
    """Return the correlation ID stored in thread-local storage.

    Returns an empty string when called outside a request context.
    """
    return getattr(_local, "correlation_id", "")


def get_request_id() -> str:
    """Return the request ID stored in thread-local storage.

    Returns an empty string when called outside a request context.
    """
    return getattr(_local, "request_id", "")


# ---------------------------------------------------------------------------
# Middleware
# ---------------------------------------------------------------------------


class CorrelationMiddleware:
    """Attach Correlation-ID and Request-ID to every request/response.

    Processing order:
    1. Read ``X-Correlation-ID`` from the incoming header; generate a UUID4
       if the header is absent or empty.
    2. Read ``X-Request-ID`` from the incoming header; generate a UUID4
       if the header is absent or empty.
    3. Store both values on the request object (``request.correlation_id``
       and ``request.request_id``) and in thread-local storage.
    4. Forward the request to the next middleware / view.
    5. Echo both IDs back in the response headers before returning.
    """

    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]) -> None:
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        correlation_id: str = (
            request.headers.get("X-Correlation-Id") or str(uuid.uuid4())
        )
        request_id: str = (
            request.headers.get("X-Request-Id") or str(uuid.uuid4())
        )

        # Attach to request object for view-layer access.
        request.correlation_id = correlation_id  # type: ignore[attr-defined]
        request.request_id = request_id  # type: ignore[attr-defined]

        # Publish to thread-local storage so log formatters can read them.
        _local.correlation_id = correlation_id
        _local.request_id = request_id

        try:
            response: HttpResponse = self.get_response(request)
        finally:
            # Always clean up — avoids leaking IDs into subsequent requests
            # when threads are reused by the WSGI/ASGI server.
            _local.correlation_id = ""
            _local.request_id = ""

        response["X-Correlation-Id"] = correlation_id
        response["X-Request-Id"] = request_id
        return response
