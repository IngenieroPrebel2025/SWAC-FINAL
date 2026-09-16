# Logging Guide

## Structure

All logs are structured JSON, one object per line. Each record includes:

| Field | Description | Example |
|---|---|---|
| `timestamp` | ISO 8601 UTC | `2025-01-15T10:23:45.123456Z` |
| `level` | Log level | `INFO` |
| `logger` | Logger name | `core.middleware.logging` |
| `message` | Log message | `GET /api/v1/users/ 200 45ms` |
| `correlation_id` | Per-request UUID (from `X-Correlation-ID` header or generated) | `a1b2c3d4-...` |
| `request_id` | Per-request UUID (from `X-Request-ID` header or generated) | `e5f6g7h8-...` |
| `module` | Python module | `logging` |
| `funcName` | Function name | `__call__` |
| `lineno` | Line number | `42` |
| `exc_info` | Exception traceback (if present) | `"Traceback (most recent call last):..."` |

Extra fields passed via `extra={}` are merged in at the top level.

---

## Configuration

`core/config/settings/base.py` defines the LOGGING dict with:

- **`JsonFormatter`** — produces single-line JSON with all fields above
- **`CorrelationIdFilter`** — injects `correlation_id` and `request_id` into every record from `threading.local`
- **`SensitiveDataFilter`** — redacts passwords, tokens, keys, secrets from log messages

Development settings replace the JSON handler with a human-readable console formatter for easier local debugging.

---

## Writing Logs

```python
import logging

logger = logging.getLogger(__name__)

# Simple message
logger.info("Processing order %s", order_id)

# With structured extra fields (merged into JSON output)
logger.info(
    "Order created",
    extra={
        "order_id": str(order.id),
        "total": float(order.total),
        "customer_id": str(order.customer_id),
    }
)

# Warning with context
logger.warning("Slow query detected", extra={"duration_ms": 1500, "query": "..."})

# Error with exception
try:
    payment.charge()
except PaymentError as exc:
    logger.error("Payment failed", exc_info=True, extra={"order_id": str(order.id)})
```

---

## Log Levels

| Level | Use for |
|---|---|
| `DEBUG` | Detailed diagnostic info; enabled in development only |
| `INFO` | Normal operations (request completed, record created, service started) |
| `WARNING` | Unexpected but recoverable (slow query, deprecated field, retry) |
| `ERROR` | Operation failed; intervention may be needed (payment error, external API down) |
| `CRITICAL` | System cannot continue (DB unreachable, config missing) |

---

## Correlation IDs

Every request gets a `correlation_id` and `request_id` automatically:

- **Source**: `X-Correlation-ID` request header (or UUID4 generated if missing)
- **Storage**: `threading.local()` — available globally within the request lifecycle
- **Response**: Both IDs echoed back in response headers

Access them in code:

```python
from core.middleware.correlation import get_correlation_id, get_request_id

correlation_id = get_correlation_id()  # '' if called outside a request
request_id = get_request_id()
```

All error responses include them in `meta.correlation_id` and `meta.request_id`.

---

## Sensitive Data Redaction

`SensitiveDataFilter` (`core/logging/filters.py`) automatically redacts values for these keys:

- `password`, `passwd`
- `token`, `access_token`, `refresh_token`
- `secret`, `secret_key`
- `key`, `api_key`
- `authorization`, `Authorization`

The filter handles `key=value`, `"key": "value"`, and `Authorization: Bearer ...` patterns.

**Do not log sensitive data manually.** Use the filter as a safety net, not a primary control.

---

## External Log Aggregation

### ELK Stack (Elasticsearch / Logstash / Kibana)

Configure a Filebeat sidecar to ship logs from stdout to Logstash:

```yaml
# filebeat.yml
filebeat.inputs:
  - type: container
    paths: ['/var/log/containers/*.log']
    processors:
      - decode_json_fields:
          fields: ["message"]
          target: ""
output.logstash:
  hosts: ["logstash:5044"]
```

### Azure Monitor / Log Analytics

Use the `azure-monitor-opentelemetry` package:

```bash
pip install azure-monitor-opentelemetry
```

```python
# core/config/settings/production.py
from azure.monitor.opentelemetry import configure_azure_monitor
configure_azure_monitor(connection_string=os.environ['APPLICATIONINSIGHTS_CONNECTION_STRING'])
```

### Datadog

```bash
pip install ddtrace
```

```bash
# Run with Datadog agent
DD_SERVICE=django-backend DD_ENV=production ddtrace-run gunicorn ...
```

### AWS CloudWatch

Use the `watchtower` library:

```bash
pip install watchtower
```

```python
import watchtower, logging

logging.getLogger().addHandler(
    watchtower.CloudWatchLogHandler(log_group='/app/django-backend')
)
```

---

## Request Logging

`core/middleware/logging.py` logs every request/response automatically:

**Request log fields:**
- `method`, `path`, `query_string` (sanitized — removes password/token/key params)
- `ip_address` (honours `X-Forwarded-For`)
- `user_agent`
- `correlation_id`, `request_id`

**Response log fields:**
- `status_code`
- `duration_ms`

Health check endpoints (`/health/`, `/health/live`, `/health/ready`) are excluded to reduce noise.

---

## Disabling Logs in Tests

Testing settings suppress all logging:

```python
# core/config/settings/testing.py
LOGGING = {
    'version': 1,
    'disable_existing_loggers': True,
    'handlers': {},
    'root': {'handlers': [], 'level': 'CRITICAL'},
}
```

To enable logging in a specific test:

```python
import logging

def test_something_with_logging(caplog):
    with caplog.at_level(logging.INFO, logger='apps.myapp'):
        # your test
        assert 'expected message' in caplog.text
```
