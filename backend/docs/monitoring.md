# Monitoring Guide

## Health Endpoints

Three endpoints are provided for Kubernetes probes and external monitoring:

| Endpoint | Purpose | Expected response |
|---|---|---|
| `GET /health/` | General status | `200 {"status": "ok", "service": "...", "version": "..."}` |
| `GET /health/live` | Liveness probe | `200 {"status": "alive"}` |
| `GET /health/ready` | Readiness probe | `200 {"status": "ready", "checks": {"database": "ok", "cache": "ok"}}` or `503` |

All health endpoints bypass authentication and rate limiting.

### Readiness check logic

`GET /health/ready` performs:
1. **Database**: executes `SELECT 1` via Django's ORM connection
2. **Cache**: sets and reads a test key `__health_check__`

Returns `503 Service Unavailable` if either check fails, with details in the response body. Kubernetes will stop routing traffic to the pod until it recovers.

---

## Kubernetes Probe Configuration

The deployment manifest (`k8s/base/deployment.yaml`) configures all three probe types:

```yaml
livenessProbe:
  httpGet:
    path: /health/live
    port: 8000
  initialDelaySeconds: 30
  periodSeconds: 10
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /health/ready
    port: 8000
  initialDelaySeconds: 10
  periodSeconds: 5
  failureThreshold: 3

startupProbe:
  httpGet:
    path: /health/live
    port: 8000
  failureThreshold: 30
  periodSeconds: 5
```

The startup probe gives the container up to 150 seconds to become live before Kubernetes considers it failed — enough time for migrations or slow cold starts.

---

## Prometheus Metrics

To expose Prometheus metrics, add `django-prometheus`:

```bash
pip install django-prometheus
```

```python
# settings.py
INSTALLED_APPS += ['django_prometheus']

MIDDLEWARE = [
    'django_prometheus.middleware.PrometheusBeforeMiddleware',
    # ... existing middleware ...
    'django_prometheus.middleware.PrometheusAfterMiddleware',
]
```

```python
# urls.py
from django_prometheus import exports

urlpatterns += [
    path('metrics/', exports.ExportToDjangoView, name='prometheus-metrics'),
]
```

Key metrics exposed:
- `django_http_requests_total` — request count by method/view/status
- `django_http_request_duration_seconds` — latency histogram
- `django_db_execute_total` — DB query count
- `django_cache_get_total`, `django_cache_miss_total` — cache metrics

### Prometheus scrape config

```yaml
# prometheus.yml
scrape_configs:
  - job_name: django-backend
    static_configs:
      - targets: ['backend-service:80']
    metrics_path: /metrics/
```

---

## OpenTelemetry (Optional)

For distributed tracing across microservices:

```bash
pip install opentelemetry-sdk opentelemetry-instrumentation-django opentelemetry-exporter-otlp
```

```python
# core/config/telemetry.py
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.django import DjangoInstrumentor

def configure_tracing():
    provider = TracerProvider()
    provider.add_span_processor(
        BatchSpanProcessor(OTLPSpanExporter(endpoint=os.environ.get('OTEL_EXPORTER_OTLP_ENDPOINT')))
    )
    trace.set_tracer_provider(provider)
    DjangoInstrumentor().instrument()
```

Call `configure_tracing()` in your WSGI/ASGI entrypoint.

---

## Key Metrics to Monitor

### Application

| Metric | Alert threshold | Action |
|---|---|---|
| HTTP 5xx error rate | > 1% of requests | Investigate logs, check DB/cache |
| HTTP 4xx error rate | > 10% | Check client errors, auth issues |
| P95 response latency | > 500ms | Check slow queries, N+1 issues |
| Readiness probe failures | Any | Check DB connectivity and cache |

### Infrastructure

| Metric | Alert threshold |
|---|---|
| Pod CPU usage | > 80% sustained |
| Pod memory usage | > 80% of limit |
| Database connection pool saturation | > 90% |
| Cache hit rate | < 80% |
| HPA pod count at max | Sustained at maximum |

---

## Alerting Recommendations

### Kubernetes alerts (Prometheus Alertmanager)

```yaml
groups:
  - name: django-backend
    rules:
      - alert: HighErrorRate
        expr: rate(django_http_responses_total{status=~"5.."}[5m]) > 0.01
        for: 2m
        annotations:
          summary: High 5xx error rate

      - alert: PodNotReady
        expr: kube_pod_status_ready{namespace="backend-prod"} == 0
        for: 1m
        annotations:
          summary: Pod is not ready

      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(django_http_request_duration_seconds_bucket[5m])) > 0.5
        for: 5m
        annotations:
          summary: P95 latency exceeds 500ms
```

---

## Sentry Integration (Error Tracking)

```bash
pip install sentry-sdk[django]
```

Already included in `requirements/production.txt`. Configure via env var:

```bash
SENTRY_DSN=https://your-key@sentry.io/project-id
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1
```

```python
# core/config/settings/production.py
import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration

sentry_sdk.init(
    dsn=os.environ.get('SENTRY_DSN'),
    integrations=[DjangoIntegration()],
    traces_sample_rate=float(os.environ.get('SENTRY_TRACES_SAMPLE_RATE', '0.1')),
    environment=os.environ.get('SENTRY_ENVIRONMENT', 'production'),
    send_default_pii=False,
)
```
