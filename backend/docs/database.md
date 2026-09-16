# Database

This document covers the supported database backends, configuration, migration strategy, soft delete, and performance recommendations.

---

## Table of Contents

1. [Development — SQLite](#development--sqlite)
2. [Production — SQL Server](#production--sql-server)
3. [Switching to PostgreSQL](#switching-to-postgresql)
4. [Switching to MySQL](#switching-to-mysql)
5. [Migration Strategy](#migration-strategy)
6. [Soft Delete Pattern](#soft-delete-pattern)
7. [Index Strategy](#index-strategy)
8. [Connection Pooling](#connection-pooling)
9. [Primary / Replica Setup](#primary--replica-setup)

---

## Development — SQLite

No configuration required. When `DJANGO_SETTINGS_MODULE=core.config.settings.development`, Django creates `db.sqlite3` in the project root on the first `migrate` call.

```bash
python manage.py migrate
python manage.py runserver
```

The testing settings go further and use an in-memory database (`':memory:'`) for maximum isolation and zero filesystem I/O.

**Limitations of SQLite:**

- No concurrent writes (one writer at a time)
- No full-text search, JSON path queries, or window functions on older SQLite versions
- Not supported by mssql-django — switch to staging settings when testing SQL Server-specific queries

---

## Production — SQL Server

Staging and production use [mssql-django](https://github.com/microsoft/mssql-django), the Microsoft-maintained Django backend for SQL Server.

### System prerequisites

**ODBC Driver 18 for SQL Server** must be installed on every host that connects to SQL Server (application servers and CI runners).

Ubuntu/Debian installation:

```bash
curl https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > /usr/share/keyrings/microsoft.gpg
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/microsoft.gpg] \
  https://packages.microsoft.com/debian/12/prod bookworm main" \
  > /etc/apt/sources.list.d/mssql-release.list
apt-get update
ACCEPT_EULA=Y apt-get install -y msodbcsql18 unixodbc-dev
```

Alpine Linux (for smaller Docker images):

```bash
apk add --no-cache unixodbc
# Microsoft does not publish Alpine packages. Build from source or use the Debian base image.
```

Python package (already in `requirements/base.txt`):

```bash
pip install mssql-django>=1.5
```

### Connection parameters

Set these environment variables:

```bash
DB_NAME=mydb
DB_HOST=sqlserver.internal
DB_PORT=1433
DB_USER=appuser
DB_PASSWORD=SecretPassword
```

The resulting `DATABASES` dict in `core/config/settings/staging.py`:

```python
DATABASES = {
    'default': {
        'ENGINE': 'mssql',
        'NAME': os.environ['DB_NAME'],
        'HOST': os.environ['DB_HOST'],
        'PORT': os.environ.get('DB_PORT', '1433'),
        'USER': os.environ['DB_USER'],
        'PASSWORD': os.environ['DB_PASSWORD'],
        'OPTIONS': {
            'driver': 'ODBC Driver 18 for SQL Server',
            'extra_params': 'TrustServerCertificate=yes',
            'unicode_results': True,
        },
    }
}
```

**Remove `TrustServerCertificate=yes`** in production when connecting to SQL Server with a properly signed TLS certificate. This parameter skips certificate validation and is only safe on a trusted network.

### Additional SQL Server OPTIONS

| Option | Description |
|---|---|
| `driver` | ODBC driver name — must match the installed driver (`ODBC Driver 18 for SQL Server`) |
| `extra_params` | Raw ODBC connection string parameters |
| `unicode_results` | Return `str` instead of `bytes` for char/varchar results |
| `use_mars` | Enable Multiple Active Result Sets (required for some concurrent operations) |
| `Encrypt` | `yes` to enforce TLS encryption |

### Known limitations of mssql-django

- `NOWAIT` database locking is not supported — row-level locks may behave differently
- `SELECT ... FOR UPDATE` semantics differ from PostgreSQL
- Some `DateTimeField` microsecond precision is lost on older SQL Server versions
- `JSONField` requires SQL Server 2016+ with JSON support (all current versions qualify)
- `ArrayField` is not supported — use `JSONField` to store arrays
- `DISTINCT ON` is not available — use `DISTINCT` or subqueries
- Django migrations use `nvarchar` by default for char fields; this is correct for SQL Server

---

## Switching to PostgreSQL

1. Install the driver:
   ```bash
   pip install psycopg2-binary  # development
   pip install psycopg2         # production (requires libpq-dev)
   ```

2. Update `DATABASES` in your settings:
   ```python
   DATABASES = {
       'default': {
           'ENGINE': 'django.db.backends.postgresql',
           'NAME': os.environ['DB_NAME'],
           'HOST': os.environ['DB_HOST'],
           'PORT': os.environ.get('DB_PORT', '5432'),
           'USER': os.environ['DB_USER'],
           'PASSWORD': os.environ['DB_PASSWORD'],
           'OPTIONS': {
               'connect_timeout': 10,
               'options': '-c default_transaction_isolation=read\ committed',
           },
       }
   }
   ```

3. Remove `mssql-django` from `requirements/base.txt` if not needed.

4. Run migrations against the new database.

---

## Switching to MySQL

1. Install the driver:
   ```bash
   pip install mysqlclient  # requires libmysqlclient-dev on the host
   ```

2. Update `DATABASES`:
   ```python
   DATABASES = {
       'default': {
           'ENGINE': 'django.db.backends.mysql',
           'NAME': os.environ['DB_NAME'],
           'HOST': os.environ['DB_HOST'],
           'PORT': os.environ.get('DB_PORT', '3306'),
           'USER': os.environ['DB_USER'],
           'PASSWORD': os.environ['DB_PASSWORD'],
           'OPTIONS': {
               'charset': 'utf8mb4',
               'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
           },
       }
   }
   ```

3. Ensure the database collation is `utf8mb4_unicode_ci` or `utf8mb4_0900_ai_ci`.

---

## Migration Strategy

### Local development

```bash
# Create a new migration after model changes
python manage.py makemigrations <app_name>

# Apply all pending migrations
python manage.py migrate

# Inspect what SQL would be run
python manage.py sqlmigrate <app_name> <migration_number>

# Show migration status
python manage.py showmigrations
```

### Production deployments

**Always run migrations before deploying the new application image.** Never run them during startup (via `CMD` in the Dockerfile) because:

- Multiple containers starting simultaneously would race to apply the same migration
- A failed migration would prevent the new container from starting, leaving the database in a partial state

**Recommended deployment sequence:**

1. Build and push the new image
2. Run `python manage.py migrate` as a pre-deploy Kubernetes `Job` or a one-off container
3. Wait for the migration job to complete successfully
4. Roll out the new `Deployment`

Example Kubernetes migration job:

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: django-migrate
  namespace: backend
spec:
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: migrate
          image: ${IMAGE_REGISTRY}/django-backend:${IMAGE_TAG}
          command: ["python", "manage.py", "migrate", "--noinput"]
          envFrom:
            - configMapRef:
                name: django-backend-config
            - secretRef:
                name: django-backend-secret
```

### Squashing migrations

When a migration file grows large or there are many small migrations:

```bash
python manage.py squashmigrations <app_name> <from_migration> <to_migration>
```

Do not squash migrations that are already applied in production without a coordinated rollout plan.

---

## Soft Delete Pattern

All domain models should extend `BaseModel` (or at minimum `SoftDeleteModel`) to use soft deletion instead of hard `DELETE`.

### How it works

```python
# apps/common/models.py
class SoftDeleteModel(models.Model):
    is_deleted = models.BooleanField(default=False, db_index=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    def soft_delete(self) -> None:
        from django.utils import timezone
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save(update_fields=['is_deleted', 'deleted_at'])
```

### Managers

```python
from apps.common.managers import ActiveManager, AllObjectsManager

class MyModel(BaseModel):
    objects = ActiveManager()       # default — excludes deleted records
    all_objects = AllObjectsManager()  # includes deleted records
```

Using `MyModel.objects.all()` automatically excludes soft-deleted rows. Use `MyModel.all_objects.all()` to include them (e.g., for audit queries or restore operations).

### ViewSet soft delete

Mix in `SoftDeleteMixin` from `core/utils/mixins.py` instead of the default DRF `DestroyModelMixin`:

```python
from core.utils.mixins import SoftDeleteMixin
from rest_framework.viewsets import ModelViewSet

class MyModelViewSet(SoftDeleteMixin, ModelViewSet):
    queryset = MyModel.objects.all()
    serializer_class = MyModelSerializer
```

`destroy()` now sets `is_deleted = True` and returns `204 No Content` rather than issuing a `DELETE` SQL statement.

### Considerations

- Add a compound index on `(is_deleted, <frequently-filtered-field>)` for queries that always filter by both
- Periodically archive or purge soft-deleted records to control table growth
- Foreign key references to soft-deleted rows are not automatically protected — consider business-level cascades in your service layer

---

## Index Strategy

Indexes defined in the base models:

| Model | Field | Type | Reason |
|---|---|---|---|
| `TimeStampedModel` | `created_at` | BTree | Sorted pagination, range queries |
| `SoftDeleteModel` | `is_deleted` | BTree | Every `ActiveManager` query filters on this |
| `AuditLog` | `user_id, created_at` | Composite | Per-user audit history |
| `AuditLog` | `action, resource_type` | Composite | Filter by event type |
| `AuditLog` | `created_at` | BTree | Time-range queries |

**Recommendations for domain models:**

- Add indexes on foreign keys (Django does not add them automatically for SQL Server)
- Add indexes on fields used in `WHERE` clauses with high selectivity
- Use `db_index=True` on CharField/UUIDField lookups that appear in URL patterns
- Avoid over-indexing write-heavy tables — each index adds overhead to `INSERT` and `UPDATE`
- Use `Meta.indexes` with `name=` for named indexes that can be managed by migrations

```python
class Meta:
    indexes = [
        models.Index(fields=['status', 'created_at'], name='order_status_created_idx'),
        models.Index(fields=['customer_id'], name='order_customer_idx'),
    ]
```

---

## Connection Pooling

Django's built-in connection handling opens one connection per thread and reuses it for the lifetime of the request. For most deployments this is sufficient.

For high-concurrency workloads, consider:

**PgBouncer** (PostgreSQL only): A connection pooler that sits between Django and PostgreSQL. Configure in `transaction` mode for the best scalability.

**SQL Server connection pooling**: The ODBC driver manages a connection pool at the OS level. Tune `max_pool_size` and `min_pool_size` in the ODBC connection string via `OPTIONS['extra_params']`:

```python
'OPTIONS': {
    'driver': 'ODBC Driver 18 for SQL Server',
    'extra_params': 'TrustServerCertificate=yes;Min Pool Size=5;Max Pool Size=20',
}
```

**Django persistent connections** (`CONN_MAX_AGE`): Keeps database connections alive between requests within the same thread. Set this in settings:

```python
DATABASES = {
    'default': {
        ...
        'CONN_MAX_AGE': 60,  # seconds; 0 = close after each request
        'CONN_HEALTH_CHECKS': True,  # Django 4.1+: validate before reuse
    }
}
```

Avoid large values of `CONN_MAX_AGE` when using threads — each thread holds its own connection and they do not return to a shared pool.

---

## Primary / Replica Setup

To route read queries to replicas and writes to the primary, use Django's database router.

**Step 1:** Define the replica in `DATABASES`:

```python
DATABASES = {
    'default': {
        'ENGINE': 'mssql',
        'NAME': os.environ['DB_NAME'],
        'HOST': os.environ['DB_HOST'],  # primary
        ...
    },
    'replica': {
        'ENGINE': 'mssql',
        'NAME': os.environ['DB_NAME'],
        'HOST': os.environ['DB_REPLICA_HOST'],
        ...
    }
}
```

**Step 2:** Write a router:

```python
# core/db_router.py
import random


class PrimaryReplicaRouter:
    """Route reads to replica, writes to primary."""

    def db_for_read(self, model, **hints):
        return 'replica'

    def db_for_write(self, model, **hints):
        return 'default'

    def allow_relation(self, obj1, obj2, **hints):
        return True

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        return db == 'default'
```

**Step 3:** Register the router in settings:

```python
DATABASE_ROUTERS = ['core.db_router.PrimaryReplicaRouter']
```

**Step 4:** In views or services, force the primary for reads that must be consistent with a recent write:

```python
MyModel.objects.using('default').get(pk=pk)
```
