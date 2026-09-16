"""
Input validation helpers.

Provides reusable, framework-agnostic validation utilities.  Functions raise
``core.exceptions.base.ValidationError`` (our custom exception, not Django's
or DRF's) so that callers get a consistent error type regardless of context.
"""

from __future__ import annotations

import os
import re
import uuid
from typing import IO
from urllib.parse import urlparse

from core.exceptions.base import ValidationError

__all__ = [
    "is_safe_url",
    "sanitize_filename",
    "validate_file_upload",
    "validate_uuid",
]

# ---------------------------------------------------------------------------
# UUID validation
# ---------------------------------------------------------------------------

_UUID_RE: re.Pattern[str] = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$",
    re.IGNORECASE,
)


def validate_uuid(value: str) -> uuid.UUID:
    """Validate and return a ``uuid.UUID`` parsed from *value*.

    Args:
        value: String to validate.

    Returns:
        A ``uuid.UUID`` object.

    Raises:
        ValidationError: If *value* is not a valid UUID.
    """
    if not isinstance(value, str) or not _UUID_RE.match(value.strip()):
        raise ValidationError(
            message=f"'{value}' is not a valid UUID.",
            details=[{"field": "uuid", "error": "Invalid UUID format."}],
        )
    return uuid.UUID(value.strip())


# ---------------------------------------------------------------------------
# File upload validation
# ---------------------------------------------------------------------------


def validate_file_upload(
    file: IO[bytes],
    allowed_types: list[str],
    max_size: int,
) -> None:
    """Validate an uploaded file's content type and size.

    Args:
        file:          A file-like object with ``name``, ``size``, and
                       ``content_type`` attributes (e.g. Django's
                       ``InMemoryUploadedFile`` / ``TemporaryUploadedFile``).
        allowed_types: List of accepted MIME types, e.g.
                       ``["image/jpeg", "image/png"]``.
        max_size:      Maximum allowed file size in bytes.

    Raises:
        ValidationError: If the content type or size is unacceptable.
    """
    details: list[dict[str, str]] = []

    content_type: str = getattr(file, "content_type", "") or ""
    if content_type not in allowed_types:
        details.append(
            {
                "field": "file",
                "error": (
                    f"Unsupported file type '{content_type}'. "
                    f"Allowed: {', '.join(allowed_types)}."
                ),
            }
        )

    file_size: int = getattr(file, "size", 0) or 0
    if file_size > max_size:
        details.append(
            {
                "field": "file",
                "error": (
                    f"File size {file_size} bytes exceeds the maximum "
                    f"allowed size of {max_size} bytes."
                ),
            }
        )

    if details:
        raise ValidationError(
            message="File validation failed.",
            details=details,
        )


# ---------------------------------------------------------------------------
# Filename sanitisation
# ---------------------------------------------------------------------------

# Characters that are illegal or dangerous in filenames.
_UNSAFE_CHARS: re.Pattern[str] = re.compile(r"[^\w.\-]")


def sanitize_filename(filename: str) -> str:
    """Remove path-traversal components and illegal characters from *filename*.

    Args:
        filename: Raw filename supplied by the client.

    Returns:
        A safe basename with only word characters, dots, and hyphens.

    Examples:
        >>> sanitize_filename("../../etc/passwd")
        'passwd'
        >>> sanitize_filename("my file (1).txt")
        'my_file_1.txt'
    """
    # Strip directory components first.
    basename: str = os.path.basename(filename)
    # Replace any remaining unsafe chars with underscores.
    safe: str = _UNSAFE_CHARS.sub("_", basename)
    # Collapse multiple consecutive underscores to a single one.
    safe = re.sub(r"_+", "_", safe).strip("_")
    return safe or "upload"


# ---------------------------------------------------------------------------
# Safe-URL check (open-redirect guard)
# ---------------------------------------------------------------------------


def is_safe_url(url: str, allowed_hosts: set[str]) -> bool:
    """Return ``True`` if *url* is safe to redirect to.

    A URL is considered safe when:
    - It is relative (no scheme or netloc), **or**
    - Its netloc exactly matches one of *allowed_hosts*.

    This prevents open-redirect vulnerabilities where user-controlled input
    is passed directly to ``HttpResponseRedirect``.

    Args:
        url:           The URL to evaluate.
        allowed_hosts: Set of permitted host names (without port or scheme).

    Returns:
        ``True`` if safe, ``False`` otherwise.
    """
    if not url:
        return False

    parsed = urlparse(url)

    # Relative URLs (no scheme, no netloc) are always safe.
    if not parsed.scheme and not parsed.netloc:
        return True

    # Reject javascript:/data: / other non-HTTP schemes.
    if parsed.scheme and parsed.scheme.lower() not in {"http", "https"}:
        return False

    # Allow only explicitly trusted hosts.
    return parsed.netloc in allowed_hosts
