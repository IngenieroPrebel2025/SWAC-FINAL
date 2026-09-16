"""
Global pytest fixtures.

Provides API clients, user instances, and authenticated client helpers
that are available across the entire test suite.
"""

from __future__ import annotations

import pytest
from rest_framework.test import APIClient


@pytest.fixture
def api_client() -> APIClient:
    """Unauthenticated DRF API client."""
    return APIClient()


@pytest.fixture
def admin_user(db):  # type: ignore[no-untyped-def]
    """Superuser instance created via UserFactory."""
    from tests.factories.users import UserFactory

    return UserFactory(is_staff=True, is_superuser=True)


@pytest.fixture
def regular_user(db):  # type: ignore[no-untyped-def]
    """Regular (non-staff) user instance created via UserFactory."""
    from tests.factories.users import UserFactory

    return UserFactory()


@pytest.fixture
def authenticated_client(regular_user) -> APIClient:  # type: ignore[no-untyped-def]
    """APIClient with a regular user force-authenticated."""
    client = APIClient()
    client.force_authenticate(user=regular_user)
    return client


@pytest.fixture
def admin_client(admin_user) -> APIClient:  # type: ignore[no-untyped-def]
    """APIClient with an admin user force-authenticated."""
    client = APIClient()
    client.force_authenticate(user=admin_user)
    return client
