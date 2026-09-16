# Django Enterprise Backend Template (No Auth)

A production-ready Django REST API template built for enterprise teams. It provides a clean, opinionated foundation with structured logging, security hardening, health probes, audit trails, and Kubernetes manifests — all without locking you into a specific authentication provider.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture Overview](#architecture-overview)
3. [Technology Stack](#technology-stack)
4. [Folder Structure](#folder-structure)
5. [Prerequisites](#prerequisites)
6. [Local Setup (without Docker)](#local-setup-without-docker)
7. [Docker Setup](#docker-setup)
8. [Environment Configuration](#environment-configuration)
9. [Database Configuration](#database-configuration)
10. [API Documentation](#api-documentation)
11. [Running Tests](#running-tests)
12. [Code Quality Tools](#code-quality-tools)
13. [Kubernetes Deployment](#kubernetes-deployment)
14. [Authentication (Important Note)](#authentication-important-note)
15. [Adding a New App](#adding-a-new-app)
16. [Extending the User Model](#extending-the-user-model)
17. [Deployment Guide](#deployment-guide)
18. [Troubleshooting](#troubleshooting)
19. [Contributing](#contributing)

---

## Project Overview

This template is designed for backend engineering teams that need to spin up a new Django REST API service quickly without sacrificing production quality. It solves the recurring problem of copy-pasting boilerplate across projects by providing:

- A layered settings hierarchy (base / development / staging / production / testing)
- Structured JSON logging with correlation ID propagation
- Security headers and upload size enforcement via custom middleware
- A complete audit trail app (`apps.audit`)
- Soft-delete and UUID-primary-key base models
- Health check endpoints compatible with Kubernetes liveness and readiness probes
- Rate limiting with configurable scopes
- OpenAPI 3 schema generation via drf-spectacular
- Docker and Kubernetes manifests ready for CI/CD substitution

**Who is it for?** Backend engineers building microservices or monolithic APIs in Python who want a battle-tested starting point that follows Django best practices and Clean Architecture principles.

**What it is NOT:** A full-stack framework, an authentication solution, or a specific business-domain implementation. Authentication is intentionally excluded so each team can plug in their own provider (see [Authentication](#authentication-important-note)).

---

## Architecture Overview

The project follows a layered Clean Architecture where business logic in `apps/` depends on abstractions in `core/`, and infrastructure concerns (database drivers, cache, external services) are configured at the edges.

```
Request
   |
   v
Middleware stack (security, correlation ID, logging)
   |
   v
URL router  -->  View  -->  Serializer  -->  Service / Model
                                                   |
                                              core.exceptions
                                              core.utils
                                              core.logging
```

**Dependency rule:** `apps.*` may import from `core.*`. `core.*` never imports from `apps.*`.

See [docs/architecture.md](docs/architecture.md) for a full description.

---

## Technology Stack

| Component | Library | Version |
|---|---|---|
| Framework | Django | >=5.0,<6.0 |
| REST API | Django REST Framework | >=3.15 |
| Filtering | django-filter | >=24.0 |
| CORS | django-cors-headers | >=4.0 |
| OpenAPI schema | drf-spectacular | >=0.27 |
| Static files | WhiteNoise | >=6.6 |
| WSGI server | Gunicorn | >=22.0 |
| ASGI server | Uvicorn | >=0.29 |
| Cache / session | django-redis + redis-py | >=5.4 / >=5.0 |
| SQL Server driver | mssql-django | >=1.5 |
| Image processing | Pillow | >=10.0 |
| Error tracking | sentry-sdk[django] | >=1.45 |
| File storage | django-storages[azure] | >=1.14 |
| Python | CPython | >=3.13 |
| Container base | python:3.13-slim | — |
| Database (dev) | SQLite | built-in |
| Database (prod) | SQL Server 2022 | — |
| Cache | Redis 7 | — |

See `requirements/` for pinned version files.

---

## Folder Structure

```
SERVICE-DjangoTemplate-NoAuth/
|
|-- manage.py                     # Django management entry point
|-- Dockerfile                    # Multi-stage production image
|-- docker-compose.yml            # Local stack: backend + Redis + (opt) SQL Server
|-- pyproject.toml                # Ruff, Black, isort, mypy, pytest, coverage config
|-- setup.cfg                     # Package metadata
|-- .env.example                  # Template for required environment variables
|-- .gitignore
|-- .dockerignore
|
|-- requirements/
|   |-- base.txt                  # Runtime dependencies (all environments)
|   |-- development.txt           # base + dev tools (django-extensions, ipython)
|   |-- production.txt            # base + sentry + azure-storages
|   |-- testing.txt               # base + pytest + factory-boy + faker + responses
|   |-- quality.txt               # ruff + black + isort + mypy + bandit + pre-commit
|
|-- core/                         # Framework-level plumbing (no business logic)
|   |-- config/
|   |   |-- settings/
|   |   |   |-- base.py           # Shared settings, no secrets/defaults
|   |   |   |-- development.py    # SQLite, DEBUG=True, relaxed security
|   |   |   |-- staging.py        # SQL Server, Redis, strict CORS
|   |   |   |-- production.py     # HSTS, SSL redirect, tightest rate limits
|   |   |   |-- testing.py        # In-memory SQLite, dummy cache, no logging
|   |   |-- urls.py               # Root URL conf (/api/v1/, /health/, /api/docs/)
|   |   |-- api_router.py         # DRF DefaultRouter — register viewsets here
|   |   |-- asgi.py
|   |   |-- wsgi.py
|   |
|   |-- auth/
|   |   |-- backends.py           # BaseAuthenticationBackend abstraction
|   |   |-- permissions.py        # BaseProjectPermission + RBAC/ABAC stubs
|   |
|   |-- cache/
|   |   |-- backends.py           # Cache helper utilities
|   |
|   |-- exceptions/
|   |   |-- base.py               # AppException hierarchy (400–503)
|   |   |-- handlers.py           # DRF custom_exception_handler (unified envelope)
|   |
|   |-- logging/
|   |   |-- formatters.py         # JsonFormatter (single-line JSON with cid/rid)
|   |   |-- filters.py            # Log filters
|   |
|   |-- middleware/
|   |   |-- correlation.py        # CorrelationMiddleware — X-Correlation-ID/X-Request-ID
|   |   |-- logging.py            # RequestLoggingMiddleware
|   |   |-- security.py           # SecurityMiddleware — headers + upload size guard
|   |
|   |-- ratelimit/
|   |   |-- throttles.py          # GlobalAnon/User, Burst, Sustained, PerEndpoint throttles
|   |   |-- middleware.py         # Rate limit middleware
|   |
|   |-- security/
|   |   |-- validators.py         # validate_uuid, validate_file_upload, sanitize_filename
|   |
|   |-- utils/
|       |-- decorators.py         # @cache_response, @no_cache
|       |-- mixins.py             # AuditMixin, SoftDeleteMixin for ViewSets
|       |-- pagination.py         # StandardResultsPagination, CursorResultsPagination
|       |-- responses.py          # success_response(), error_response(), paginated_response()
|
|-- apps/                         # Business-domain Django apps
|   |-- common/
|   |   |-- models.py             # BaseModel, UUIDModel, TimeStampedModel, SoftDeleteModel
|   |   |-- managers.py           # ActiveManager (excludes soft-deleted), AllObjectsManager
|   |   |-- serializers.py        # Base serializer utilities
|   |   |-- views.py              # Shared view base classes
|   |   |-- admin.py
|   |
|   |-- health/
|   |   |-- views.py              # HealthView, LivenessView, ReadinessView
|   |   |-- urls.py               # /health/, /health/live, /health/ready
|   |
|   |-- audit/
|   |   |-- models.py             # AuditLog (immutable, no FK to users)
|   |   |-- services.py           # AuditService.log() — central audit writer
|   |   |-- serializers.py
|   |
|   |-- users/                    # Placeholder user app — extend as needed
|   |-- notifications/            # Placeholder notification app
|
|-- k8s/
|   |-- base/
|       |-- namespace.yaml
|       |-- serviceaccount.yaml
|       |-- configmap.yaml
|       |-- secrets.yaml
|       |-- deployment.yaml       # Rolling update, non-root, readOnly filesystem
|       |-- service.yaml
|       |-- ingress.yaml
|       |-- hpa.yaml              # 2–10 replicas, CPU 70% / Memory 80%
|
|-- docs/
    |-- architecture.md
    |-- database.md
    |-- deployment.md
    |-- development.md
    |-- security.md
    |-- testing.md
    |-- logging.md
    |-- monitoring.md
    |-- kubernetes.md
```

---

## Prerequisites

| Requirement | Minimum version | Notes |
|---|---|---|
| Python | 3.13 | Required — the codebase uses 3.13+ syntax |
| pip | latest | `pip install --upgrade pip` |
| Docker | 24+ | For containerised local development |
| Docker Compose | 2.x (plugin) | `docker compose` (not `docker-compose`) |
| kubectl | 1.28+ | For Kubernetes deployment |
| Helm | 3.x | Optional — for Helm chart deployment |
| ODBC Driver 18 | — | Required only for SQL Server connectivity |

---

## Local Setup (without Docker)

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd SERVICE-DjangoTemplate-NoAuth

# 2. Create and activate a virtual environment
python -m venv .venv
# Linux/macOS:
source .venv/bin/activate
# Windows:
.venv\Scripts\activate

# 3. Install development dependencies
pip install -r requirements/development.txt

# 4. Copy the environment template
cp .env.example .env

# 5. Set the Django secret key in .env
# Open .env and change DJANGO_SECRET_KEY to a long random string.
# Generate one with:
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"

# 6. Apply database migrations (uses SQLite automatically in development)
python manage.py migrate

# 7. Start the development server
python manage.py runserver
```

The API will be available at `http://localhost:8000`.
API docs will be at `http://localhost:8000/api/docs/`.

---

## Docker Setup

### Standard stack (backend + Redis)

```bash
# 1. Copy and edit environment variables
cp .env.example .env
# Edit .env — at minimum set DJANGO_SECRET_KEY

# 2. Build and start all services
docker compose up --build
```

### With SQL Server

```bash
# Start backend + Redis + SQL Server
docker compose --profile sqlserver up --build
```

Update `.env` to set SQL Server credentials and switch `DJANGO_SETTINGS_MODULE` to
`core.config.settings.staging` or `core.config.settings.production` to activate SQL Server.

### Useful Docker commands

```bash
# Run migrations inside the container
docker compose exec backend python manage.py migrate

# Open a Django shell
docker compose exec backend python manage.py shell

# View logs
docker compose logs -f backend

# Stop and remove containers
docker compose down
```

---

## Environment Configuration

All configuration is driven by environment variables. Copy `.env.example` to `.env` and set values appropriate for your environment.

| Variable | Required | Default | Description |
|---|---|---|---|
| `DJANGO_SETTINGS_MODULE` | Yes | — | Settings module to use. Use `core.config.settings.development` locally. |
| `DJANGO_SECRET_KEY` | Yes | — | Django secret key. Must be a long random string in all environments. |
| `DJANGO_DEBUG` | No | `False` | Set to `True` only in development. |
| `DJANGO_ALLOWED_HOSTS` | Yes (non-dev) | `*` in dev | Comma-separated list of allowed hostnames. |
| `SERVICE_NAME` | No | `django-service` | Identifies the service in logs and health endpoints. |
| `SERVICE_VERSION` | No | `1.0.0` | Service version, emitted in health checks. |
| `DB_NAME` | Yes (prod/staging) | — | SQL Server database name. |
| `DB_HOST` | Yes (prod/staging) | — | SQL Server hostname. |
| `DB_PORT` | No | `1433` | SQL Server port. |
| `DB_USER` | Yes (prod/staging) | — | SQL Server username. |
| `DB_PASSWORD` | Yes (prod/staging) | — | SQL Server password. |
| `REDIS_URL` | No | `redis://redis:6379/0` | Redis connection URL. |
| `REDIS_KEY_PREFIX` | No | `django` | Prefix for all Redis keys. |
| `EMAIL_HOST` | No | `localhost` | SMTP server hostname. |
| `EMAIL_PORT` | No | `587` | SMTP server port. |
| `EMAIL_HOST_USER` | No | `""` | SMTP username. |
| `EMAIL_HOST_PASSWORD` | No | `""` | SMTP password. |
| `EMAIL_USE_TLS` | No | `True` | Enable STARTTLS on SMTP. |
| `DEFAULT_FROM_EMAIL` | No | `noreply@example.com` | Default sender address. |
| `CORS_ALLOWED_ORIGINS` | No | `""` | Comma-separated list of allowed CORS origins. |
| `RATE_LIMIT_ANON` | No | `100/hour` | Rate limit for anonymous requests. |
| `RATE_LIMIT_USER` | No | `1000/hour` | Rate limit for authenticated requests. |
| `RATE_LIMIT_BURST` | No | `20/minute` | Burst rate limit. |
| `LOG_LEVEL` | No | `INFO` | Logging level: `DEBUG`, `INFO`, `WARNING`, `ERROR`. |
| `MAX_UPLOAD_SIZE` | No | `10485760` | Maximum request body size in bytes (default 10 MB). |
| `API_TITLE` | No | `Service API` | Title shown in Swagger UI. |
| `API_VERSION` | No | `1.0.0` | API version shown in Swagger UI. |
| `API_DESCRIPTION` | No | — | Description shown in Swagger UI. |
| `API_CONTACT_NAME` | No | `Engineering Team` | Contact name in schema. |
| `API_CONTACT_EMAIL` | No | `""` | Contact email in schema. |
| `SECURE_HSTS_SECONDS` | No | `31536000` | HSTS max-age in seconds (production only). |
| `DJANGO_ADMIN_ENABLED` | No | `true` | Set to `false` to disable the Django admin. |
| `DJANGO_ADMIN_URL` | No | `admin/` | URL path for the Django admin. |
| `ENVIRONMENT` | No | `unknown` | Environment name emitted in JSON logs. |

---

## Database Configuration

### Development — SQLite (zero configuration)

The development settings module automatically configures SQLite at `db.sqlite3` in the project root. No additional environment variables or drivers are required.

```python
# core/config/settings/development.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}
```

### Production — SQL Server

Staging and production use mssql-django. The ODBC Driver 18 for SQL Server must be installed on the host or container.

**Install the driver:**

```bash
# Ubuntu/Debian
curl https://packages.microsoft.com/keys/microsoft.asc | apt-key add -
curl https://packages.microsoft.com/config/ubuntu/22.04/prod.list > /etc/apt/sources.list.d/mssql-release.list
apt-get update && ACCEPT_EULA=Y apt-get install -y msodbcsql18 unixodbc-dev
```

Set these environment variables:

```bash
DB_NAME=mydb
DB_HOST=sqlserver.internal
DB_PORT=1433
DB_USER=appuser
DB_PASSWORD=SecretPassword
```

The configured `OPTIONS` block in `staging.py`:

```python
'OPTIONS': {
    'driver': 'ODBC Driver 18 for SQL Server',
    'extra_params': 'TrustServerCertificate=yes',
    'unicode_results': True,
}
```

Remove `TrustServerCertificate=yes` in production when using a properly signed certificate.

### Switching to PostgreSQL

1. Install `psycopg2-binary` (or `psycopg2` for production):
   ```bash
   pip install psycopg2-binary
   ```
2. Update the `DATABASES` block:
   ```python
   DATABASES = {
       'default': {
           'ENGINE': 'django.db.backends.postgresql',
           'NAME': os.environ['DB_NAME'],
           'HOST': os.environ['DB_HOST'],
           'PORT': os.environ.get('DB_PORT', '5432'),
           'USER': os.environ['DB_USER'],
           'PASSWORD': os.environ['DB_PASSWORD'],
       }
   }
   ```

### Switching to MySQL

1. Install `mysqlclient`:
   ```bash
   pip install mysqlclient
   ```
2. Set `ENGINE` to `django.db.backends.mysql` and adjust `PORT` to `3306`.

### Applying migrations

```bash
# Development
python manage.py migrate

# Inside Docker
docker compose exec backend python manage.py migrate

# Production (always run before deploying the new image)
kubectl exec -it deployment/django-backend -- python manage.py migrate
```

---

## API Documentation

Interactive API documentation is auto-generated from the codebase using drf-spectacular.

| Endpoint | Description |
|---|---|
| `GET /api/docs/` | Swagger UI — interactive browser |
| `GET /api/redoc/` | ReDoc UI — read-friendly reference |
| `GET /api/schema/` | Raw OpenAPI 3 schema (YAML or JSON) |

Access in development: `http://localhost:8000/api/docs/`

Download the schema:

```bash
# YAML format
curl http://localhost:8000/api/schema/ -o schema.yaml

# JSON format
curl http://localhost:8000/api/schema/?format=json -o schema.json
```

The schema title, description, version, and contact fields are all configurable via environment variables (`API_TITLE`, `API_DESCRIPTION`, `API_VERSION`, `API_CONTACT_NAME`, `API_CONTACT_EMAIL`).

---

## Running Tests

Tests use pytest with pytest-django. The testing settings module uses an in-memory SQLite database, dummy cache, and suppresses all logging output.

```bash
# Run all tests
pytest

# Run only unit tests
pytest tests/unit/

# Run only integration tests
pytest tests/integration/

# Run with HTML coverage report
pytest --cov --cov-report=html
# Open htmlcov/index.html in your browser

# Run a specific test file
pytest tests/unit/test_exceptions.py

# Run tests matching a keyword
pytest -k "test_health"
```

**Coverage threshold:** The project is configured with a minimum coverage of 90% (`--cov-fail-under=90`). CI will fail if coverage drops below this.

**Test marks:**

```bash
# Run only slow tests
pytest -m slow

# Run only integration tests
pytest -m integration

# Exclude slow tests
pytest -m "not slow"
```

---

## Code Quality Tools

All quality tools are configured in `pyproject.toml`.

### Ruff (linting)

```bash
# Check for linting errors
ruff check .

# Auto-fix safe issues
ruff check . --fix
```

### Black (formatting)

```bash
# Format all files
black .

# Check without modifying
black . --check
```

### isort (import sorting)

```bash
# Sort imports
isort .

# Check without modifying
isort . --check-only
```

### mypy (type checking)

```bash
mypy .
```

### Bandit (security scanning)

```bash
bandit -r . -c pyproject.toml
```

### pip-audit (dependency vulnerability scanning)

```bash
pip-audit -r requirements/base.txt
```

### Pre-commit hooks

All of the above tools run automatically on every commit when pre-commit is installed:

```bash
# Install hooks into .git/hooks/
pre-commit install

# Run all hooks against every file manually
pre-commit run --all-files
```

---

## Kubernetes Deployment

See [docs/kubernetes.md](docs/kubernetes.md) for the full guide.

### Prerequisites

- A running Kubernetes cluster (AKS, EKS, GKE, or local)
- `kubectl` configured with cluster access
- A container registry accessible from the cluster
- The image built and pushed: `docker build -t <registry>/django-backend:<tag> . && docker push ...`

### Apply base manifests with Kustomize

```bash
kubectl apply -k k8s/base/
```

### Apply an overlay (e.g., production)

```bash
kubectl apply -k k8s/overlays/production/
```

### Helm chart deployment

```bash
# Install
helm install backend k8s/helm/ -f k8s/helm/values.yaml

# Upgrade
helm upgrade backend k8s/helm/ -f k8s/helm/values.yaml

# Uninstall
helm uninstall backend
```

### Verify deployment

```bash
kubectl -n backend get pods
kubectl -n backend get svc
kubectl -n backend describe deployment django-backend
```

---

## Authentication (Important Note)

**This template ships with NO authentication implementation.**

This is an intentional design decision. Authentication providers vary widely across organizations (Keycloak, Azure Entra ID, Auth0, internal JWT, LDAP, etc.), and baking one in would either force teams to rip it out or leave an unused dependency.

Instead, the template provides clean abstraction points:

- `core/auth/backends.py` — `BaseAuthenticationBackend` abstract class. Subclass it, implement `authenticate()` and `get_user()`, then add your backend to `AUTHENTICATION_BACKENDS` in settings.
- `core/auth/permissions.py` — `BaseProjectPermission` and stubs for RBAC (`HasRolePermission`), claims-based (`HasClaimPermission`), and policy-based (`PolicyPermission`) authorization.
- `REST_FRAMEWORK['DEFAULT_AUTHENTICATION_CLASSES']` — currently empty. Set this to your DRF authentication class.
- `REST_FRAMEWORK['DEFAULT_PERMISSION_CLASSES']` — currently `AllowAny`. Override per-view or globally.

See [docs/security.md](docs/security.md) for concrete integration examples for Keycloak, Azure Entra ID, JWT, and Auth0.

---

## Adding a New App

```bash
# 1. Create the Django app inside the apps/ directory
python manage.py startapp myapp apps/myapp
```

```python
# 2. Register in settings (core/config/settings/base.py)
LOCAL_APPS = [
    'apps.common',
    'apps.health',
    'apps.audit',
    'apps.notifications',
    'apps.users',
    'apps.myapp',  # Add this
]
```

```python
# 3. Create apps/myapp/urls.py
from django.urls import path
from . import views

app_name = 'myapp'

urlpatterns = [
    path('', views.MyListView.as_view(), name='list'),
]
```

```python
# 4. Register in core/config/api_router.py
from apps.myapp.views import MyModelViewSet

router.register(r'my-resources', MyModelViewSet, basename='my-resource')
```

If you need a simple URL include (not a ViewSet), add to `core/config/urls.py`:

```python
path('api/v1/myapp/', include('apps.myapp.urls', namespace='myapp')),
```

---

## Extending the User Model

The template declares `AUTH_USER_MODEL = 'users.User'` but leaves the `apps/users/` app as a placeholder. To add fields:

```python
# apps/users/models.py
from django.contrib.auth.models import AbstractUser
from apps.common.models import TimeStampedModel


class User(AbstractUser, TimeStampedModel):
    department = models.CharField(max_length=100, blank=True)
    employee_id = models.CharField(max_length=50, unique=True, null=True, blank=True)

    class Meta:
        db_table = 'users'
```

Then generate and apply the migration:

```bash
python manage.py makemigrations users
python manage.py migrate
```

**Important:** Set `AUTH_USER_MODEL` before running any migrations. Changing it after the initial migration requires significant migration surgery.

---

## Deployment Guide

See [docs/deployment.md](docs/deployment.md) for the complete guide.

### Production checklist

- [ ] `DJANGO_SECRET_KEY` is a long random string — never the development default
- [ ] `DJANGO_DEBUG=False`
- [ ] `DJANGO_ALLOWED_HOSTS` is set to your actual domain(s)
- [ ] `CORS_ALLOWED_ORIGINS` lists only your frontend origins
- [ ] `SECURE_HSTS_SECONDS=31536000` (enables HSTS for one year)
- [ ] Database credentials are in Kubernetes Secrets or a secrets manager — not in ConfigMaps or source control
- [ ] `python manage.py migrate` has run against the production database before deploying
- [ ] `python manage.py collectstatic --noinput` has run (WhiteNoise serves static files)
- [ ] Redis is reachable and `REDIS_URL` is set
- [ ] Sentry DSN is configured in the production environment
- [ ] Health probes are responding: `GET /health/live` and `GET /health/ready`

---

## Troubleshooting

### `DJANGO_SECRET_KEY` not set

```
KeyError: 'DJANGO_SECRET_KEY'
```

The base settings read `SECRET_KEY = os.environ['DJANGO_SECRET_KEY']` with no default. Ensure your `.env` file is present and loaded, or export the variable:

```bash
export DJANGO_SECRET_KEY="your-secret-key-here"
```

### SQLite database not created

Run `python manage.py migrate`. SQLite creates the file automatically on first migration.

### `No module named 'mssql'` in development

The SQL Server driver is only needed in staging/production. Use `DJANGO_SETTINGS_MODULE=core.config.settings.development` (the default when using `.env.example`).

### CORS errors in the browser

Ensure `CORS_ALLOWED_ORIGINS` in `.env` includes your frontend origin exactly (including scheme and port):

```bash
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://app.example.com
```

### Rate limit 429 responses during testing

The testing settings module disables all throttle classes. If you are hitting rate limits in manual testing against the development server, raise the limits in your `.env`:

```bash
RATE_LIMIT_ANON=10000/hour
RATE_LIMIT_USER=10000/hour
```

### Docker container unhealthy

The healthcheck calls `GET /health/` on port 8000. If the container is marked unhealthy:

1. Check the migrations ran: `docker compose exec backend python manage.py migrate`
2. Check the logs: `docker compose logs backend`
3. Confirm `DJANGO_SECRET_KEY` is set in `.env`

### `django.db.utils.OperationalError` on startup

Usually a missing migration. Run `python manage.py migrate` before starting the server.

---

## Contributing

### Branch naming

```
feature/<short-description>
fix/<short-description>
chore/<short-description>
docs/<short-description>
```

### Commit conventions

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add password reset endpoint
fix: prevent correlation ID leaking across requests
chore: upgrade Django to 5.1
docs: add Keycloak integration guide
test: add coverage for AuditService
```

### Pull request process

1. Branch from `main`.
2. Install pre-commit hooks: `pre-commit install`.
3. Write or update tests — coverage must remain above 90%.
4. Run `pre-commit run --all-files` and fix any issues.
5. Open a PR against `main` with a clear description of the change and why.
6. At least one review approval is required before merge.
7. Squash-merge is preferred for feature branches to keep the main history clean.
