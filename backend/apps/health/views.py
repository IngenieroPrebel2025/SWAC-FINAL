import os
from datetime import datetime, timezone

from django.conf import settings
from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

# Read service metadata from settings or environment, with safe defaults.
SERVICE_NAME: str = getattr(settings, 'SERVICE_NAME', os.environ.get('SERVICE_NAME', 'django-service'))
VERSION: str = getattr(settings, 'VERSION', os.environ.get('VERSION', '0.1.0'))


class HealthView(APIView):
    """
    GET /health/
    General health check — returns service identity and current timestamp.
    Always returns 200 if the process is running.
    """

    authentication_classes = []
    permission_classes = []

    def get(self, request: Request) -> Response:
        return Response(
            {
                'status': 'ok',
                'service': SERVICE_NAME,
                'version': VERSION,
                'timestamp': datetime.now(tz=timezone.utc).isoformat(),
            },
            status=status.HTTP_200_OK,
        )


class LivenessView(APIView):
    """
    GET /health/live
    Kubernetes liveness probe — returns 200 as long as the process is alive.
    No external dependency checks; a failure here triggers a container restart.
    """

    authentication_classes = []
    permission_classes = []

    def get(self, request: Request) -> Response:
        return Response({'status': 'alive'}, status=status.HTTP_200_OK)


class ReadinessView(APIView):
    """
    GET /health/ready
    Kubernetes readiness probe — verifies that the service can handle traffic.
    Checks database connectivity and cache availability.
    Returns 200 when all checks pass, 503 when any check fails.
    """

    authentication_classes = []
    permission_classes = []

    def get(self, request: Request) -> Response:
        checks: dict[str, str] = {}

        # --- Database check ---
        try:
            from django.db import connection

            with connection.cursor() as cursor:
                cursor.execute('SELECT 1')
            checks['database'] = 'ok'
        except Exception as exc:  # noqa: BLE001
            checks['database'] = f'error: {exc}'

        # --- Cache check ---
        try:
            from django.core.cache import cache

            cache.set('__health_check__', 'ok', timeout=5)
            value = cache.get('__health_check__')
            if value == 'ok':
                checks['cache'] = 'ok'
            else:
                checks['cache'] = 'error: cache read/write mismatch'
        except Exception as exc:  # noqa: BLE001
            checks['cache'] = f'error: {exc}'

        all_ok = all(v == 'ok' for v in checks.values())
        http_status = status.HTTP_200_OK if all_ok else status.HTTP_503_SERVICE_UNAVAILABLE

        return Response(
            {
                'status': 'ready' if all_ok else 'not ready',
                'checks': checks,
            },
            status=http_status,
        )
