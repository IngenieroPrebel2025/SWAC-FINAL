"""
HTTP response helpers.

Provides factory functions that produce consistently-structured JSON
responses across the entire API surface.

All successful responses follow::

    {
        "success": true,
        "data":    <payload>,
        "message": "<optional human-readable note>",
        "meta":    { "correlation_id": "...", "request_id": "...", ...extra }
    }

All error responses follow::

    {
        "success": false,
        "error": {
            "code":    "ERROR_CODE",
            "message": "Human-readable message.",
            "details": []
        }
    }
"""

from __future__ import annotations

from typing import Any

from rest_framework import status as http_status
from rest_framework.pagination import BasePagination
from rest_framework.request import Request
from rest_framework.response import Response

from core.middleware.correlation import get_correlation_id, get_request_id

__all__ = ["error_response", "paginated_response", "success_response"]


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _base_meta() -> dict[str, str]:
    """Build the ``meta`` block populated from thread-local IDs."""
    return {
        "correlation_id": get_correlation_id(),
        "request_id": get_request_id(),
    }


# ---------------------------------------------------------------------------
# Public factories
# ---------------------------------------------------------------------------


def success_response(
    data: Any = None,
    status: int = http_status.HTTP_200_OK,
    message: str | None = None,
    meta: dict[str, Any] | None = None,
) -> Response:
    """Return a DRF ``Response`` with a success envelope.

    Args:
        data:    The payload to include under the ``"data"`` key.
        status:  HTTP status code (default: 200).
        message: Optional human-readable note (omitted from the body if
                 ``None``).
        meta:    Optional extra metadata merged with the default
                 ``correlation_id`` / ``request_id`` block.

    Returns:
        A ``rest_framework.response.Response`` instance.
    """
    combined_meta: dict[str, Any] = _base_meta()
    if meta:
        combined_meta.update(meta)

    body: dict[str, Any] = {
        "success": True,
        "data": data,
        "meta": combined_meta,
    }
    if message is not None:
        body["message"] = message

    return Response(body, status=status)


def error_response(
    code: str,
    message: str,
    details: list[Any] | None = None,
    status: int = http_status.HTTP_400_BAD_REQUEST,
) -> Response:
    """Return a DRF ``Response`` with an error envelope.

    Args:
        code:    Machine-readable error code, e.g. ``"VALIDATION_ERROR"``.
        message: Human-readable description of the error.
        details: Optional list of granular error detail objects.
        status:  HTTP status code (default: 400).

    Returns:
        A ``rest_framework.response.Response`` instance.
    """
    return Response(
        {
            "success": False,
            "error": {
                "code": code,
                "message": message,
                "details": details or [],
            },
        },
        status=status,
    )


def paginated_response(
    paginator: BasePagination,
    data: list[Any],
    request: Request,
) -> Response:
    """Wrap paginated results in the standard success envelope.

    Intended for use inside views that call ``paginator.paginate_queryset``
    manually.  The pagination links (``next`` / ``previous``) are retrieved
    from the paginator and merged into ``meta``.

    Args:
        paginator: A DRF paginator that has already been called with
                   ``paginate_queryset``.
        data:      The serialised (already paginated) result list.
        request:   The current DRF request, used to build absolute URLs.

    Returns:
        A ``Response`` with the success envelope including pagination links.
    """
    paginated = paginator.get_paginated_response(data)
    paginated_data = paginated.data  # type: ignore[attr-defined]

    # Extract link fields produced by the paginator, falling back gracefully.
    meta: dict[str, Any] = _base_meta()
    for link_key in ("next", "previous", "count"):
        if link_key in paginated_data:
            meta[link_key] = paginated_data[link_key]

    results = paginated_data.get("results", data)

    return Response(
        {
            "success": True,
            "data": results,
            "meta": meta,
        },
        status=http_status.HTTP_200_OK,
    )
