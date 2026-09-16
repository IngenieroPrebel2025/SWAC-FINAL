"""
Authorization extension points.

This module provides base classes for implementing RBAC, ABAC,
claims-based, or policy-based authorization. No authorization model
is enforced by default — projects implement what they need.

See docs/security.md for implementation examples.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import TYPE_CHECKING, Any

from rest_framework.permissions import BasePermission

if TYPE_CHECKING:
    from django.http import HttpRequest
    from rest_framework.views import APIView


class BaseProjectPermission(BasePermission, ABC):
    """
    Base permission class for project-specific authorization.

    Subclass this to implement your authorization model (RBAC, ABAC, etc.)
    without modifying business logic or view code.
    """

    @abstractmethod
    def has_permission(self, request: "HttpRequest", view: "APIView") -> bool:
        """Return True if the request should be permitted."""
        raise NotImplementedError

    def has_object_permission(
        self, request: "HttpRequest", view: "APIView", obj: Any
    ) -> bool:
        """Return True if the request should be permitted for obj."""
        return self.has_permission(request, view)


class AllowAnyPermission(BaseProjectPermission):
    """Allows all requests. Default when no auth is configured."""

    def has_permission(self, request: "HttpRequest", view: "APIView") -> bool:
        return True


class IsAuthenticatedPermission(BaseProjectPermission):
    """
    Placeholder for authenticated-user-only access.

    Projects implementing authentication should replace this with
    a check against their user model's is_authenticated property.
    """

    def has_permission(self, request: "HttpRequest", view: "APIView") -> bool:
        return bool(request.user and request.user.is_authenticated)


class HasRolePermission(BaseProjectPermission):
    """
    RBAC stub. Subclass and set `required_roles` to implement role checks.

    Example:
        class AdminOnlyPermission(HasRolePermission):
            required_roles = ['admin']
    """

    required_roles: list[str] = []

    def has_permission(self, request: "HttpRequest", view: "APIView") -> bool:
        if not request.user or not request.user.is_authenticated:
            return False
        user_roles = getattr(request.user, "roles", [])
        return any(role in user_roles for role in self.required_roles)


class HasClaimPermission(BaseProjectPermission):
    """
    Claims-based authorization stub.

    Checks that the authenticated user has a specific claim/scope,
    as provided by OAuth2, Keycloak, or Azure Entra ID tokens.
    """

    required_claim: str = ""
    required_value: Any = True

    def has_permission(self, request: "HttpRequest", view: "APIView") -> bool:
        if not request.user or not request.user.is_authenticated:
            return False
        claims = getattr(request.user, "claims", {})
        return claims.get(self.required_claim) == self.required_value


class PolicyPermission(BaseProjectPermission):
    """
    Policy-based authorization base.

    Override `evaluate_policy()` to implement attribute-based access control
    (ABAC) or any custom policy logic.
    """

    def evaluate_policy(self, request: "HttpRequest", view: "APIView", obj: Any = None) -> bool:
        """Override this method to implement your authorization policy."""
        raise NotImplementedError("Subclasses must implement evaluate_policy()")

    def has_permission(self, request: "HttpRequest", view: "APIView") -> bool:
        try:
            return self.evaluate_policy(request, view)
        except NotImplementedError:
            return False

    def has_object_permission(
        self, request: "HttpRequest", view: "APIView", obj: Any
    ) -> bool:
        try:
            return self.evaluate_policy(request, view, obj)
        except NotImplementedError:
            return False
