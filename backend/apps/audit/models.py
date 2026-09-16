import uuid

from django.db import models


class AuditLog(models.Model):
    """
    Immutable audit trail for all significant application events.

    Deliberately avoids foreign keys so that audit records remain intact
    even if the referenced resource is deleted.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Actor — stored as plain UUID, not a FK, to avoid coupling with the users app.
    user_id = models.UUIDField(null=True, blank=True)

    # What happened
    action = models.CharField(
        max_length=100,
        db_index=True,
        help_text="Verb describing the event, e.g. CREATE, UPDATE, DELETE, LOGIN.",
    )

    # What was affected
    resource_type = models.CharField(
        max_length=100,
        db_index=True,
        help_text="Class / entity name of the affected resource, e.g. 'User', 'Order'.",
    )
    resource_id = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text="String representation of the affected resource's primary key.",
    )

    # Diff payload
    changes = models.JSONField(
        null=True,
        blank=True,
        help_text="Dictionary with 'before' and 'after' snapshots of changed fields.",
    )

    # Request context
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    correlation_id = models.UUIDField(
        null=True,
        blank=True,
        help_text="Distributed tracing ID propagated via X-Correlation-ID header.",
    )

    # Freeform extras
    metadata = models.JSONField(default=dict, blank=True)

    # Timestamp (immutable — no auto_now)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'audit_logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user_id', 'created_at'], name='audit_user_created_idx'),
            models.Index(fields=['action', 'resource_type'], name='audit_action_resource_idx'),
            models.Index(fields=['created_at'], name='audit_created_idx'),
        ]

    def __str__(self) -> str:
        return f'[{self.action}] {self.resource_type}({self.resource_id}) by user={self.user_id}'
