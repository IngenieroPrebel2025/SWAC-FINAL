"""
Base HTTP client for external service integrations.

``BaseIntegrationClient`` is a thin wrapper around ``httpx.Client`` that
adds:

- Automatic propagation of the ``X-Correlation-ID`` tracing header.
- A structured ``Content-Type: application/json`` default.
- Convenience ``get`` / ``post`` / ``put`` / ``delete`` helpers that decode
  JSON responses and raise ``httpx.HTTPStatusError`` on non-2xx status codes.
- Context-manager support for proper connection cleanup.

Projects should subclass ``BaseIntegrationClient`` for each external service::

    from infrastructure.integrations.base import BaseIntegrationClient

    class PaymentGatewayClient(BaseIntegrationClient):
        base_url = "https://api.payments.example.com"
        timeout = 15

        def charge(self, amount_cents: int, token: str) -> dict:
            return self.post("/v1/charges", {"amount": amount_cents, "token": token})
"""

from __future__ import annotations

import logging
from typing import Any

import httpx

__all__ = ["BaseIntegrationClient"]

logger = logging.getLogger(__name__)


class BaseIntegrationClient:
    """Base HTTP client with correlation-ID propagation and JSON helpers.

    Class attributes (override in subclasses):
        base_url: Base URL for the external service (no trailing slash needed).
        timeout:  Request timeout in seconds.
    """

    base_url: str = ""
    timeout: int = 30

    def __init__(self) -> None:
        self._client = httpx.Client(
            base_url=self.base_url,
            timeout=self.timeout,
            headers=self._get_default_headers(),
        )

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _get_default_headers(self) -> dict[str, str]:
        """Build default headers for every outgoing request."""
        from core.middleware.correlation import get_correlation_id

        return {
            "X-Correlation-ID": get_correlation_id() or "",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

    def _handle_response(self, response: httpx.Response) -> Any:
        """Raise for non-2xx; return parsed JSON or raw text."""
        response.raise_for_status()
        content_type = response.headers.get("content-type", "")
        if "application/json" in content_type:
            return response.json()
        return response.text

    # ------------------------------------------------------------------
    # HTTP verbs
    # ------------------------------------------------------------------

    def get(self, path: str, **kwargs: Any) -> Any:
        """Perform a GET request to *path* and return the decoded response.

        Args:
            path:    URL path relative to ``base_url``.
            **kwargs: Additional arguments forwarded to ``httpx.Client.get``.

        Returns:
            Parsed JSON (dict/list) or raw response text.
        """
        logger.debug("GET %s%s", self.base_url, path)
        response = self._client.get(path, **kwargs)
        return self._handle_response(response)

    def post(self, path: str, data: dict[str, Any], **kwargs: Any) -> Any:
        """Perform a POST request with a JSON body.

        Args:
            path:    URL path relative to ``base_url``.
            data:    Request payload; serialised to JSON.
            **kwargs: Additional arguments forwarded to ``httpx.Client.post``.

        Returns:
            Parsed JSON (dict/list) or raw response text.
        """
        logger.debug("POST %s%s", self.base_url, path)
        response = self._client.post(path, json=data, **kwargs)
        return self._handle_response(response)

    def put(self, path: str, data: dict[str, Any], **kwargs: Any) -> Any:
        """Perform a PUT request with a JSON body.

        Args:
            path:    URL path relative to ``base_url``.
            data:    Request payload; serialised to JSON.
            **kwargs: Additional arguments forwarded to ``httpx.Client.put``.

        Returns:
            Parsed JSON (dict/list) or raw response text.
        """
        logger.debug("PUT %s%s", self.base_url, path)
        response = self._client.put(path, json=data, **kwargs)
        return self._handle_response(response)

    def delete(self, path: str, **kwargs: Any) -> Any:
        """Perform a DELETE request to *path*.

        Args:
            path:    URL path relative to ``base_url``.
            **kwargs: Additional arguments forwarded to ``httpx.Client.delete``.

        Returns:
            Parsed JSON (dict/list) or raw response text.
        """
        logger.debug("DELETE %s%s", self.base_url, path)
        response = self._client.delete(path, **kwargs)
        return self._handle_response(response)

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    def close(self) -> None:
        """Close the underlying HTTP connection pool."""
        self._client.close()

    def __enter__(self) -> "BaseIntegrationClient":
        return self

    def __exit__(self, *args: Any) -> None:
        self.close()
