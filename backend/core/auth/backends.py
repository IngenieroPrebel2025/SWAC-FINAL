"""
Authentication abstraction layer.

This template ships with NO authentication implementation by default.
Projects should subclass BaseAuthenticationBackend to integrate their
chosen provider (Keycloak, Azure Entra ID, Auth0, JWT, LDAP, etc.)
without touching business logic.

Usage:
    1. Subclass BaseAuthenticationBackend
    2. Implement authenticate() and get_user()
    3. Add your backend to AUTHENTICATION_BACKENDS in settings
    4. Set DEFAULT_AUTHENTICATION_CLASSES in REST_FRAMEWORK settings

See docs/security.md for integration examples.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from django.http import HttpRequest


class BaseAuthenticationBackend(ABC):
    """
    Abstract base for pluggable authentication providers.

    Subclass this to implement any authentication mechanism without
    coupling the rest of the codebase to a specific provider.
    """

    @abstractmethod
    def authenticate(self, request: "HttpRequest", **credentials: Any) -> Any | None:
        """
        Validate credentials and return a User instance, or None if invalid.

        Args:
            request: The current HTTP request.
            **credentials: Provider-specific credentials (e.g., token=, username=, password=).

        Returns:
            Authenticated user instance or None.
        """
        raise NotImplementedError

    @abstractmethod
    def get_user(self, user_id: Any) -> Any | None:
        """
        Return the user with the given primary key, or None.

        Called by Django's authentication machinery after session-based login.
        """
        raise NotImplementedError


class NoOpAuthenticationBackend(BaseAuthenticationBackend):
    """
    Passthrough backend used when no authentication is configured.

    This backend always returns None, effectively making all requests
    anonymous. Projects that require authentication should replace or
    supplement this with a real backend.
    """

    def authenticate(self, request: "HttpRequest", **credentials: Any) -> None:
        return None

    def get_user(self, user_id: Any) -> None:
        return None
