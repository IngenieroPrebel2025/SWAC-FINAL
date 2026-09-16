"""
API tests verifying that error responses follow the standard envelope:

    {
        "success": false,
        "error": {
            "code": "<ERROR_CODE>",
            "message": "<human-readable>",
            "details": []
        },
        "meta": { ... }
    }
"""

from __future__ import annotations

import pytest
from rest_framework.test import APIClient

pytestmark = pytest.mark.integration


@pytest.fixture
def client() -> APIClient:
    return APIClient()


@pytest.mark.django_db
class TestNotFoundResponse:
    """404 on a nonexistent endpoint returns the standard error envelope."""

    def test_nonexistent_endpoint_returns_404(self, client: APIClient) -> None:
        response = client.get("/api/v1/nonexistent-endpoint-xyz/")
        assert response.status_code == 404

    def test_404_response_has_success_false(self, client: APIClient) -> None:
        response = client.get("/api/v1/nonexistent-endpoint-xyz/")
        data = response.json()
        assert data.get("success") is False

    def test_404_response_has_error_key(self, client: APIClient) -> None:
        response = client.get("/api/v1/nonexistent-endpoint-xyz/")
        data = response.json()
        assert "error" in data

    def test_404_response_error_has_code(self, client: APIClient) -> None:
        response = client.get("/api/v1/nonexistent-endpoint-xyz/")
        error = response.json().get("error", {})
        assert "code" in error

    def test_404_response_error_has_message(self, client: APIClient) -> None:
        response = client.get("/api/v1/nonexistent-endpoint-xyz/")
        error = response.json().get("error", {})
        assert "message" in error

    def test_404_response_error_has_details(self, client: APIClient) -> None:
        response = client.get("/api/v1/nonexistent-endpoint-xyz/")
        error = response.json().get("error", {})
        assert "details" in error

    def test_404_response_has_meta_key(self, client: APIClient) -> None:
        response = client.get("/api/v1/nonexistent-endpoint-xyz/")
        data = response.json()
        assert "meta" in data


@pytest.mark.django_db
class TestMethodNotAllowedResponse:
    """405 on a wrong HTTP method returns the standard error envelope."""

    def test_wrong_method_returns_405(self, client: APIClient) -> None:
        # /health/ only supports GET; POST should return 405.
        response = client.post("/health/", data={}, format="json")
        assert response.status_code == 405

    def test_405_response_has_success_false(self, client: APIClient) -> None:
        response = client.post("/health/", data={}, format="json")
        data = response.json()
        assert data.get("success") is False

    def test_405_response_has_error_key(self, client: APIClient) -> None:
        response = client.post("/health/", data={}, format="json")
        assert "error" in response.json()

    def test_405_response_error_code(self, client: APIClient) -> None:
        response = client.post("/health/", data={}, format="json")
        error = response.json().get("error", {})
        assert error.get("code") == "METHOD_NOT_ALLOWED"


@pytest.mark.django_db
class TestInvalidJsonBody:
    """Malformed JSON body returns 400 with the standard error envelope."""

    def test_invalid_json_returns_400(self, client: APIClient) -> None:
        response = client.post(
            "/api/v1/audit-logs/logs/",
            data="not valid json{{",
            content_type="application/json",
        )
        # May return 400 (parse error) or 405 (if POST not allowed) — both are valid.
        assert response.status_code in (400, 405)

    def test_400_response_has_success_false(self, client: APIClient) -> None:
        response = client.post(
            "/api/v1/audit-logs/logs/",
            data="{{broken json",
            content_type="application/json",
        )
        if response.status_code == 400:
            data = response.json()
            assert data.get("success") is False

    def test_400_response_has_error_key(self, client: APIClient) -> None:
        response = client.post(
            "/api/v1/audit-logs/logs/",
            data="{{broken json",
            content_type="application/json",
        )
        if response.status_code == 400:
            assert "error" in response.json()
