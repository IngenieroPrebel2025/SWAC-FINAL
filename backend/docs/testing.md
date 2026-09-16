# Testing Guide

## Framework

| Tool | Purpose |
|---|---|
| `pytest` | Test runner |
| `pytest-django` | Django integration |
| `pytest-cov` | Coverage reporting |
| `factory-boy` | Test data factories |
| `faker` | Realistic fake data |
| `responses` | Mock HTTP calls |
| `freezegun` | Freeze time in tests |

---

## Running Tests

```bash
# Full suite with coverage
pytest

# Specific directory
pytest tests/unit/
pytest tests/integration/
pytest tests/api/
pytest tests/middleware/

# Single file
pytest tests/integration/test_health.py

# Single test
pytest tests/integration/test_health.py::TestHealthEndpoints::test_health_returns_200

# Skip slow tests
pytest -m "not slow"

# Only slow tests
pytest -m slow

# Verbose output
pytest -v

# Stop on first failure
pytest -x

# Show local variables on failure
pytest -l
```

---

## Coverage

Minimum required: **90%**

```bash
# Terminal report
pytest --cov --cov-report=term-missing

# HTML report (open htmlcov/index.html in browser)
pytest --cov --cov-report=html

# XML (for CI)
pytest --cov --cov-report=xml
```

The `--cov-fail-under=90` flag in `pyproject.toml` causes pytest to exit non-zero when coverage drops below threshold.

---

## Test Structure

```
tests/
  conftest.py             — shared fixtures (api_client, users, authenticated clients)
  factories/
    users.py              — UserFactory
  unit/                   — isolated, no DB, no HTTP (fast)
    test_models.py
    test_exceptions.py
    test_pagination.py
    test_validators.py
  integration/            — real DB, real Django app (needs @pytest.mark.django_db)
    test_health.py
    test_audit.py
  api/                    — end-to-end HTTP tests
    test_error_responses.py
  middleware/             — middleware behaviour
    test_correlation.py
    test_security.py
  performance/            — smoke tests (marked slow)
    test_smoke.py
```

---

## Writing Unit Tests

Unit tests do not touch the database or make HTTP calls.

```python
import pytest
from core.exceptions.base import NotFoundError

pytestmark = pytest.mark.unit

class TestNotFoundError:
    def test_has_correct_status_code(self) -> None:
        exc = NotFoundError()
        assert exc.status_code == 404

    def test_accepts_custom_message(self) -> None:
        exc = NotFoundError(message="Order not found.")
        assert exc.message == "Order not found."
```

---

## Writing Integration Tests

Integration tests use the real database (in-memory SQLite in testing settings).

```python
import pytest

pytestmark = [pytest.mark.integration, pytest.mark.django_db]

class TestAuditService:
    def test_log_creates_record(self) -> None:
        from apps.audit.models import AuditLog
        from apps.audit.services import AuditService

        AuditService.log(action="CREATE", resource_type="Order", resource_id="123")

        assert AuditLog.objects.filter(action="CREATE", resource_type="Order").exists()
```

---

## Writing API Tests

Use `api_client` or `authenticated_client` fixtures from `conftest.py`.

```python
import pytest

pytestmark = [pytest.mark.integration, pytest.mark.django_db]

class TestOrderAPI:
    def test_unauthenticated_returns_401(self, api_client) -> None:
        response = api_client.get('/api/v1/orders/')
        assert response.status_code == 401

    def test_authenticated_returns_200(self, authenticated_client) -> None:
        response = authenticated_client.get('/api/v1/orders/')
        assert response.status_code == 200

    def test_error_response_has_correct_envelope(self, api_client) -> None:
        response = api_client.get('/api/v1/nonexistent/')
        data = response.json()
        assert data['success'] is False
        assert 'error' in data
        assert 'code' in data['error']
```

---

## Using Factories

```python
from tests.factories.users import UserFactory

# Create and save to DB
user = UserFactory()
admin = UserFactory(is_staff=True, is_superuser=True)

# Build without saving
user = UserFactory.build()

# Create many
users = UserFactory.create_batch(10)

# Override specific fields
user = UserFactory(email='specific@example.com')
```

### Adding a new factory

```python
# tests/factories/orders.py
import factory
from factory.django import DjangoModelFactory
from faker import Faker

fake = Faker()

class OrderFactory(DjangoModelFactory):
    class Meta:
        model = 'orders.Order'

    reference = factory.LazyFunction(lambda: fake.uuid4())
    status = 'pending'
    created_by = factory.SubFactory(UserFactory)
```

---

## Mocking External Services

Use the `responses` library for HTTP mocks:

```python
import responses

@responses.activate
def test_external_api_call() -> None:
    responses.add(
        responses.GET,
        'https://api.example.com/data',
        json={'result': 'ok'},
        status=200,
    )
    result = MyIntegrationClient().get('/data')
    assert result['result'] == 'ok'
```

---

## Freezing Time

```python
from freezegun import freeze_time

@freeze_time('2025-01-01 12:00:00')
def test_created_at_is_fixed() -> None:
    from django.utils import timezone
    from apps.audit.models import AuditLog

    entry = AuditLog.objects.create(action='CREATE', resource_type='Test')
    assert entry.created_at.year == 2025
    assert entry.created_at.month == 1
```

---

## Fixtures Reference

| Fixture | Type | Description |
|---|---|---|
| `api_client` | `APIClient` | Unauthenticated DRF client |
| `regular_user` | `User` | Non-staff user from UserFactory |
| `admin_user` | `User` | Superuser from UserFactory |
| `authenticated_client` | `APIClient` | Client force-authenticated as `regular_user` |
| `admin_client` | `APIClient` | Client force-authenticated as `admin_user` |
| `db` | — | pytest-django: allow DB access |
| `django_db` | — | pytest.mark: allow DB access (class/function level) |

---

## Test Markers

| Marker | Description |
|---|---|
| `@pytest.mark.unit` | Fast isolated test, no external dependencies |
| `@pytest.mark.integration` | Requires DB |
| `@pytest.mark.slow` | Performance/smoke test, skipped by default in fast runs |
| `@pytest.mark.django_db` | Grants DB access to a test |

---

## CI Behaviour

The GitHub Actions `test` job:
1. Installs `requirements/testing.txt`
2. Sets `DJANGO_SETTINGS_MODULE=core.config.settings.testing`
3. Sets `DJANGO_SECRET_KEY` to a dummy value
4. Runs `pytest --cov --cov-report=xml --cov-fail-under=90`
5. Uploads coverage XML as an artifact

The pipeline fails if coverage drops below 90% or any test fails.
