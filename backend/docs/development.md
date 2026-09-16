# Developer Guide

This document covers environment setup, project conventions, and step-by-step guidance for common development tasks.

---

## Table of Contents

1. [Setting Up the Development Environment](#setting-up-the-development-environment)
2. [Project Conventions](#project-conventions)
3. [Adding New Django Apps](#adding-new-django-apps)
4. [Writing Services vs Views](#writing-services-vs-views)
5. [Using the BaseModel](#using-the-basemodel)
6. [Using Soft Delete](#using-soft-delete)
7. [Using the AuditService](#using-the-auditservice)
8. [Using Correlation IDs](#using-correlation-ids)
9. [Using Response Helpers](#using-response-helpers)
10. [Writing Tests](#writing-tests)
11. [Pre-commit Hooks](#pre-commit-hooks)
12. [Code Style Guide](#code-style-guide)

---

## Setting Up the Development Environment

```bash
# Clone the repository
git clone <your-repo-url>
cd SERVICE-DjangoTemplate-NoAuth

# Create a virtual environment with Python 3.13+
python -m venv .venv

# Activate (Linux/macOS)
source .venv/bin/activate

# Activate (Windows PowerShell)
.venv\Scripts\Activate.ps1

# Install development dependencies (includes base + django-extensions + ipython)
pip install -r requirements/development.txt

# Install testing dependencies
pip install -r requirements/testing.txt

# Install quality tools
pip install -r requirements/quality.txt

# Copy the environment file
cp .env.example .env

# Generate and set a secret key
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
# Paste the output as DJANGO_SECRET_KEY= in .env

# Apply migrations
python manage.py migrate

# Start the development server
python manage.py runserver
```

Visit `http://localhost:8000/api/docs/` for the Swagger UI.

### Useful management commands

```bash
# Open the Django shell with IPython (if django-extensions is installed)
python manage.py shell_plus

# Show all URL patterns
python manage.py show_urls

# Check for any configuration problems
python manage.py check

# Run the development server with auto-reload
python manage.py runserver 0.0.0.0:8000
```

---

## Project Conventions

### Naming

| Thing | Convention | Example |
|---|---|---|
| App directories | `snake_case` | `apps/order_items/` |
| Model classes | `PascalCase` | `OrderItem` |
| ViewSet classes | `PascalCase` + `ViewSet` | `OrderItemViewSet` |
| Serializer classes | `PascalCase` + `Serializer` | `OrderItemSerializer` |
| Service classes | `PascalCase` + `Service` | `OrderService` |
| URL names | `kebab-case` | `order-item-list` |
| Database tables | `snake_case` | `order_items` (set via `Meta.db_table`) |
| API paths | `kebab-case` | `/api/v1/order-items/` |
| Environment variables | `SCREAMING_SNAKE_CASE` | `DJANGO_SECRET_KEY` |
| Python files | `snake_case.py` | `order_service.py` |

### Import order

isort (configured with the `black` profile) enforces this order:

1. Standard library
2. Third-party packages (Django, DRF, etc.)
3. Local packages (`core.*`, `apps.*`)

Separate each group with a blank line.

### Folder structure per app

```
apps/myapp/
├── __init__.py
├── apps.py           # AppConfig
├── models.py         # Django models
├── managers.py       # Custom QuerySet/Manager classes (if needed)
├── serializers.py    # DRF serializers
├── views.py          # DRF views and ViewSets
├── services.py       # Business logic
├── urls.py           # URL patterns (if not using a router)
├── admin.py          # Django admin registrations
├── filters.py        # django-filter FilterSet classes
├── permissions.py    # App-specific permission classes
└── migrations/
    └── __init__.py
```

---

## Adding New Django Apps

```bash
# 1. Create the app inside the apps/ package
python manage.py startapp myapp apps/myapp
```

```python
# 2. Configure AppConfig in apps/myapp/apps.py
from django.apps import AppConfig

class MyappConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.myapp'
    verbose_name = 'My App'
```

```python
# 3. Register in LOCAL_APPS (core/config/settings/base.py)
LOCAL_APPS = [
    'apps.common',
    'apps.health',
    'apps.audit',
    'apps.notifications',
    'apps.users',
    'apps.myapp',  # <-- add here
]
```

```python
# 4. Create the model
# apps/myapp/models.py
from apps.common.models import BaseModel
from apps.common.managers import ActiveManager, AllObjectsManager
from django.db import models


class MyResource(BaseModel):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    objects = ActiveManager()       # excludes soft-deleted rows (default)
    all_objects = AllObjectsManager()  # includes all rows

    class Meta:
        db_table = 'myapp_resources'
        ordering = ['-created_at']
```

```bash
# 5. Create and apply the migration
python manage.py makemigrations myapp
python manage.py migrate
```

```python
# 6. Register the ViewSet in core/config/api_router.py
from apps.myapp.views import MyResourceViewSet

router.register(r'my-resources', MyResourceViewSet, basename='my-resource')
```

---

## Writing Services vs Views

**Views** handle HTTP concerns only: request parsing, authentication, permissions, delegation, and response formatting. They do not contain business logic.

**Services** contain all business logic: validation beyond serializer-level, database writes, external API calls, event publishing, and audit logging.

### Bad: business logic in a view

```python
# Do NOT do this
class OrderViewSet(ModelViewSet):
    def update(self, request, pk):
        order = get_object_or_404(Order, pk=pk)
        if order.status != 'pending':
            return Response({'error': 'Cannot update.'}, status=400)
        order.status = request.data['status']
        order.save()
        return Response(OrderSerializer(order).data)
```

### Good: business logic in a service

```python
# services.py
class OrderService:
    @staticmethod
    def update_status(order_id: str, new_status: str, request) -> Order:
        try:
            order = Order.objects.get(pk=order_id)
        except Order.DoesNotExist:
            raise NotFoundError(message=f"Order {order_id} not found.")

        if order.status != 'pending':
            raise ConflictError(message="Only pending orders can be modified.")

        order.status = new_status
        order.save(update_fields=['status', 'updated_at'])
        AuditService.log('UPDATE', 'Order', str(order_id), request=request)
        return order

# views.py
class OrderViewSet(ModelViewSet):
    def partial_update(self, request, pk):
        serializer = OrderUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = OrderService.update_status(pk, serializer.validated_data['status'], request)
        return success_response(OrderSerializer(order).data)
```

---

## Using the BaseModel

All domain models should extend `BaseModel`:

```python
from apps.common.models import BaseModel


class Product(BaseModel):
    name = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=10, decimal_places=2)
```

`BaseModel` combines:

- `UUIDModel` — `id` (UUID primary key, auto-generated)
- `TimeStampedModel` — `created_at` (auto-set on create), `updated_at` (auto-set on save)
- `SoftDeleteModel` — `is_deleted` (default `False`), `deleted_at` (set by `soft_delete()`)

If you only need some of these traits, compose them individually:

```python
from apps.common.models import UUIDModel, TimeStampedModel

class ReadOnlyImport(UUIDModel, TimeStampedModel):
    # No soft delete — hard deletes are acceptable for import records
    ...
```

---

## Using Soft Delete

### Soft-deleting an instance

```python
product = Product.objects.get(pk=product_id)
product.soft_delete()  # sets is_deleted=True, deleted_at=now(), saves
```

### Querying

```python
# Active records only (is_deleted=False) — this is the default manager
Product.objects.all()

# All records including deleted
Product.all_objects.all()

# Restore a deleted record
product = Product.all_objects.get(pk=product_id, is_deleted=True)
product.is_deleted = False
product.deleted_at = None
product.save(update_fields=['is_deleted', 'deleted_at'])
```

### In a ViewSet

Use `SoftDeleteMixin` to override `destroy()` automatically:

```python
from core.utils.mixins import SoftDeleteMixin
from rest_framework.viewsets import ModelViewSet


class ProductViewSet(SoftDeleteMixin, ModelViewSet):
    queryset = Product.objects.all()  # ActiveManager — only non-deleted
    serializer_class = ProductSerializer
```

`DELETE /api/v1/products/<id>/` now returns `204 No Content` and marks the record as deleted instead of issuing a `DELETE` SQL statement.

---

## Using the AuditService

Import and call `AuditService.log()` from service classes whenever a significant event occurs.

```python
from apps.audit.services import AuditService


# Basic usage
AuditService.log(
    action='CREATE',
    resource_type='Product',
    resource_id=str(product.id),
)

# With request context (extracts IP, user agent, correlation ID, and user ID automatically)
AuditService.log(
    action='DELETE',
    resource_type='Product',
    resource_id=str(product.id),
    request=request,
)

# With before/after diff
AuditService.log(
    action='UPDATE',
    resource_type='Product',
    resource_id=str(product.id),
    request=request,
    changes={
        'before': {'price': '9.99'},
        'after': {'price': '14.99'},
    },
)

# With additional metadata
AuditService.log(
    action='LOGIN',
    resource_type='User',
    resource_id=str(user.id),
    request=request,
    metadata={'method': 'keycloak', 'client_id': 'frontend'},
)
```

**Recommended action names** (use consistent verbs across the codebase):

`CREATE`, `UPDATE`, `DELETE`, `LOGIN`, `LOGOUT`, `EXPORT`, `IMPORT`, `APPROVE`, `REJECT`

---

## Using Correlation IDs

Every request gets a `X-Correlation-ID` and `X-Request-ID` attached by `CorrelationMiddleware`. These are available throughout the request lifecycle.

### Accessing correlation IDs in code

```python
from core.middleware.correlation import get_correlation_id, get_request_id

def my_service_function():
    cid = get_correlation_id()  # string UUID or ""
    rid = get_request_id()
    logger.info("Processing request", extra={"correlation_id": cid, "request_id": rid})
```

### Accessing from the request object

```python
def my_view(request):
    cid = request.correlation_id    # set by CorrelationMiddleware
    rid = request.request_id
```

### Propagating to downstream services

When making outbound HTTP requests to other services, forward the correlation ID:

```python
import httpx
from core.middleware.correlation import get_correlation_id

response = httpx.get(
    "https://other-service.internal/api/resource",
    headers={"X-Correlation-ID": get_correlation_id()},
)
```

---

## Using Response Helpers

Use the helpers in `core/utils/responses.py` for consistent response envelopes.

```python
from core.utils.responses import success_response, error_response, paginated_response
from rest_framework import status

# Success response (200)
return success_response(data=serializer.data)

# Success response with custom status and message
return success_response(
    data=serializer.data,
    status=status.HTTP_201_CREATED,
    message="Product created successfully.",
)

# Error response
return error_response(
    code="INSUFFICIENT_STOCK",
    message="Not enough items in stock.",
    details=[{"field": "quantity", "error": "Requested 10, available 5."}],
    status=status.HTTP_409_CONFLICT,
)

# Paginated response
paginator = StandardResultsPagination()
page = paginator.paginate_queryset(queryset, request)
return paginated_response(paginator, serializer.data, request)
```

All `success_response` and `paginated_response` calls automatically include `correlation_id` and `request_id` in the `meta` block.

---

## Writing Tests

See [docs/testing.md](testing.md) for the full testing guide.

### Quick example

```python
# tests/unit/test_audit_service.py
import pytest
from apps.audit.services import AuditService
from apps.audit.models import AuditLog


@pytest.mark.django_db
class TestAuditService:
    def test_log_creates_audit_entry(self):
        entry = AuditService.log(
            action='CREATE',
            resource_type='Product',
            resource_id='123',
        )
        assert entry.action == 'CREATE'
        assert entry.resource_type == 'Product'
        assert AuditLog.objects.count() == 1

    def test_log_with_changes(self):
        changes = {'before': {'name': 'Old'}, 'after': {'name': 'New'}}
        entry = AuditService.log('UPDATE', 'Product', '123', changes=changes)
        assert entry.changes == changes
```

---

## Pre-commit Hooks

Pre-commit runs all quality checks automatically before each commit.

```bash
# Install hooks into .git/hooks/ (run once per clone)
pre-commit install

# Run all hooks against all files (useful before a PR)
pre-commit run --all-files

# Run a specific hook
pre-commit run ruff --all-files
pre-commit run black --all-files

# Skip hooks for a commit (emergency only)
git commit --no-verify -m "emergency fix"
```

The hooks that run on each commit:

1. `ruff` — linting
2. `black` — formatting check
3. `isort` — import order check
4. `mypy` — type checking
5. `bandit` — security scanning

Configure hooks in `.pre-commit-config.yaml` (create if not present):

```yaml
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.4.0
    hooks:
      - id: ruff
        args: [--fix]
  - repo: https://github.com/psf/black
    rev: 24.0.0
    hooks:
      - id: black
  - repo: https://github.com/PyCQA/isort
    rev: 5.13.0
    hooks:
      - id: isort
  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.9.0
    hooks:
      - id: mypy
        additional_dependencies: [django-stubs, djangorestframework-stubs]
  - repo: https://github.com/PyCQA/bandit
    rev: 1.7.0
    hooks:
      - id: bandit
        args: [-c, pyproject.toml]
```

---

## Code Style Guide

### General

- Line length: 100 characters (configured in `pyproject.toml` for both Black and Ruff)
- Prefer explicit over implicit
- Use type annotations on all function signatures
- Avoid bare `except:` — catch specific exception types
- Use `logger = logging.getLogger(__name__)` at module level

### Type annotations

```python
# Good
def get_order(order_id: str, *, include_deleted: bool = False) -> Order | None:
    ...

# Bad
def get_order(order_id, include_deleted=False):
    ...
```

### Docstrings

Use Google-style docstrings for public functions and classes:

```python
def validate_uuid(value: str) -> uuid.UUID:
    """Validate and return a UUID parsed from value.

    Args:
        value: String to validate.

    Returns:
        A uuid.UUID object.

    Raises:
        ValidationError: If value is not a valid UUID.
    """
```

### Logging

```python
import logging

logger = logging.getLogger(__name__)

# Good
logger.info("Order %s shipped", order.id)
logger.error("Failed to process payment", exc_info=True)
logger.debug("Cache miss for key %s", cache_key)

# Bad — string formatting in log messages (creates the string even if log level suppresses output)
logger.info(f"Order {order.id} shipped")
logger.info("Order " + str(order.id) + " shipped")
```

### ORM usage

```python
# Good — use select_related/prefetch_related to avoid N+1 queries
orders = Order.objects.select_related('customer').prefetch_related('items').filter(status='pending')

# Good — use only() to limit columns when you don't need the full model
order_ids = Order.objects.filter(status='pending').only('id', 'created_at')

# Good — update_fields to limit the columns updated on save
order.status = 'shipped'
order.save(update_fields=['status', 'updated_at'])

# Bad — saves all fields (slow on wide tables, can overwrite concurrent changes)
order.status = 'shipped'
order.save()
```

### Never commit secrets

If you accidentally commit a secret:
1. Immediately rotate the secret (generate a new value in all systems that use it)
2. Remove it from git history using `git filter-repo` or `BFG Repo Cleaner`
3. Force-push the cleaned history (coordinate with the team)
4. Revoke the old secret value
