"""
Application exception hierarchy.

All custom exceptions extend ``AppException``.  Each subclass declares
sensible class-level defaults for ``status_code``, ``error_code``, and
``message``, which can be overridden on a per-instance basis via constructor
keyword arguments.

Usage
-----
::

    raise NotFoundError(message="Order 42 not found.", details=["order_id=42"])
    raise ValidationError(details=[{"field": "email", "error": "Invalid format"}])
"""

from __future__ import annotations

from typing import Any

__all__ = [
    "AppException",
    "AuthenticationError",
    "ConflictError",
    "NotFoundError",
    "PermissionDeniedError",
    "RateLimitError",
    "ServiceUnavailableError",
    "ValidationError",
]


class AppException(Exception):
    """Base application exception.

    Subclasses should override the class attributes to set appropriate
    defaults.  Instances may further override them via constructor kwargs.
    """

    status_code: int = 500
    error_code: str = "INTERNAL_ERROR"
    message: str = "An unexpected error occurred."
    details: list[Any] = []

    def __init__(
        self,
        message: str | None = None,
        details: list[Any] | None = None,
        error_code: str | None = None,
    ) -> None:
        self.message = message if message is not None else self.__class__.message
        self.details = details if details is not None else list(self.__class__.details)
        self.error_code = error_code if error_code is not None else self.__class__.error_code
        super().__init__(self.message)

    def __repr__(self) -> str:  # pragma: no cover
        return (
            f"{self.__class__.__name__}("
            f"status_code={self.status_code}, "
            f"error_code={self.error_code!r}, "
            f"message={self.message!r})"
        )


# ---------------------------------------------------------------------------
# 400 — Bad Request / Validation
# ---------------------------------------------------------------------------


class ValidationError(AppException):
    """Raised when incoming data fails validation."""

    status_code = 400
    error_code = "VALIDATION_ERROR"
    message = "Validation failed."


# ---------------------------------------------------------------------------
# 401 — Authentication Required
# ---------------------------------------------------------------------------


class AuthenticationError(AppException):
    """Raised when the request is missing or has invalid credentials."""

    status_code = 401
    error_code = "AUTHENTICATION_REQUIRED"
    message = "Authentication is required."


# ---------------------------------------------------------------------------
# 403 — Permission Denied
# ---------------------------------------------------------------------------


class PermissionDeniedError(AppException):
    """Raised when an authenticated user lacks the required permission."""

    status_code = 403
    error_code = "PERMISSION_DENIED"
    message = "You do not have permission to perform this action."


# ---------------------------------------------------------------------------
# 404 — Not Found
# ---------------------------------------------------------------------------


class NotFoundError(AppException):
    """Raised when a requested resource does not exist."""

    status_code = 404
    error_code = "RESOURCE_NOT_FOUND"
    message = "Resource not found."


# ---------------------------------------------------------------------------
# 409 — Conflict
# ---------------------------------------------------------------------------


class ConflictError(AppException):
    """Raised when a request conflicts with the current state of the server."""

    status_code = 409
    error_code = "CONFLICT"
    message = "A conflict occurred."


# ---------------------------------------------------------------------------
# 429 — Rate Limit Exceeded
# ---------------------------------------------------------------------------


class RateLimitError(AppException):
    """Raised when a client exceeds the allowed request rate."""

    status_code = 429
    error_code = "RATE_LIMIT_EXCEEDED"
    message = "Rate limit exceeded. Please try again later."


# ---------------------------------------------------------------------------
# 503 — Service Unavailable
# ---------------------------------------------------------------------------


class ServiceUnavailableError(AppException):
    """Raised when a downstream dependency is temporarily unavailable."""

    status_code = 503
    error_code = "SERVICE_UNAVAILABLE"
    message = "Service temporarily unavailable."
