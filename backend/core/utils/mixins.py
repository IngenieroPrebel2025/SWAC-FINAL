"""
DRF ViewSet mixins.

``AuditMixin``
    Automatically stamps ``created_by`` / ``updated_by`` on model instances
    when authentication is configured.  When no user is attached to the
    request (anonymous or auth not configured), the stamp is silently skipped.

``SoftDeleteMixin``
    Overrides ``destroy()`` to set ``is_deleted = True`` on the instance
    rather than issuing a SQL ``DELETE``.  Raises ``Http404`` if the model
    does not have an ``is_deleted`` field.
"""

from __future__ import annotations

import logging
from typing import Any

from django.core.exceptions import FieldDoesNotExist
from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response

__all__ = ["AuditMixin", "SoftDeleteMixin"]

logger = logging.getLogger(__name__)


class AuditMixin:
    """Stamp ``created_by`` / ``updated_by`` from the authenticated user.

    Mix this into any ``ModelViewSet`` (or subclass).  The mixin hooks into
    ``perform_create`` and ``perform_update`` — the standard DRF extension
    points — so it is compatible with any serializer or model that exposes
    those fields.

    If the request user is anonymous, unauthenticated, or the model fields
    do not exist, the mixin is a no-op (no exception is raised).
    """

    def _get_user(self) -> Any | None:
        request: Request | None = getattr(self, "request", None)
        if request is None:
            return None
        user = getattr(request, "user", None)
        if user is None or (hasattr(user, "is_authenticated") and not user.is_authenticated):
            return None
        return user

    def perform_create(self, serializer: Any) -> None:  # type: ignore[override]
        user = self._get_user()
        kwargs: dict[str, Any] = {}
        if user is not None:
            instance_class = serializer.Meta.model if hasattr(serializer, "Meta") else None
            if instance_class is not None:
                try:
                    instance_class._meta.get_field("created_by")
                    kwargs["created_by"] = user
                except FieldDoesNotExist:
                    pass
                try:
                    instance_class._meta.get_field("updated_by")
                    kwargs["updated_by"] = user
                except FieldDoesNotExist:
                    pass
        serializer.save(**kwargs)

    def perform_update(self, serializer: Any) -> None:  # type: ignore[override]
        user = self._get_user()
        kwargs: dict[str, Any] = {}
        if user is not None:
            instance_class = serializer.Meta.model if hasattr(serializer, "Meta") else None
            if instance_class is not None:
                try:
                    instance_class._meta.get_field("updated_by")
                    kwargs["updated_by"] = user
                except FieldDoesNotExist:
                    pass
        serializer.save(**kwargs)


class SoftDeleteMixin:
    """Override ``destroy()`` to perform a soft delete.

    Instead of calling ``instance.delete()`` the mixin sets
    ``instance.is_deleted = True`` and calls ``instance.save()``.

    Requirements
    ------------
    - The model must have a boolean field named ``is_deleted``.
    - If the field is absent a ``400 Bad Request`` is returned, which acts as
      a loud misconfiguration warning during development.
    """

    def destroy(self, request: Request, *args: Any, **kwargs: Any) -> Response:  # type: ignore[override]
        instance = self.get_object()  # type: ignore[attr-defined]

        if not hasattr(instance, "is_deleted"):
            logger.error(
                "SoftDeleteMixin used on model '%s' which has no 'is_deleted' field.",
                type(instance).__name__,
            )
            return Response(
                {"detail": "This resource does not support soft deletion."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        instance.is_deleted = True
        instance.save(update_fields=["is_deleted"])
        return Response(status=status.HTTP_204_NO_CONTENT)
