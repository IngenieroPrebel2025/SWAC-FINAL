# Security Guide

## Overview

This template follows OWASP recommendations out of the box. This document describes what is implemented, how to extend it, and how to integrate authentication and authorization.

---

## Security Headers

Configured in `core/middleware/security.py` and Django settings:

| Header | Value | Purpose |
|---|---|---|
| `X-Content-Type-Options` | `nosniff` | Prevent MIME sniffing |
| `X-Frame-Options` | `DENY` | Clickjacking protection |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Control referrer info |
| `Permissions-Policy` | `geolocation=(), microphone=(), camera=()` | Disable browser features |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | HSTS (production only) |

Django's built-in `SecurityMiddleware` also adds:
- `SECURE_CONTENT_TYPE_NOSNIFF`
- `SECURE_BROWSER_XSS_FILTER`
- HTTPS redirect (production)

---

## OWASP Top 10 Coverage

| Threat | Mitigation |
|---|---|
| A01 Broken Access Control | Authorization extension points in `core/auth/permissions.py` |
| A02 Cryptographic Failures | No secrets hardcoded; HTTPS enforced in production; HSTS enabled |
| A03 Injection | Django ORM prevents SQL injection; input validated at boundaries |
| A04 Insecure Design | Clean Architecture; business logic separated from HTTP layer |
| A05 Security Misconfiguration | Layered settings; prod settings enforce all security flags |
| A06 Vulnerable Components | `pip-audit` in CI; pre-commit Bandit scanning |
| A07 Auth & Session Failures | No auth by default — projects integrate vetted providers |
| A08 Software Integrity | GitHub Actions CI validates every merge |
| A09 Logging & Monitoring | Structured JSON logs with correlation IDs; health endpoints |
| A10 SSRF | `is_safe_url()` in `core/security/validators.py`; no user-controlled URLs |

---

## CORS

Configuration in `core/config/settings/base.py`:

```python
CORS_ALLOW_ALL_ORIGINS = False          # Never True in production
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = [...]            # Read from CORS_ALLOWED_ORIGINS env var
CORS_EXPOSE_HEADERS = ['X-Correlation-ID', 'X-Request-ID']
```

Development overrides `CORS_ALLOW_ALL_ORIGINS = True` for convenience.

**Production rule:** Set `CORS_ALLOWED_ORIGINS` env var explicitly. Never use wildcard.

---

## Rate Limiting

Two layers:

1. **DRF throttles** (`core/ratelimit/throttles.py`) — per-view, applied by DRF before view logic:
   - `GlobalAnonThrottle` — 100 req/hour by default
   - `GlobalUserThrottle` — 1000 req/hour by default
   - Override per view with `throttle_classes` and `throttle_scope`

2. **Middleware** (`core/ratelimit/middleware.py`) — IP-based, disabled by default:
   - Enable with `MIDDLEWARE_RATE_LIMIT_ENABLED=True`
   - Covers non-DRF views (admin, custom endpoints)

Configure rates in settings:
```python
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_RATES': {
        'anon_global': '100/hour',
        'user_global': '1000/hour',
        'burst': '60/minute',
    }
}
```

---

## Input Validation

Validation helpers in `core/security/validators.py`:

```python
from core.security.validators import validate_uuid, validate_file_upload, sanitize_filename, is_safe_url

# Validate UUID path parameters
validate_uuid(pk)  # raises ValidationError on invalid

# Validate file uploads
validate_file_upload(file, allowed_types=['image/jpeg', 'image/png'], max_size=5_000_000)

# Sanitize filenames (prevent path traversal)
safe_name = sanitize_filename(uploaded_file.name)

# Prevent open redirects
if not is_safe_url(next_url, allowed_hosts=request.get_host()):
    raise SuspiciousOperation
```

Request size is capped by `MAX_UPLOAD_SIZE` (default 10 MiB) enforced in `core/middleware/security.py`. Requests exceeding this limit receive `413 Request Entity Too Large`.

---

## Secrets Management

**Never hardcode secrets.** The settings layer raises `KeyError` at startup if `DJANGO_SECRET_KEY` is missing from the environment:

```python
SECRET_KEY = os.environ['DJANGO_SECRET_KEY']  # Intentionally no default
```

Supported secrets sources (ordered by security level):

| Source | How | When to use |
|---|---|---|
| Environment variables | `export VAR=value` | Development, CI |
| `.env` file | `cp .env.example .env` | Local development only |
| Kubernetes Secrets | `envFrom.secretRef` | Production (k8s) |
| Azure Key Vault | CSI driver or `azure-keyvault-secrets` | Production (Azure) |
| AWS Secrets Manager | External Secrets Operator | Production (AWS) |
| Docker Secrets | `docker secret create` | Docker Swarm |

