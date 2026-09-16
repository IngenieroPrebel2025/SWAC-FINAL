# Architecture

This document describes the structural principles, layer responsibilities, and extension points of the Django Enterprise Backend Template.

---

## Table of Contents

1. [Clean Architecture Overview](#clean-architecture-overview)
2. [Layer Descriptions](#layer-descriptions)
3. [Data Flow](#data-flow)
4. [Dependency Rules](#dependency-rules)
5. [Repository / Service Pattern](#repository--service-pattern)
6. [Adding New Features](#adding-new-features)
7. [Extension Points](#extension-points)

---

## Clean Architecture Overview

The project organises code into two top-level namespaces:

- **`core/`** — Framework plumbing, cross-cutting concerns, and abstractions. Contains no business logic.
- **`apps/`** — Domain-specific Django applications. Each app owns its models, serializers, views, and services.

This separation keeps the business logic independent of infrastructure choices. Swapping the database driver, the authentication provider, or the caching backend requires changes only at the edges — never in domain code.

```
+--------------------------------------------------------------+
|  apps.*   (business domain)                                  |
|  - models, serializers, views, services, urls                |
|  - depends on core.*                                         |
+--------------------------------------------------------------+
         |  imports from
         v
+--------------------------------------------------------------+
|  core.*   (framework plumbing)                               |
|  - config, middleware, exceptions, logging, utils, auth      |
|  - depends on Django / DRF / third-party libs                |
|  - NEVER imports from apps.*                                 |
+--------------------------------------------------------------+
         |  depends on
         v
+--------------------------------------------------------------+
|  Infrastructure  (injected via settings/env)                 |
|  - SQLite / SQL Server / PostgreSQL                          |
|  - Redis                                                     |
|  - SMTP                                                      |
|  - Sentry, Azure Blob Storage, etc.                          |
+--------------------------------------------------------------+
```

---

## Layer Descriptions

### `core/config/`

Settings, URL routing, ASGI/WSGI entry points, and the API router.

- **`settings/`** — Five settings modules in an inheritance chain:
  `base` <- `development`, `base` <- `staging` <- `production`, `development` <- `testing`
- **`urls.py`** — Mounts health checks, the API router, and the OpenAPI views. The Django admin can be disabled or relocated via env vars.
- **`api_router.py`** — The single place where DRF ViewSets are registered. Wire new apps here.

### `core/middleware/`

Every HTTP request passes through this stack before reaching a view.

| Middleware | Responsibility |
|---|---|
| `SecurityMiddleware` | Enforces max upload size (413 on oversize), injects hardened response headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`), adds `Cache-Control: no-store` to API paths. |
| `CorrelationMiddleware` | Reads or generates `X-Correlation-ID` and `X-Request-ID`, stores them on the request object and in thread-local storage, echoes them in response headers. |
| `RequestLoggingMiddleware` | Logs request method, path, status code, and duration at the completion of each request. |

Middleware order matters. The Django middleware list in `base.py` is documented and must not be reordered without understanding the implications (CORS must precede CommonMiddleware; correlation ID must precede logging).

### `core/exceptions/`

A typed exception hierarchy (`AppException` and its subclasses) and a DRF exception handler that maps all exceptions to a consistent JSON envelope:

```json
{
    "success": false,
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "Validation failed.",
        "details": [{"field": "email", "errors": ["Enter a valid email address."]}]
    },
    "meta": {
        "correlation_id": "550e8400-e29b-41d4-a716-446655440000",
        "request_id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8"
    }
}
```

**Exception classes:**

| Class | HTTP | Code |
|---|---|---|
| `ValidationError` | 400 | `VALIDATION_ERROR` |
| `AuthenticationError` | 401 | `AUTHENTICATION_REQUIRED` |
| `PermissionDeniedError` | 403 | `PERMISSION_DENIED` |
| `NotFoundError` | 404 | `RESOURCE_NOT_FOUND` |
| `ConflictError` | 409 | `CONFLICT` |
| `RateLimitError` | 429 | `RATE_LIMIT_EXCEEDED` |
| `ServiceUnavailableError` | 503 | `SERVICE_UNAVAILABLE` |

### `core/logging/`

`JsonFormatter` produces single-line JSON log records with these fields:

```
timestamp, level, logger, message, correlation_id, request_id,
module, funcName, lineno, exc_info (if exception), <extra fields>
```

In development, a human-readable console formatter is used instead. See [docs/logging.md](logging.md).

### `core/auth/`

Authentication and authorization abstraction points only — no concrete implementation.

- `BaseAuthenticationBackend` — abstract class with `authenticate()` and `get_user()`.
- `NoOpAuthenticationBackend` — always returns `None` (anonymous). Replace this when adding auth.
- `BaseProjectPermission` — abstract DRF `BasePermission`.
- Stubs: `HasRolePermission`, `HasClaimPermission`, `PolicyPermission`.

### `core/utils/`

Framework utilities reusable across all apps.

| Module | Contents |
|---|---|
| `pagination.py` | `StandardResultsPagination` (page-number), `CursorResultsPagination` (cursor-based, ordered by `-created_at`) |
| `responses.py` | `success_response()`, `error_response()`, `paginated_response()` — all populate `correlation_id`/`request_id` in `meta` |
| `mixins.py` | `AuditMixin` (stamps `created_by`/`updated_by`), `SoftDeleteMixin` (overrides `destroy()`) |
| `decorators.py` | `@cache_response(timeout, key_func)`, `@no_cache` |

### `core/security/`

Framework-agnostic validation helpers: `validate_uuid()`, `validate_file_upload()`, `sanitize_filename()`, `is_safe_url()`.

### `core/ratelimit/`

DRF throttle classes with named scopes: `GlobalAnonThrottle`, `GlobalUserThrottle`, `BurstAnonThrottle`, `SustainedAnonThrottle`, `PerEndpointThrottle`, `HealthCheckThrottle`.

### `apps/common/`

Shared base models used across all domain apps.

| Class | Fields | Purpose |
|---|---|---|
| `UUIDModel` | `id` (UUID PK) | Avoids sequential integer IDs in URLs |
| `TimeStampedModel` | `created_at`, `updated_at` | Auto-managed timestamps |
| `SoftDeleteModel` | `is_deleted`, `deleted_at` | Soft delete with `soft_delete()` method |
| `BaseModel` | All of the above | Combine all three — the standard base for domain models |

`ActiveManager` filters `is_deleted=False`. `AllObjectsManager` returns all rows including deleted.

### `apps/health/`

Three views with no authentication or permission requirements:

| Endpoint | Purpose |
|---|---|
| `GET /health/` | Returns service name, version, timestamp. Always 200. |
| `GET /health/live` | Kubernetes liveness probe. Returns 200 while the process is alive. |
| `GET /health/ready` | Kubernetes readiness probe. Checks database (`SELECT 1`) and cache (write + read). Returns 200 or 503. |

### `apps/audit/`

Immutable audit trail. The `AuditLog` model deliberately avoids foreign keys to the users app so audit records survive even if the referenced user is deleted.

`AuditService.log()` is the single entry point for writing audit records. Call it from service classes — never from serializers or views directly.

```python
from apps.audit.services import AuditService

AuditService.log(
    action='UPDATE',
    resource_type='Order',
    resource_id=str(order.id),
    request=request,
    changes={'before': {'status': 'pending'}, 'after': {'status': 'shipped'}},
)
```

---

## Data Flow

```
Client
  |
  | HTTP Request
  v
[Django SecurityMiddleware]  -- 413 if oversized body
  |
[WhiteNoise]                 -- serves static files; passes through for API
  |
[SessionMiddleware]
  |
[CorsMiddleware]             -- checks Origin header, adds CORS response headers
  |
[CsrfViewMiddleware]
  |
[CorrelationMiddleware]      -- attaches correlation_id, request_id to request + thread-local
  |
[RequestLoggingMiddleware]   -- logs request on entry
  |
  v
URL Router (core/config/urls.py)
  |
  v
View (apps/<app>/views.py)
  |
  |-- Serializer.is_valid()  --> raises DRF ValidationError on failure
  |
  |-- Service call           --> may raise AppException subclasses
  |
  |-- AuditService.log()     --> optional, writes to audit_logs table
  |
  v
Response helpers (core/utils/responses.py)
  |
  | Attaches correlation_id + request_id to "meta" block
  v
[RequestLoggingMiddleware]   -- logs response status + duration on exit
  |
[CorrelationMiddleware]      -- adds X-Correlation-Id + X-Request-Id headers
  |
[SecurityMiddleware]         -- adds security headers, Cache-Control: no-store
  |
  v
Client
```

---

## Dependency Rules

**Allowed:**
- `apps.*` imports from `core.*`
- `apps.*` imports from `apps.common.*`
- `core.*` imports from Django / DRF / installed packages

**Forbidden:**
- `core.*` imports from `apps.*` — this would create a circular dependency
- `apps.foo` imports directly from `apps.bar` domain models (use a service boundary or shared event instead)

Enforce this with a `ruff` rule or a custom `mypy` plugin if needed.

---

## Repository / Service Pattern

The template uses a lightweight service pattern rather than a full repository pattern. The reasoning: Django's ORM is itself a repository abstraction, and adding another layer on top adds indirection without meaningful benefit for most Django projects.

**Pattern in practice:**

- **Models** (`apps/<app>/models.py`) — data definition and simple ORM methods. No business logic.
- **Services** (`apps/<app>/services.py`) — business logic, validation, cross-app coordination, audit logging. Services are plain Python classes or functions that call the ORM.
- **Serializers** (`apps/<app>/serializers.py`) — input validation and output formatting only. No database writes beyond `serializer.save()`.
- **Views** (`apps/<app>/views.py`) — request parsing, permission checks, delegation to services, response formatting.

**Example service structure:**

```python
# apps/orders/services.py
from apps.audit.services import AuditService
from core.exceptions.base import NotFoundError, ConflictError
from .models import Order


class OrderService:
    @staticmethod
    def ship_order(order_id: str, request) -> Order:
        try:
            order = Order.objects.get(pk=order_id, is_deleted=False)
        except Order.DoesNotExist:
            raise NotFoundError(message=f"Order {order_id} not found.")

        if order.status != 'pending':
            raise ConflictError(message="Only pending orders can be shipped.")

        before_status = order.status
        order.status = 'shipped'
        order.save(update_fields=['status', 'updated_at'])

        AuditService.log(
            action='UPDATE',
            resource_type='Order',
            resource_id=str(order.id),
            request=request,
            changes={'before': {'status': before_status}, 'after': {'status': 'shipped'}},
        )
        return order
```

---

## Adding New Features

### Step-by-step for a new domain app

1. **Create the app:**
   ```bash
   python manage.py startapp myfeature apps/myfeature
   ```

2. **Register in `LOCAL_APPS` (`core/config/settings/base.py`):**
   ```python
   'apps.myfeature',
   ```

3. **Define the model in `apps/myfeature/models.py`:**
   ```python
   from apps.common.models import BaseModel
   from django.db import models

   class MyFeature(BaseModel):
       name = models.CharField(max_length=255)
       objects = ActiveManager()  # excludes soft-deleted
       all_objects = AllObjectsManager()
   ```

4. **Create the migration:**
   ```bash
   python manage.py makemigrations myfeature
   ```

5. **Write the service (`apps/myfeature/services.py`)** — business logic here, not in views.

6. **Write the serializer (`apps/myfeature/serializers.py`)** — validation and output shape.

7. **Write the view (`apps/myfeature/views.py`)** — thin wrapper around the service.

8. **Register the ViewSet in `core/config/api_router.py`:**
   ```python
   from apps.myfeature.views import MyFeatureViewSet
   router.register(r'my-features', MyFeatureViewSet, basename='my-feature')
   ```

9. **Write tests in `tests/unit/` and `tests/integration/`** — see [docs/testing.md](testing.md).

---

## Extension Points

### Authentication

Replace `NoOpAuthenticationBackend` in `core/auth/backends.py` with your provider. Set `AUTHENTICATION_BACKENDS` and `REST_FRAMEWORK['DEFAULT_AUTHENTICATION_CLASSES']` in your settings.

### Authorization

Subclass `BaseProjectPermission` from `core/auth/permissions.py`. Add your permission class to views or to `REST_FRAMEWORK['DEFAULT_PERMISSION_CLASSES']`.

### Celery (async tasks)

1. Install `celery[redis]` and `django-celery-beat`.
2. Create `core/config/celery.py` and configure the Celery app.
3. Add `CELERY_BROKER_URL = os.environ.get('REDIS_URL')` to settings.
4. Tasks go in `apps/<app>/tasks.py`.

### Domain events

For event-driven patterns, add an events bus (e.g., `django-events`, Redis pub/sub, or Kafka). Events should be published from service classes, not from models or views.

### File storage

The production requirements include `django-storages[azure]`. For Azure Blob Storage:

```python
DEFAULT_FILE_STORAGE = 'storages.backends.azure_storage.AzureStorage'
AZURE_ACCOUNT_NAME = os.environ['AZURE_ACCOUNT_NAME']
AZURE_ACCOUNT_KEY = os.environ['AZURE_ACCOUNT_KEY']
AZURE_CONTAINER = os.environ['AZURE_CONTAINER']
```

For AWS S3, install `django-storages[s3]` and use `storages.backends.s3boto3.S3Boto3Storage`.
