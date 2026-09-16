"""
Security middleware.

Responsibilities
----------------
1. Enforce a maximum upload size — reject oversized request bodies with 413.
2. Inject hardened security headers on every response.
3. Set ``Cache-Control: no-store`` on API responses (paths starting with
   ``/api/``).  Static-file responses are left untouched.

Note
----
Content-Security-Policy is intentionally omitted here; use ``django-csp`` or
``django-security`` for full CSP management.
"""

from __future__ import annotations

from collections.abc import Callable

from django.conf import settings
from django.http import HttpRequest, HttpResponse

__all__ = ["SecurityMiddleware"]

# ---------------------------------------------------------------------------
# Defaults (can be overridden via Django settings)
# ---------------------------------------------------------------------------

_DEFAULT_MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10 MiB

# Paths whose responses should receive Cache-Control: no-store.
_API_PREFIXES: tuple[str, ...] = ("/api/",)

# Paths that serve static assets — Cache-Control is NOT added for these.
_STATIC_PREFIXES: tuple[str, ...] = (
    getattr(settings, "STATIC_URL", "/static/"),
    getattr(settings, "MEDIA_URL", "/media/"),
)


# ---------------------------------------------------------------------------
# Middleware
# ---------------------------------------------------------------------------


class SecurityMiddleware:
    """Add security headers and enforce request-body size limits."""

    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]) -> None:
        self.get_response = get_response
        self._max_upload_size: int = getattr(
            settings, "MAX_UPLOAD_SIZE", _DEFAULT_MAX_UPLOAD_SIZE
        )

    # ------------------------------------------------------------------
    # WSGI __call__
    # ------------------------------------------------------------------

    def __call__(self, request: HttpRequest) -> HttpResponse:
        # --- Upload-size guard -------------------------------------------
        content_length_raw: str = request.META.get("CONTENT_LENGTH", "") or "0"
        try:
            content_length = int(content_length_raw)
        except ValueError:
            content_length = 0

        if content_length > self._max_upload_size:
            return HttpResponse(
                "Request body too large.",
                status=413,
                content_type="text/plain",
            )

        response: HttpResponse = self.get_response(request)

        # --- Security headers --------------------------------------------
        self._add_security_headers(response)

        # --- Cache-Control for API responses -----------------------------
        if self._is_api_path(request.path) and not self._is_static_path(request.path):
            response["Cache-Control"] = "no-store"

        return response

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _add_security_headers(response: HttpResponse) -> None:
        response.setdefault("X-Content-Type-Options", "nosniff")
        response.setdefault("X-Frame-Options", "DENY")
        response.setdefault(
            "Referrer-Policy", "strict-origin-when-cross-origin"
        )
        response.setdefault(
            "Permissions-Policy",
            "geolocation=(), microphone=(), camera=()",
        )

    @staticmethod
    def _is_api_path(path: str) -> bool:
        return any(path.startswith(prefix) for prefix in _API_PREFIXES)

    @staticmethod
    def _is_static_path(path: str) -> bool:
        return any(path.startswith(prefix) for prefix in _STATIC_PREFIXES)
