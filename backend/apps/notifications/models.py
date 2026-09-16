from django.db import models

from apps.common.models import BaseModel


class NotificationType(models.TextChoices):
    EMAIL = 'EMAIL', 'Email'
    SMS = 'SMS', 'SMS'
    PUSH = 'PUSH', 'Push'
    IN_APP = 'IN_APP', 'In-App'
    WEBHOOK = 'WEBHOOK', 'Webhook'


class NotificationStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending'
    SENT = 'SENT', 'Sent'
    FAILED = 'FAILED', 'Failed'
    READ = 'READ', 'Read'


class Notification(BaseModel):
    """
    Persistent record of every outbound notification.

    recipient_id is stored as a plain UUID (not a FK) so that notifications
    remain intact even if the user record is removed and to keep the
    notifications app decoupled from the users app.
    """

    recipient_id = models.UUIDField(db_index=True)

    notification_type = models.CharField(
        max_length=20,
        choices=NotificationType.choices,
        db_index=True,
    )

    title = models.CharField(max_length=255)
    body = models.TextField()

    status = models.CharField(
        max_length=20,
        choices=NotificationStatus.choices,
        default=NotificationStatus.PENDING,
        db_index=True,
    )

    sent_at = models.DateTimeField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    error_message = models.TextField(blank=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']
        indexes = [
            models.Index(
                fields=['recipient_id', 'status'],
                name='notif_recipient_status_idx',
            ),
            models.Index(fields=['created_at'], name='notif_created_idx'),
            models.Index(fields=['status'], name='notif_status_idx'),
        ]
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'

    def __str__(self) -> str:
        return f'[{self.notification_type}] {self.title} -> {self.recipient_id} ({self.status})'
