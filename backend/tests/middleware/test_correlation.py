"""
Tests for CorrelationMiddleware.

Verifies that the middleware generates, echoes, and propagates
correlation IDs correctly.
"""

from __future__ import annotations

import uuid

import pytest
from rest_framework.test import APIClient

pytestmark = pytest.mark.integration


@pytest.fixture
def client() -> APIClient:
    return APIClient()


@pytest.mark.django_db
class TestCorrelationMiddleware:
    """CorrelationMiddleware attaches X-Correlation-Id to responses."""

    def test_response_contains_correlation_id_header(self, client: APIClient) -> None:
        response = client.get("/health/")
        # Header may be capitalised differently depending on the test client.
        header_keys_lower = {k.lower() for k in response.headers}
        assert "x-correlation-id" in header_keys_lower

    def test_generates_correlation_id_when_absent(self, client: APIClient) -> None:
        response = client.get("/health/")
        correlation_id = response.headers.get(
            "X-Correlation-Id", response.headers.get("x-correlation-id", "")
        )
        assert correlation_id != ""
        # Should be a valid UUID.
        uuid.UUID(correlation_id)

    def test_echoes_correlation_id_from_request(self, client: APIClient) -> None:
        sent_id = str(uuid.uuid4())
        response = client.get("/health/", HTTP_X_CORRELATION_ID=sent_id)
        echoed = response.headers.get(
            "X-Correlation-Id", response.headers.get("x-correlation-id", "")
        )
        assert echoed == sent_id

    def test_generates_new_id_when_header_empty(self, client: APIClient) -> None:
        response = client.get("/health/", HTTP_X_CORRELATION_ID="")
        correlation_id = response.headers.get(
            "X-Correlation-Id", response.headers.get("x-correlation-id", "")
        )
        assert correlation_id != ""

    def test_response_contains_request_id_header(self, client: APIClient) -> None:
        response = client.get("/health/")
        header_keys_lower = {k.lower() for k in response.headers}
        assert "x-request-id" in header_keys_lower

    def test_echoes_request_id_from_request(self, client: APIClient) -> None:
        sent_id = str(uuid.uuid4())
        response = client.get("/health/", HTTP_X_REQUEST_ID=sent_id)
        echoed = response.headers.get(
            "X-Request-Id", response.headers.get("x-request-id", "")
        )
        assert echoed == sent_id
