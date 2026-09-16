from __future__ import annotations

import logging
import uuid
from typing import Any

logger = logging.getLogger(__name__)


class AuditService:
    """
    Central service for recording audit events.

    All writes go through this service so that the rest of the codebase never
    imports the AuditLog model directly — keeping the audit app a pure
    consumer dependency rather than a bi-directional one.
    """

    @staticmethod
    def log(
        action: str,
        resource_type: str,
        resource_id: str | None = None,
        user_id: uuid.UUID | str | None = None,
        changes: dict[str, Any] | None = None,
        request: Any | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> 'AuditLog':  # type: ignore[name-defined]  # noqa: F821
        """
        Create and persist an AuditLog entry.

        Parameters
        ----------
        action:
            Verb describing the event (e.g. 'CREATE', 'UPDATE', 'DELETE', 'LOGIN').
        resource_type:
            Name of the affected entity class (e.g. 'User', 'Order').
        resource_id:
            String representation of the affected resource's PK.  Optional.
        user_id:
            UUID of the acting user.  Extracted from *request* when omitted.
        changes:
            Dict with optional 'before' / 'after' keys showing what changed.
        request:
            DRF or Django request object.  Used to extract ip_address,
            user_agent, and X-Correlation-ID when provided.
        metadata:
            Arbitrary key/value pairs for additional context.

        Returns
        -------
        AuditLog
            The persisted audit log instance.
        """
        from .models import AuditLog

        ip_address: str | None = None
        user_agent: str = ''
        correlation_id: uuid.UUID | None = None

        if request is not None:
            ip_address = AuditService._get_client_ip(request)
            user_agent = request.META.get('HTTP_USER_AGENT', '')

            # Support both standard and custom correlation-ID headers.
            raw_correlation = (
                request.META.get('HTTP_X_CORRELATION_ID')
                or request.META.get('HTTP_X_REQUEST_ID')
            )
            if raw_correlation:
                try:
                    correlation_id = uuid.UUID(raw_correlation)
                except ValueError:
                    logger.debug('Invalid correlation ID header value: %s', raw_correlation)

            # Fall back to request.user when user_id is not explicitly supplied.
            if user_id is None:
                req_user = getattr(request, 'user', None)
                if req_user is not None and getattr(req_user, 'is_authenticated', False):
                    user_id = getattr(req_user, 'id', None)

        entry = AuditLog.objects.create(
            action=action,
            resource_type=resource_type,
            resource_id=str(resource_id) if resource_id is not None else None,
            user_id=user_id,
            changes=changes,
            ip_address=ip_address,
            user_agent=user_agent,
            correlation_id=correlation_id,
            metadata=metadata or {},
        )
        return entry

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _get_client_ip(request: Any) -> str | None:
        """
        Extract the real client IP, honouring X-Forwarded-For when the
        service runs behind a reverse proxy.
        """
        x_forwarded_for: str | None = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            # The leftmost address is the originating client.
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR')
