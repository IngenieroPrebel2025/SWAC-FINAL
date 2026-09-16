# Deployment

This document covers pre-deployment checks, Docker, Kubernetes, Helm, secrets management, zero-downtime strategies, rollback, and health check integration.

---

## Table of Contents

1. [Pre-deployment Checklist](#pre-deployment-checklist)
2. [Docker Deployment](#docker-deployment)
3. [Kubernetes Deployment](#kubernetes-deployment)
4. [Helm Chart Deployment](#helm-chart-deployment)
5. [Environment Variables Reference](#environment-variables-reference)
6. [Secrets Management](#secrets-management)
7. [Zero-downtime Deployments](#zero-downtime-deployments)
8. [Rollback Procedure](#rollback-procedure)
9. [Database Migrations in Production](#database-migrations-in-production)
10. [Health Check Integration](#health-check-integration)

---

## Pre-deployment Checklist

Complete every item before deploying to staging or production.

**Security**

- [ ] `DJANGO_SECRET_KEY` is a cryptographically random string (at least 50 characters), never the development default
- [ ] `DJANGO_DEBUG=False`
- [ ] `DJANGO_ALLOWED_HOSTS` lists only the actual domain names serving traffic
- [ ] `CORS_ALLOWED_ORIGINS` lists only approved frontend origins (no wildcards)
- [ ] `CORS_ALLOW_ALL_ORIGINS = False` (enforced by production settings)
- [ ] All secrets are in a secrets manager or Kubernetes Secret — not in ConfigMaps or source code

**Database**

- [ ] Migrations have been generated for all model changes (`python manage.py makemigrations --check`)
- [ ] Migrations have been reviewed for large-table operations that may lock the table
- [ ] The migration job runs successfully against the target database before the new image is deployed

**Application**

- [ ] `python manage.py collectstatic --noinput` has been run and static files are accessible
- [ ] All environment variables listed below are present in the deployment environment
- [ ] The container image was built from the tagged commit being deployed (not `latest` in production)
- [ ] The image has been scanned for vulnerabilities (`docker scout` or equivalent)

**Infrastructure**

- [ ] Redis is reachable and `REDIS_URL` is set correctly
- [ ] Database is reachable and credentials are valid
- [ ] Health check endpoints respond correctly: `/health/live` (200) and `/health/ready` (200)
- [ ] Ingress TLS certificates are valid and not expiring within 30 days
- [ ] HPA is configured and the cluster has sufficient headroom to scale

---

## Docker Deployment

### Build the image

```bash
docker build \
  --build-arg BUILD_DATE=$(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --build-arg GIT_COMMIT=$(git rev-parse --short HEAD) \
  -t myregistry.example.com/django-backend:1.2.3 \
  .
```

### Push to a registry

```bash
docker push myregistry.example.com/django-backend:1.2.3
```

### Run with Docker Compose (staging-like)

```bash
# Create a production-style .env
cp .env.example .env.production
# Edit .env.production: set real SECRET_KEY, DB credentials, REDIS_URL, etc.

docker compose --env-file .env.production up -d
```

### Run migrations before starting

```bash
docker run --rm \
  --env-file .env.production \
  myregistry.example.com/django-backend:1.2.3 \
  python manage.py migrate --noinput
```

### Collect static files

```bash
docker run --rm \
  --env-file .env.production \
  myregistry.example.com/django-backend:1.2.3 \
  python manage.py collectstatic --noinput
```

Static files are served by WhiteNoise directly from Gunicorn — no separate Nginx required for static file serving.

---

## Kubernetes Deployment

### Prerequisites

- Kubernetes cluster (AKS, EKS, GKE, or local) with `kubectl` access
- Container registry accessible from the cluster (image pull secret or managed identity)
- `kubectl` >= 1.28
- `kustomize` (bundled with `kubectl` >= 1.14)

### Namespace

The base manifests create a `backend` namespace:

```bash
kubectl apply -f k8s/base/namespace.yaml
```

### Substitute image references

The deployment manifest uses placeholder variables. Substitute them before applying:

```bash
# Using envsubst
export IMAGE_REGISTRY=myregistry.example.com
export IMAGE_TAG=1.2.3
envsubst < k8s/base/deployment.yaml | kubectl apply -f -
```

Or configure a Kustomize image transformer in an overlay.

### Apply base manifests

```bash
kubectl apply -k k8s/base/
```

This creates: Namespace, ServiceAccount, ConfigMap, Secrets template, Deployment, Service, Ingress, HPA.

### Apply an environment overlay

```bash
# Production overlay (you must create k8s/overlays/production/)
kubectl apply -k k8s/overlays/production/
```

### Verify the deployment

```bash
# Watch pods roll out
kubectl -n backend rollout status deployment/django-backend

# Check pod status
kubectl -n backend get pods -l app.kubernetes.io/name=django-backend

# Check logs
kubectl -n backend logs -l app.kubernetes.io/name=django-backend --tail=100 -f

# Describe a pod (events, resource usage)
kubectl -n backend describe pod <pod-name>
```

### Rollout management

```bash
# Trigger a rolling restart (e.g., to pick up a new Secret value)
kubectl -n backend rollout restart deployment/django-backend

# Pause a rollout
kubectl -n backend rollout pause deployment/django-backend

# Resume a rollout
kubectl -n backend rollout resume deployment/django-backend
```

---

## Helm Chart Deployment

The Helm chart lives in `k8s/helm/` (if added to the project). The base manifests can be converted to a Helm chart for teams that prefer Helm's templating and release management.

```bash
# Install (first deployment)
helm install backend k8s/helm/ \
  --namespace backend \
  --create-namespace \
  -f k8s/helm/values.yaml \
  --set image.tag=1.2.3

# Upgrade (subsequent deployments)
helm upgrade backend k8s/helm/ \
  --namespace backend \
  -f k8s/helm/values.yaml \
  --set image.tag=1.2.3

# Rollback to the previous release
helm rollback backend

# Uninstall
helm uninstall backend --namespace backend

# List releases
helm list --namespace backend
```

---

## Environment Variables Reference

See the [README environment table](../README.md#environment-configuration) for the full list. Required variables in production:

| Variable | Notes |
|---|---|
| `DJANGO_SETTINGS_MODULE` | Must be `core.config.settings.production` |
| `DJANGO_SECRET_KEY` | Long random string — use a secrets manager |
| `DJANGO_ALLOWED_HOSTS` | Comma-separated production hostnames |
| `DB_NAME`, `DB_HOST`, `DB_USER`, `DB_PASSWORD` | SQL Server credentials |
| `REDIS_URL` | Full Redis connection URL |
| `CORS_ALLOWED_ORIGINS` | Comma-separated frontend origins |

---

## Secrets Management

Never store secrets (passwords, API keys, secret keys) in:
- Source code or `.env` files committed to version control
- Kubernetes `ConfigMap` resources (these are not encrypted at rest)
- Container image layers

### Kubernetes Secrets

```bash
# Create a secret from literal values
kubectl -n backend create secret generic django-backend-secret \
  --from-literal=DJANGO_SECRET_KEY="$(openssl rand -base64 50)" \
  --from-literal=DB_PASSWORD="YourStrongPassword" \
  --from-literal=REDIS_URL="redis://redis-service:6379/0"
```

The `deployment.yaml` references this secret via `secretRef`:

```yaml
envFrom:
  - configMapRef:
      name: django-backend-config
  - secretRef:
      name: django-backend-secret
```

Enable `EncryptionConfiguration` in Kubernetes to encrypt Secrets at rest.

### Azure Key Vault

For AKS deployments, use the [Secrets Store CSI Driver](https://secrets-store-csi-driver.sigs.k8s.io/) with the Azure provider:

```yaml
# Mount secrets from Key Vault as environment variables
volumes:
  - name: secrets-store
    csi:
      driver: secrets-store.csi.k8s.io
      readOnly: true
      volumeAttributes:
        secretProviderClass: django-backend-azure-kv
```

### AWS Secrets Manager

For EKS, use the [AWS Secrets and Configuration Provider (ASCP)](https://docs.aws.amazon.com/secretsmanager/latest/userguide/integrating_csi_driver.html) or External Secrets Operator.

### HashiCorp Vault

Use the [Vault Agent Injector](https://developer.hashicorp.com/vault/docs/platform/k8s/injector) to inject secrets as environment variables or files into the pod.

---

## Zero-downtime Deployments

The Kubernetes `Deployment` is already configured for zero-downtime rolling updates:

```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 1        # One extra pod spun up before old pod is terminated
    maxUnavailable: 0  # No pods removed until new pods are healthy
```

Combined with the liveness and readiness probes:

```yaml
livenessProbe:
  httpGet:
    path: /health/live
    port: http
  initialDelaySeconds: 30
  periodSeconds: 10
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /health/ready
    port: http
  initialDelaySeconds: 10
  periodSeconds: 5
  failureThreshold: 3
```

Kubernetes will not route traffic to a new pod until `/health/ready` returns `200`. The old pod continues serving traffic while the new pod starts.

**Graceful shutdown:** The `terminationGracePeriodSeconds: 60` setting gives Gunicorn 60 seconds to finish in-flight requests before the pod is forcibly killed. Gunicorn handles `SIGTERM` gracefully by default.

**In-flight request protection:** Gunicorn's `--timeout 120` covers requests that take up to two minutes. Adjust based on your expected maximum request duration.

---

## Rollback Procedure

### Kubernetes rollback

```bash
# View rollout history
kubectl -n backend rollout history deployment/django-backend

# Roll back to the previous version
kubectl -n backend rollout undo deployment/django-backend

# Roll back to a specific revision
kubectl -n backend rollout undo deployment/django-backend --to-revision=3

# Verify the rollback
kubectl -n backend rollout status deployment/django-backend
```

### Database rollback

Django migrations are not automatically reversible. Before applying a migration that drops a column or table in production, verify the rollback plan:

```bash
# Check if the migration is reversible
python manage.py migrate <app_name> <previous_migration_number>
```

For destructive migrations (removing columns, tables, or constraints), prefer a two-phase approach:
1. **Phase 1:** Deploy code that no longer reads/writes the column, but leave the column in the database.
2. **Phase 2 (later):** Deploy the migration that drops the column.

---

## Database Migrations in Production

**Rule: migrations run before the new application version is deployed, never during startup.**

### Using a Kubernetes Job

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: django-migrate-v1-2-3
  namespace: backend
  labels:
    app.kubernetes.io/name: django-backend
    app.kubernetes.io/component: migration
spec:
  backoffLimit: 0      # Fail immediately on error, do not retry
  activeDeadlineSeconds: 300
  template:
    spec:
      restartPolicy: Never
      serviceAccountName: django-backend
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

Apply and wait for completion:

```bash
kubectl apply -f migrate-job.yaml
kubectl -n backend wait --for=condition=complete job/django-migrate-v1-2-3 --timeout=300s
```

Only proceed with the `Deployment` rollout after the job completes successfully.

---

## Health Check Integration

### Endpoints

| Endpoint | Purpose | Expected response |
|---|---|---|
| `GET /health/` | General liveness — always responds | `{"status": "ok", "service": "...", "version": "...", "timestamp": "..."}` |
| `GET /health/live` | Kubernetes liveness probe | `{"status": "alive"}` |
| `GET /health/ready` | Kubernetes readiness probe | `{"status": "ready", "checks": {"database": "ok", "cache": "ok"}}` |

The readiness probe returns `503` if the database or cache check fails. Kubernetes removes the pod from the load balancer endpoints until the probe recovers.

### Load balancer configuration

Configure your load balancer (ALB, Azure Application Gateway, Nginx) to send health probes to `/health/` or `/health/ready`.

Example AWS ALB target group health check:

```
Health check path: /health/
Healthy threshold: 2
Unhealthy threshold: 3
Timeout: 10 seconds
Interval: 30 seconds
Success codes: 200
```

### Ingress health check passthrough

Ensure the ingress configuration does not apply authentication or rate limiting to health endpoints. The health views already have `authentication_classes = []` and `permission_classes = []`, but middleware-level blocks (e.g., IP allowlists) must also be bypassed for probe IPs.
