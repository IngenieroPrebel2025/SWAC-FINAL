"""
Unit tests for the application exception hierarchy.

Verifies that each AppException subclass carries the correct status_code,
error_code, and message, and that instances can be raised and caught.
"""

from __future__ import annotations

import pytest

pytestmark = pytest.mark.unit


class TestAppException:
    """Base AppException behaviour."""

    def test_default_status_code(self) -> None:
        from core.exceptions.base import AppException

        exc = AppException()
        assert exc.status_code == 500

    def test_default_error_code(self) -> None:
        from core.exceptions.base import AppException

        exc = AppException()
        assert exc.error_code == "INTERNAL_ERROR"

    def test_default_message(self) -> None:
        from core.exceptions.base import AppException

        exc = AppException()
        assert exc.message == "An unexpected error occurred."

    def test_custom_message_overrides_class_default(self) -> None:
        from core.exceptions.base import AppException

        exc = AppException(message="Custom message.")
        assert exc.message == "Custom message."

    def test_custom_details_overrides_class_default(self) -> None:
        from core.exceptions.base import AppException

        details = [{"field": "x", "error": "bad"}]
        exc = AppException(details=details)
        assert exc.details == details

    def test_custom_error_code_overrides_class_default(self) -> None:
        from core.exceptions.base import AppException

        exc = AppException(error_code="MY_CODE")
        assert exc.error_code == "MY_CODE"

    def test_is_exception_subclass(self) -> None:
        from core.exceptions.base import AppException

        assert issubclass(AppException, Exception)

    def test_can_be_raised_and_caught(self) -> None:
        from core.exceptions.base import AppException

        with pytest.raises(AppException):
            raise AppException()

    def test_str_representation(self) -> None:
        from core.exceptions.base import AppException

        exc = AppException(message="msg")
        assert str(exc) == "msg"


class TestValidationError:
    """400 ValidationError."""

    def test_status_code(self) -> None:
        from core.exceptions.base import ValidationError

        assert ValidationError.status_code == 400

    def test_error_code(self) -> None:
        from core.exceptions.base import ValidationError

        assert ValidationError.error_code == "VALIDATION_ERROR"

    def test_message(self) -> None:
        from core.exceptions.base import ValidationError

        assert "validation" in ValidationError.message.lower()

    def test_can_be_raised(self) -> None:
        from core.exceptions.base import AppException, ValidationError

        with pytest.raises(AppException):
            raise ValidationError()

    def test_accepts_details(self) -> None:
        from core.exceptions.base import ValidationError

        details = [{"field": "email", "error": "Invalid."}]
        exc = ValidationError(details=details)
        assert exc.details == details


class TestAuthenticationError:
    """401 AuthenticationError."""

    def test_status_code(self) -> None:
        from core.exceptions.base import AuthenticationError

        assert AuthenticationError.status_code == 401

    def test_error_code(self) -> None:
        from core.exceptions.base import AuthenticationError

        assert AuthenticationError.error_code == "AUTHENTICATION_REQUIRED"

    def test_can_be_raised(self) -> None:
        from core.exceptions.base import AuthenticationError

        with pytest.raises(AuthenticationError):
            raise AuthenticationError()


class TestPermissionDeniedError:
    """403 PermissionDeniedError."""

    def test_status_code(self) -> None:
        from core.exceptions.base import PermissionDeniedError

        assert PermissionDeniedError.status_code == 403

    def test_error_code(self) -> None:
        from core.exceptions.base import PermissionDeniedError

        assert PermissionDeniedError.error_code == "PERMISSION_DENIED"

    def test_can_be_raised(self) -> None:
        from core.exceptions.base import PermissionDeniedError

        with pytest.raises(PermissionDeniedError):
            raise PermissionDeniedError()


class TestNotFoundError:
    """404 NotFoundError."""

    def test_status_code(self) -> None:
        from core.exceptions.base import NotFoundError

        assert NotFoundError.status_code == 404

    def test_error_code(self) -> None:
        from core.exceptions.base import NotFoundError

        assert NotFoundError.error_code == "RESOURCE_NOT_FOUND"

    def test_can_be_raised(self) -> None:
        from core.exceptions.base import NotFoundError

        with pytest.raises(NotFoundError):
            raise NotFoundError()

    def test_custom_message(self) -> None:
        from core.exceptions.base import NotFoundError

        exc = NotFoundError(message="Order 42 not found.")
        assert exc.message == "Order 42 not found."


class TestConflictError:
    """409 ConflictError."""

    def test_status_code(self) -> None:
        from core.exceptions.base import ConflictError

        assert ConflictError.status_code == 409

    def test_error_code(self) -> None:
        from core.exceptions.base import ConflictError

        assert ConflictError.error_code == "CONFLICT"

    def test_can_be_raised(self) -> None:
        from core.exceptions.base import ConflictError

        with pytest.raises(ConflictError):
            raise ConflictError()


class TestRateLimitError:
    """429 RateLimitError."""

    def test_status_code(self) -> None:
        from core.exceptions.base import RateLimitError

        assert RateLimitError.status_code == 429

    def test_error_code(self) -> None:
        from core.exceptions.base import RateLimitError

        assert RateLimitError.error_code == "RATE_LIMIT_EXCEEDED"

    def test_can_be_raised(self) -> None:
        from core.exceptions.base import RateLimitError

        with pytest.raises(RateLimitError):
            raise RateLimitError()


class TestServiceUnavailableError:
    """503 ServiceUnavailableError."""

    def test_status_code(self) -> None:
        from core.exceptions.base import ServiceUnavailableError

        assert ServiceUnavailableError.status_code == 503

    def test_error_code(self) -> None:
        from core.exceptions.base import ServiceUnavailableError

        assert ServiceUnavailableError.error_code == "SERVICE_UNAVAILABLE"

    def test_can_be_raised(self) -> None:
        from core.exceptions.base import ServiceUnavailableError

        with pytest.raises(ServiceUnavailableError):
            raise ServiceUnavailableError()
