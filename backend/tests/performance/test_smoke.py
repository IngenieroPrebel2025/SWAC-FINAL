"""
Performance smoke tests.

These tests assert on response time and basic concurrency behaviour.
They are marked ``slow`` and excluded from the default test run; invoke
explicitly with ``pytest -m slow``.
"""

from __future__ import annotations

import time
from concurrent.futures import ThreadPoolExecutor, as_completed

import pytest
from rest_framework.test import APIClient

pytestmark = [pytest.mark.slow, pytest.mark.integration]

# Maximum acceptable response time for a single health request (seconds).
_MAX_RESPONSE_MS = 200
_CONCURRENT_REQUESTS = 10


@pytest.fixture
def client() -> APIClient:
    return APIClient()


@pytest.mark.django_db(transaction=True)
class TestHealthEndpointPerformance:
    """Health endpoint responds within an acceptable time budget."""

    def test_single_request_under_200ms(self, client: APIClient) -> None:
        start = time.monotonic()
        response = client.get("/health/")
        elapsed_ms = (time.monotonic() - start) * 1000

        assert response.status_code == 200
        assert elapsed_ms < _MAX_RESPONSE_MS, (
            f"Health endpoint took {elapsed_ms:.1f}ms, expected < {_MAX_RESPONSE_MS}ms"
        )

    def test_liveness_under_200ms(self, client: APIClient) -> None:
        start = time.monotonic()
        response = client.get("/health/live")
        elapsed_ms = (time.monotonic() - start) * 1000

        assert response.status_code == 200
        assert elapsed_ms < _MAX_RESPONSE_MS, (
            f"Liveness endpoint took {elapsed_ms:.1f}ms, expected < {_MAX_RESPONSE_MS}ms"
        )


@pytest.mark.django_db(transaction=True)
class TestConcurrentHealthRequests:
    """10 concurrent requests to /health/ all succeed."""

    def _make_request(self) -> int:
        c = APIClient()
        return c.get("/health/").status_code

    def test_concurrent_requests_all_succeed(self) -> None:
        with ThreadPoolExecutor(max_workers=_CONCURRENT_REQUESTS) as executor:
            futures = [
                executor.submit(self._make_request)
                for _ in range(_CONCURRENT_REQUESTS)
            ]
            statuses = [f.result() for f in as_completed(futures)]

        assert all(s == 200 for s in statuses), (
            f"Some concurrent requests failed: {statuses}"
        )

    def test_concurrent_requests_count(self) -> None:
        with ThreadPoolExecutor(max_workers=_CONCURRENT_REQUESTS) as executor:
            futures = [
                executor.submit(self._make_request)
                for _ in range(_CONCURRENT_REQUESTS)
            ]
            statuses = [f.result() for f in as_completed(futures)]

        assert len(statuses) == _CONCURRENT_REQUESTS
