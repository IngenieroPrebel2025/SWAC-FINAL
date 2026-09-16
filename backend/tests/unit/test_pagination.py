"""
Unit tests for DRF pagination classes.

Verifies configuration of StandardResultsPagination and CursorResultsPagination.
"""

from __future__ import annotations

import pytest

pytestmark = pytest.mark.unit


class TestStandardResultsPagination:
    """StandardResultsPagination configuration."""

    def test_default_page_size(self) -> None:
        from core.utils.pagination import StandardResultsPagination

        assert StandardResultsPagination.page_size == 20

    def test_max_page_size(self) -> None:
        from core.utils.pagination import StandardResultsPagination

        assert StandardResultsPagination.max_page_size == 100

    def test_page_size_query_param(self) -> None:
        from core.utils.pagination import StandardResultsPagination

        assert StandardResultsPagination.page_size_query_param == "page_size"

    def test_inherits_page_number_pagination(self) -> None:
        from rest_framework.pagination import PageNumberPagination

        from core.utils.pagination import StandardResultsPagination

        assert issubclass(StandardResultsPagination, PageNumberPagination)

    def test_get_paginated_response_schema_structure(self) -> None:
        from core.utils.pagination import StandardResultsPagination

        paginator = StandardResultsPagination()
        schema = paginator.get_paginated_response_schema({"type": "array"})

        assert schema["type"] == "object"
        props = schema["properties"]
        assert "count" in props
        assert "next" in props
        assert "previous" in props
        assert "results" in props

    def test_get_paginated_response_schema_count_is_integer(self) -> None:
        from core.utils.pagination import StandardResultsPagination

        paginator = StandardResultsPagination()
        schema = paginator.get_paginated_response_schema({})
        assert schema["properties"]["count"]["type"] == "integer"


class TestCursorResultsPagination:
    """CursorResultsPagination configuration."""

    def test_default_page_size(self) -> None:
        from core.utils.pagination import CursorResultsPagination

        assert CursorResultsPagination.page_size == 20

    def test_ordering(self) -> None:
        from core.utils.pagination import CursorResultsPagination

        assert CursorResultsPagination.ordering == "-created_at"

    def test_max_page_size(self) -> None:
        from core.utils.pagination import CursorResultsPagination

        assert CursorResultsPagination.max_page_size == 100

    def test_page_size_query_param(self) -> None:
        from core.utils.pagination import CursorResultsPagination

        assert CursorResultsPagination.page_size_query_param == "page_size"

    def test_inherits_cursor_pagination(self) -> None:
        from rest_framework.pagination import CursorPagination

        from core.utils.pagination import CursorResultsPagination

        assert issubclass(CursorResultsPagination, CursorPagination)
