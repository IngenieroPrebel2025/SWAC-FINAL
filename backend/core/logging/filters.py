"""
Log filter classes.

CorrelationIdFilter
    Injects ``correlation_id`` and ``request_id`` attributes into every
    ``LogRecord`` so that formatters that cannot import the middleware layer
    (e.g. third-party formatters) can still include these fields.

SensitiveDataFilter
    Scans the rendered log message for known sensitive field names and
    replaces their values with ``***``.  This acts as a last-resort safety
    net — the primary defence should be to never log sensitive data in the
    first place.
"""

from __future__ import annotations

import logging
import re
from typing import ClassVar

from core.middleware.correlation import get_correlation_id, get_request_id

__all__ = ["CorrelationIdFilter", "SensitiveDataFilter"]

# ---------------------------------------------------------------------------
# CorrelationIdFilter
# ---------------------------------------------------------------------------


class CorrelationIdFilter(logging.Filter):
    """Add correlation_id and request_id to every LogRecord."""

    def filter(self, record: logging.LogRecord) -> bool:  # noqa: A003
        record.correlation_id = get_correlation_id()
        record.request_id = get_request_id()
        return True


# ---------------------------------------------------------------------------
# SensitiveDataFilter
# ---------------------------------------------------------------------------


class SensitiveDataFilter(logging.Filter):
    """Redact sensitive field values from log messages.

    Matches patterns like::

        password=secret123
        "token": "abc"
        Authorization: Bearer xyz
        key=abc&other=val
    """

    # Field names considered sensitive (case-insensitive).
    _SENSITIVE_KEYS: ClassVar[tuple[str, ...]] = (
        "password",
        "token",
        "secret",
        "key",
        "authorization",
        "api_key",
        "access_token",
        "auth",
    )

    # Build a single compiled regex that covers common serialisation formats.
    _PATTERN: ClassVar[re.Pattern[str]] = re.compile(
        r"(?i)"
        r"(?P<key>(?:" + "|".join(_SENSITIVE_KEYS) + r"))"
        r"(?P<sep>\s*[:=]\s*)"
        r"(?P<quote>[\"']?)"
        r"(?P<value>[^\s,&\"'\}\]]+)"
        r"(?P=quote)",
    )

    _REPLACEMENT: ClassVar[str] = r"\g<key>\g<sep>\g<quote>***\g<quote>"

    def filter(self, record: logging.LogRecord) -> bool:  # noqa: A003
        record.msg = self._PATTERN.sub(self._REPLACEMENT, str(record.msg))
        if record.args:
            if isinstance(record.args, dict):
                record.args = {
                    k: self._PATTERN.sub(self._REPLACEMENT, str(v))
                    for k, v in record.args.items()
                }
            elif isinstance(record.args, (list, tuple)):
                record.args = type(record.args)(
                    self._PATTERN.sub(self._REPLACEMENT, str(a))
                    for a in record.args
                )
        return True
