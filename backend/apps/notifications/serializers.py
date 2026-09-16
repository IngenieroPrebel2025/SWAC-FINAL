from rest_framework import serializers

from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for Notification — all fields are read-only except via service layer."""

    class Meta:
        model = Notification
        fields = [
            'id',
            'recipient_id',
            'notification_type',
            'title',
            'body',
            'status',
            'sent_at',
            'metadata',
            'error_message',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'notification_type',
            'sent_at',
            'error_message',
            'created_at',
            'updated_at',
        ]
