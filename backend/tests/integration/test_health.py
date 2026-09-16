"""
Integration tests for health-check endpoints.

Tests exercise the full Django request/response cycle including middleware.
"""

from __future__ import annotations

import pytest
from rest_framework.test import APIClient

pytestmark = pytest.mark.integration


@pytest.fixture
def client() -> APIClient:
    return APIClient()


@pytest.mark.django_db
class TestHealthEndpoint:
    """GET /health/ — general health check."""

    def test_returns_200(self, client: APIClient) -> None:
        response = client.get("/health/")
        assert response.status_code == 200

    def test_response_is_json(self, client: APIClient) -> None:
        response = client.get("/health/")
        assert response.accepted_media_type == "application/json"

    def test_response_has_status_field(self, client: APIClient) -> None:
        response = client.get("/health/")
        data = response.json()
        assert "status" in data

    def test_response_status_is_ok(self, client: APIClient) -> None:
        response = client.get("/health/")
        data = response.json()
        assert data["status"] == "ok"

    def test_response_has_service_field(self, client: APIClient) -> None:
        response = client.get("/health/")
        data = response.json()
        assert "service" in data

    def test_response_has_version_field(self, client: APIClient) -> None:
        response = client.get("/health/")
        data = response.json()
        assert "version" in data

    def test_response_has_timestamp_field(self, client: APIClient) -> None:
        response = client.get("/health/")
        data = response.json()
        assert "timestamp" in data


@pytest.mark.django_db
class TestLivenessEndpoint:
    """GET /health/live — Kubernetes liveness probe."""

    def test_returns_200(self, client: APIClient) -> None:
        response = client.get("/health/live")
        assert response.status_code == 200

    def test_response_has_status_field(self, client: APIClient) -> None:
        response = client.get("/health/live")
        data = response.json()
        assert "status" in data

    def test_response_status_is_alive(self, client: APIClient) -> None:
        response = client.get("/health/live")
        data = response.json()
        assert data["status"] == "alive"


@pytest.mark.django_db
class TestReadinessEndpoint:
    """GET /health/ready — Kubernetes readiness probe."""

    def test_returns_200_or_503(self, client: APIClient) -> None:
        response = client.get("/health/ready")
        assert response.status_code in (200, 503)

    def test_response_has_status_field(self, client: APIClient) -> None:
        response = client.get("/health/ready")
        data = response.json()
        assert "status" in data

    def test_response_has_checks_field(self, client: APIClient) -> None:
        response = client.get("/health/ready")
        data = response.json()
        assert "checks" in data

    def test_checks_is_dict(self, client: APIClient) -> None:
        response = client.get("/health/ready")
        data = response.json()
        assert isinstance(data["checks"], dict)

    def test_200_status_is_ready(self, client: APIClient) -> None:
        response = client.get("/health/ready")
        if response.status_code == 200:
            assert response.json()["status"] == "ready"

    def test_503_status_is_not_ready(self, client: APIClient) -> None:
        response = client.get("/health/ready")
        if response.status_code == 503:
            assert response.json()["status"] == "not ready"