---

## Authentication Integration

This template ships with **no authentication implementation**. The abstraction layer (`core/auth/backends.py`) provides the interface — projects implement what they need.

### Keycloak (recommended for enterprise SSO)

```bash
pip install python-keycloak django-allauth
```

```python
# apps/yourapp/auth.py
from keycloak import KeycloakOpenID
from core.auth.backends import BaseAuthenticationBackend

class KeycloakBackend(BaseAuthenticationBackend):
    def authenticate(self, request, token=None):
        keycloak = KeycloakOpenID(server_url=..., client_id=..., realm_name=...)
        user_info = keycloak.userinfo(token)
        return User.objects.get_or_create(email=user_info['email'])[0]

    def get_user(self, user_id):
        return User.objects.filter(pk=user_id).first()
```

### Azure Entra ID (Azure AD)

```bash
pip install msal
```

```python
# core/auth/azure.py
import msal
from rest_framework.authentication import BaseAuthentication

class AzureADAuthentication(BaseAuthentication):
    def authenticate(self, request):
        token = request.headers.get('Authorization', '').removeprefix('Bearer ')
        if not token:
            return None
        result = msal.ConfidentialClientApplication(...).acquire_token_on_behalf_of(...)
        user = self._get_or_create_user(result)
        return (user, token)
```

### JWT (djangorestframework-simplejwt)

```bash
pip install djangorestframework-simplejwt
```

```python
# settings.py
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
}
```

### Auth0 / OAuth2

```bash
pip install social-auth-app-django
```

Follow the `python-social-auth` documentation to configure the Auth0 backend.

---

## Authorization Extension Points

Authorization is intentionally not enforced. Use `core/auth/permissions.py` as the base:

### RBAC (Role-Based)

```python
from core.auth.permissions import HasRolePermission

class AdminOnlyPermission(HasRolePermission):
    required_roles = ['admin']

class EditorPermission(HasRolePermission):
    required_roles = ['admin', 'editor']
```

### ABAC (Attribute-Based / Policy)

```python
from core.auth.permissions import PolicyPermission

class OwnerOnlyPermission(PolicyPermission):
    def evaluate_policy(self, request, view, obj=None):
        if obj is None:
            return request.user.is_authenticated
        return obj.owner_id == request.user.id
```

### Claims-Based (OAuth2 / OIDC scopes)

```python
from core.auth.permissions import HasClaimPermission

class ReadScopePermission(HasClaimPermission):
    required_claim = 'scope'
    required_value = 'api:read'
```

---

## Security Scanning

```bash
# Static analysis (secrets, unsafe calls)
bandit -r . -c pyproject.toml

# Dependency vulnerabilities
pip-audit

# Both run automatically in GitHub Actions CI
```

Pre-commit hooks run Bandit on every commit. CI fails if any high-severity issues are found.

---

## SQL Injection Prevention

- Always use the Django ORM — never raw string formatting in queries
- If raw SQL is unavoidable, use parameterized queries:

```python
# GOOD
MyModel.objects.raw('SELECT * FROM table WHERE id = %s', [user_id])

# BAD — never do this
MyModel.objects.raw(f'SELECT * FROM table WHERE id = {user_id}')
```

---

## File Upload Security

```python
from core.security.validators import validate_file_upload, sanitize_filename

class FileUploadView(APIView):
    def post(self, request):
        file = request.FILES.get('file')
        validate_file_upload(
            file,
            allowed_types=['image/jpeg', 'image/png', 'application/pdf'],
            max_size=10_000_000,  # 10 MB
        )
        safe_name = sanitize_filename(file.name)
        # Store file using safe_name
```

---

## Production Checklist

Before going live, verify:

- [ ] `DJANGO_SECRET_KEY` is a random 50+ character string (not the dev key)
- [ ] `DEBUG=False`
- [ ] `ALLOWED_HOSTS` is set to your domain(s) only
- [ ] `CORS_ALLOWED_ORIGINS` is set to your frontend domain(s) only
- [ ] HTTPS is enforced (`SECURE_SSL_REDIRECT=True` or load balancer TLS termination)
- [ ] HSTS is enabled
- [ ] Database credentials are in Kubernetes Secrets or vault
- [ ] `pip-audit` shows no known vulnerabilities
- [ ] `bandit` shows no high-severity findings
