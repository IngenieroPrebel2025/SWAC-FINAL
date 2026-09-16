"""
DRF custom exception handler.

Produces a consistent JSON envelope for every error response:

.. code-block:: json

    {
        "success": false,
        "error": {
            "code": "ERROR_CODE",
            "message": "Human-readable message.",
            "details": []
        },
        "meta": {
            "correlation_id": "uuid-or-empty-string",
            "request_id":     "uuid-or-empty-string"
        }
    }

Register in ``settings.py``::

    REST_FRAMEWORK = {
        "EXCEPTION_HANDLER": "core.exceptions.handlers.custom_exception_handler",
    }
"""

from __future__ import annotations

import logging
import traceback
from typing import Any

from django.core.exceptions import PermissionDenied as DjangoPermissionDenied
from django.http import Http404
from rest_framework import status
from rest_framework.exceptions import (
    AuthenticationFailed,
    MethodNotAllowed,
    NotAuthenticated,
    NotFound,
    PermissionDenied as DRFPermissionDenied,
    Throttled,
    ValidationError as DRFValidationError,
)
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_default_handler

from core.exceptions.base import AppException
from core.middleware.correlation import get_correlation_id, get_request_id

__all__ = ["custom_exception_handler"]

logger = logging.getLogger("core.exceptions")

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _meta() -> dict[str, str]:
    return {
        "correlation_id": get_correlation_id(),
        "request_id": get_request_id(),
    }


def _error_body(
    code: str,
    message: str,
    details: list[Any] | None = None,
) -> dict[str, Any]:
    return {
        "success": False,
        "error": {
            "code": code,
            "message": message,
            "details": details or [],
        },
        "meta": _meta(),
    }


def _make_response(
    code: str,
    message: str,
    http_status: int,
    details: list[Any] | None = None,
) -> Response:
    return Response(_error_body(code, message, details), status=http_status)


# ---------------------------------------------------------------------------
# DRF validation-error detail normalisation
# ---------------------------------------------------------------------------


def _normalise_drf_detail(detail: Any) -> list[Any]:
    """Flatten DRF's nested ErrorDetail structures into a plain list."""
    if isinstance(detail, list):
        return [str(d) for d in detail]
    if isinstance(detail, dict):
        out: list[dict[str, Any]] = []
        for field, errors in detail.items():
            if isinstance(errors, list):
                out.append({"field": field, "errors": [str(e) for e in errors]})
            else:
                out.append({"field": field, "errors": [str(errors)]})
        return out
    return [str(detail)]


# ---------------------------------------------------------------------------
# Main handler
# ---------------------------------------------------------------------------


def custom_exception_handler(
    exc: Exception,
    context: dict[str, Any],
) -> Response | None:
    """Custom DRF exception handler — returns a unified error envelope.

    Falls back to DRF's built-in handler first so that DRF's own
    exception-to-response machinery still runs (e.g. WWW-Authenticate
    headers for 401s).
    """
    request: Request | None = context.get("request")

    # ------------------------------------------------------------------ #
    # 1. DRF native exceptions
    # ------------------------------------------------------------------ #
    if isinstance(exc, DRFValidationError):
        details = _normalise_drf_detail(exc.detail)
        return _make_response(
            "VALIDATION_ERROR",
            "Validation failed.",
            status.HTTP_400_BAD_REQUEST,
            details,
        )

    if isinstance(exc, (NotAuthenticated, AuthenticationFailed)):
        return _make_response(
            "AUTHENTICATION_REQUIRED",
            str(exc.detail) if hasattr(exc, "detail") else "Authentication is required.",
            status.HTTP_401_UNAUTHORIZED,
        )

    if isinstance(exc, DRFPermissionDenied):
        return _make_response(
            "PERMISSION_DENIED",
            str(exc.detail) if hasattr(exc, "detail") else "Permission denied.",
            status.HTTP_403_FORBIDDEN,
        )

    if isinstance(exc, NotFound):
        return _make_response(
            "RESOURCE_NOT_FOUND",
            str(exc.detail) if hasattr(exc, "detail") else "Resource not found.",
            status.HTTP_404_NOT_FOUND,
        )

    if isinstance(exc, MethodNotAllowed):
        return _make_response(
            "METHOD_NOT_ALLOWED",
            str(exc.detail) if hasattr(exc, "detail") else "Method not allowed.",
            status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    if isinstance(exc, Throttled):
        return _make_response(
            "RATE_LIMIT_EXCEEDED",
            "Rate limit exceeded. Please try again later.",
            status.HTTP_429_TOO_MANY_REQUESTS,
        )

    # ------------------------------------------------------------------ #
    # 2. Django built-ins
    # ------------------------------------------------------------------ #
    if isinstance(exc, Http404):
        return _make_response(
            "RESOURCE_NOT_FOUND",
            "Resource not found.",
            status.HTTP_404_NOT_FOUND,
        )

    if isinstance(exc, DjangoPermissionDenied):
        return _make_response(
            "PERMISSION_DENIED",
            "You do not have permission to perform this action.",
            status.HTTP_403_FORBIDDEN,
        )

    # ------------------------------------------------------------------ #
    # 3. Custom AppException subclasses
    # ------------------------------------------------------------------ #
    if isinstance(exc, AppException):
        if exc.status_code >= 500:
            logger.error(
                "AppException %s raised",
                exc.error_code,
                exc_info=exc,
                extra={
                    "error_code": exc.error_code,
                    "status_code": exc.status_code,
                    "correlation_id": get_correlation_id(),
                    "request_id": get_request_id(),
                },
            )
        return _make_response(
            exc.error_code,
            exc.message,
            exc.status_code,
            exc.details,
        )

    # ------------------------------------------------------------------ #
    # 4. Unhandled exceptions → 500
    # ------------------------------------------------------------------ #
    logger.error(
        "Unhandled exception: %s",
        type(exc).__name__,
        exc_info=True,
        extra={
            "correlation_id": get_correlation_id(),
            "request_id": get_request_id(),
            "traceback": traceback.format_exc(),
        },
    )
    return _make_response(
        "INTERNAL_ERROR",
        "An unexpected error occurred.",
        status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
