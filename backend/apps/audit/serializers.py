from rest_framework import serializers

from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    """Read-only serializer for AuditLog entries."""

    class Meta:
        model = AuditLog
        fields = [
            'id',
            'user_id',
            'action',
            'resource_type',
            'resource_id',
            'changes',
            'ip_address',
            'user_agent',
            'correlation_id',
            'metadata',
            'created_at',
        ]
        read_only_fields = fields
