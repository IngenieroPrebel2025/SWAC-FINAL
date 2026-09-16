"""
Tests for SecurityMiddleware.

Verifies that security headers are injected on every response.
"""

from __future__ import annotations

import pytest
from rest_framework.test import APIClient

pytestmark = pytest.mark.integration


@pytest.fixture
def client() -> APIClient:
    return APIClient()


@pytest.mark.django_db
class TestSecurityMiddlewareHeaders:
    """SecurityMiddleware injects hardened HTTP headers."""

    def test_x_content_type_options_header_present(self, client: APIClient) -> None:
        response = client.get("/health/")
        assert "X-Content-Type-Options" in response or (
            response.headers.get("X-Content-Type-Options") is not None
            or response.get("X-Content-Type-Options") is not None
        )

    def test_x_content_type_options_value(self, client: APIClient) -> None:
        response = client.get("/health/")
        value = response.get("X-Content-Type-Options", "")
        assert value == "nosniff"

    def test_x_frame_options_header_present(self, client: APIClient) -> None:
        response = client.get("/health/")
        value = response.get("X-Frame-Options", "")
        assert value != ""

    def test_x_frame_options_value(self, client: APIClient) -> None:
        response = client.get("/health/")
        value = response.get("X-Frame-Options", "")
        assert value in ("DENY", "SAMEORIGIN")

    def test_referrer_policy_header_present(self, client: APIClient) -> None:
        response = client.get("/health/")
        value = response.get("Referrer-Policy", "")
        assert value != ""

    def test_referrer_policy_value(self, client: APIClient) -> None:
        response = client.get("/health/")
        value = response.get("Referrer-Policy", "")
        assert value == "strict-origin-when-cross-origin"

    def test_permissions_policy_header_present(self, client: APIClient) -> None:
        response = client.get("/health/")
        value = response.get("Permissions-Policy", "")
        assert value != ""

    def test_api_response_has_no_store_cache_control(self, client: APIClient) -> None:
        response = client.get("/api/v1/")
        cache_control = response.get("Cache-Control", "")
        # API responses should carry no-store.
        if response.status_code < 500:
            assert "no-store" in cache_control
