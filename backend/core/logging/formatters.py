"""
JSON log formatter.

Produces a single-line JSON object per log record, ready for ingestion by
log-aggregation systems (ELK, Loki, CloudWatch, etc.).

Fields emitted
--------------
- ``timestamp``     — ISO 8601, UTC, microsecond precision
- ``level``         — e.g. ``INFO``, ``ERROR``
- ``logger``        — logger name
- ``message``       — rendered log message
- ``correlation_id``— from thread-local (empty string if outside request)
- ``request_id``    — from thread-local (empty string if outside request)
- ``module``        — Python module name
- ``funcName``      — function name
- ``lineno``        — line number
- ``exc_info``      — formatted traceback string (only if exception attached)
- ``<extra>``       — any additional fields passed via ``extra={...}``
"""

from __future__ import annotations

import json
import logging
import traceback
from datetime import datetime, timezone
from typing import Any

from core.middleware.correlation import get_correlation_id, get_request_id

__all__ = ["JsonFormatter"]

# Fields that are always present on a LogRecord and should NOT be re-emitted
# as "extra" fields (they are already mapped to specific output keys).
_RESERVED_ATTRS: frozenset[str] = frozenset(
    {
        "args",
        "created",
        "exc_info",
        "exc_text",
        "filename",
        "funcName",
        "levelname",
        "levelno",
        "lineno",
        "message",
        "module",
        "msecs",
        "msg",
        "name",
        "pathname",
        "process",
        "processName",
        "relativeCreated",
        "stack_info",
        "taskName",
        "thread",
        "threadName",
    }
)


class JsonFormatter(logging.Formatter):
    """Format log records as single-line JSON objects."""

    def format(self, record: logging.LogRecord) -> str:  # noqa: A003
        # Ensure ``record.message`` is populated.
        record.message = record.getMessage()

        payload: dict[str, Any] = {
            "timestamp": datetime.fromtimestamp(record.created, tz=timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.message,
            "correlation_id": get_correlation_id(),
            "request_id": get_request_id(),
            "module": record.module,
            "funcName": record.funcName,
            "lineno": record.lineno,
        }

        # Serialise exception traceback if present.
        if record.exc_info:
            payload["exc_info"] = self.formatException(record.exc_info)
        elif record.exc_text:
            payload["exc_info"] = record.exc_text

        # Forward any ``extra={...}`` fields the caller attached, but skip
        # reserved / already-mapped attributes.
        for key, value in record.__dict__.items():
            if key not in _RESERVED_ATTRS and key not in payload:
                payload[key] = value

        return json.dumps(payload, default=str, ensure_ascii=False)
