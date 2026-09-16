"""
DRF pagination classes.

``StandardResultsPagination``
    Page-number based pagination with a configurable page size.
    Clients can override the page size up to ``max_page_size`` by passing
    the ``page_size`` query parameter.

``CursorResultsPagination``
    Opaque-cursor based pagination ordered by ``-created_at``.
    More efficient than page-number pagination for large, frequently-updated
    datasets because it avoids OFFSET queries.
"""

from __future__ import annotations

from rest_framework.pagination import CursorPagination, PageNumberPagination
from rest_framework.response import Response

__all__ = ["CursorResultsPagination", "StandardResultsPagination"]


class StandardResultsPagination(PageNumberPagination):
    """Page-number pagination with a sensible default page size.

    Response shape::

        {
            "count":    <total items>,
            "next":     "<url or null>",
            "previous": "<url or null>",
            "results":  [...]
        }
    """

    page_size: int = 20
    page_size_query_param: str = "page_size"
    max_page_size: int = 100

    def get_paginated_response(self, data: list) -> Response:  # type: ignore[override]
        return Response(
            {
                "count": self.page.paginator.count,
                "next": self.get_next_link(),
                "previous": self.get_previous_link(),
                "results": data,
            }
        )

    def get_paginated_response_schema(self, schema: dict) -> dict:  # type: ignore[override]
        return {
            "type": "object",
            "properties": {
                "count": {"type": "integer", "example": 123},
                "next": {"type": "string", "nullable": True, "format": "uri"},
                "previous": {"type": "string", "nullable": True, "format": "uri"},
                "results": schema,
            },
        }


class CursorResultsPagination(CursorPagination):
    """Cursor-based pagination ordered by ``-created_at``.

    Suitable for infinite-scroll / real-time feeds where row counts change
    between requests.  The cursor is an opaque, URL-safe base64 string.

    Response shape (standard DRF cursor response)::

        {
            "next":     "<url or null>",
            "previous": "<url or null>",
            "results":  [...]
        }
    """

    page_size: int = 20
    ordering: str = "-created_at"
    page_size_query_param: str = "page_size"
    max_page_size: int = 100
