"""
Unit tests for input validation helpers in core.security.validators.
"""

from __future__ import annotations

import uuid

import pytest

pytestmark = pytest.mark.unit


class TestValidateUuid:
    """validate_uuid() accepts valid UUIDs and rejects invalid ones."""

    def test_valid_uuid_returns_uuid_object(self) -> None:
        from core.security.validators import validate_uuid

        valid = str(uuid.uuid4())
        result = validate_uuid(valid)
        assert isinstance(result, uuid.UUID)
        assert str(result) == valid

    def test_valid_uuid_uppercase_accepted(self) -> None:
        from core.security.validators import validate_uuid

        valid = str(uuid.uuid4()).upper()
        result = validate_uuid(valid)
        assert isinstance(result, uuid.UUID)

    def test_valid_uuid_with_whitespace_accepted(self) -> None:
        from core.security.validators import validate_uuid

        valid = "  " + str(uuid.uuid4()) + "  "
        result = validate_uuid(valid)
        assert isinstance(result, uuid.UUID)

    def test_invalid_uuid_raises_validation_error(self) -> None:
        from core.exceptions.base import ValidationError
        from core.security.validators import validate_uuid

        with pytest.raises(ValidationError):
            validate_uuid("not-a-uuid")

    def test_empty_string_raises_validation_error(self) -> None:
        from core.exceptions.base import ValidationError
        from core.security.validators import validate_uuid

        with pytest.raises(ValidationError):
            validate_uuid("")

    def test_integer_raises_validation_error(self) -> None:
        from core.exceptions.base import ValidationError
        from core.security.validators import validate_uuid

        with pytest.raises(ValidationError):
            validate_uuid(12345)  # type: ignore[arg-type]

    def test_none_raises_validation_error(self) -> None:
        from core.exceptions.base import ValidationError
        from core.security.validators import validate_uuid

        with pytest.raises(ValidationError):
            validate_uuid(None)  # type: ignore[arg-type]

    def test_error_contains_field_details(self) -> None:
        from core.exceptions.base import ValidationError
        from core.security.validators import validate_uuid

        with pytest.raises(ValidationError) as exc_info:
            validate_uuid("bad-value")

        assert exc_info.value.details


class TestSanitizeFilename:
    """sanitize_filename() strips path traversal and dangerous characters."""

    def test_simple_filename_unchanged(self) -> None:
        from core.security.validators import sanitize_filename

        result = sanitize_filename("report.pdf")
        assert result == "report.pdf"

    def test_path_traversal_stripped(self) -> None:
        from core.security.validators import sanitize_filename

        result = sanitize_filename("../../etc/passwd")
        assert result == "passwd"
        assert ".." not in result
        assert "/" not in result

    def test_windows_path_traversal_stripped(self) -> None:
        from core.security.validators import sanitize_filename

        result = sanitize_filename(r"..\..\..\windows\system32\cmd.exe")
        # basename of a windows path
        assert ".." not in result

    def test_spaces_replaced_with_underscores(self) -> None:
        from core.security.validators import sanitize_filename

        result = sanitize_filename("my file (1).txt")
        assert " " not in result
        assert result.endswith(".txt")

    def test_empty_filename_returns_upload(self) -> None:
        from core.security.validators import sanitize_filename

        result = sanitize_filename("")
        assert result == "upload"

    def test_only_unsafe_chars_returns_upload(self) -> None:
        from core.security.validators import sanitize_filename

        result = sanitize_filename("!@#$%^&*()")
        assert result == "upload"

    def test_result_contains_only_safe_chars(self) -> None:
        import re

        from core.security.validators import sanitize_filename

        result = sanitize_filename("hello world!@#.txt")
        assert re.match(r"^[\w.\-]+$", result)


class TestIsSafeUrl:
    """is_safe_url() guards against open-redirect vulnerabilities."""

    def test_relative_url_is_safe(self) -> None:
        from core.security.validators import is_safe_url

        assert is_safe_url("/dashboard/", allowed_hosts=set()) is True

    def test_relative_url_no_host_is_safe(self) -> None:
        from core.security.validators import is_safe_url

        assert is_safe_url("/?next=/home", allowed_hosts=set()) is True

    def test_allowed_host_absolute_url_is_safe(self) -> None:
        from core.security.validators import is_safe_url

        assert is_safe_url(
            "https://app.example.com/dashboard",
            allowed_hosts={"app.example.com"},
        ) is True

    def test_disallowed_host_absolute_url_is_unsafe(self) -> None:
        from core.security.validators import is_safe_url

        assert is_safe_url(
            "https://evil.com/steal",
            allowed_hosts={"app.example.com"},
        ) is False

    def test_javascript_scheme_is_unsafe(self) -> None:
        from core.security.validators import is_safe_url

        assert is_safe_url(
            "javascript:alert('xss')",
            allowed_hosts={"app.example.com"},
        ) is False

    def test_data_scheme_is_unsafe(self) -> None:
        from core.security.validators import is_safe_url

        assert is_safe_url("data:text/html,<h1>xss</h1>", allowed_hosts=set()) is False

    def test_empty_string_is_unsafe(self) -> None:
        from core.security.validators import is_safe_url

        assert is_safe_url("", allowed_hosts=set()) is False

    def test_http_allowed_host_is_safe(self) -> None:
        from core.security.validators import is_safe_url

        assert is_safe_url(
            "http://localhost:8000/api/",
            allowed_hosts={"localhost:8000"},
        ) is True
