from __future__ import annotations

import logging
import uuid
from typing import Any

logger = logging.getLogger(__name__)


class NotificationService:
    """
    Abstraction layer over notification delivery channels.

    All methods create a Notification record and return it.  Actual delivery
    (SMTP, push service, SMS provider) should be triggered via Celery tasks
    or Django signals that react to the PENDING status — keeping this service
    free of I/O side-effects and easy to unit test.

    Extend individual methods to integrate with:
      - Email  : Django email backend, SendGrid, Mailgun, AWS SES, etc.
      - Push   : Firebase Cloud Messaging, APNs, etc.
      - SMS    : Twilio, AWS SNS, etc.
      - Webhook: httpx / requests POST to a configured endpoint.
    """

    @staticmethod
    def send_email(
        recipient_id: uuid.UUID | str,
        title: str,
        body: str,
        metadata: dict[str, Any] | None = None,
    ) -> 'Notification':  # type: ignore[name-defined]  # noqa: F821
        """
        Create a PENDING email notification record.

        The actual email delivery must be wired up separately (e.g. a Celery
        task that polls for PENDING email notifications and calls the email
        backend).
        """
        from .models import Notification, NotificationStatus, NotificationType

        notification = Notification.objects.create(
            recipient_id=recipient_id,
            notification_type=NotificationType.EMAIL,
            title=title,
            body=body,
            status=NotificationStatus.PENDING,
            metadata=metadata or {},
        )
        logger.info('Email notification queued: id=%s recipient=%s', notification.id, recipient_id)
        return notification

    @staticmethod
    def send_in_app(
        recipient_id: uuid.UUID | str,
        title: str,
        body: str,
        metadata: dict[str, Any] | None = None,
    ) -> 'Notification':  # type: ignore[name-defined]  # noqa: F821
        """
        Create a PENDING in-app notification record.

        In-app notifications are delivered by the client polling GET /notifications/
        or via a WebSocket push once the record exists.
        """
        from .models import Notification, NotificationStatus, NotificationType

        notification = Notification.objects.create(
            recipient_id=recipient_id,
            notification_type=NotificationType.IN_APP,
            title=title,
            body=body,
            status=NotificationStatus.PENDING,
            metadata=metadata or {},
        )
        logger.info(
            'In-app notification created: id=%s recipient=%s', notification.id, recipient_id
        )
        return notification

    @staticmethod
    def mark_read(notification_id: uuid.UUID | str) -> bool:
        """
        Mark a notification as READ.

        Returns True if the record was found and updated, False otherwise.
        """
        from django.utils import timezone

        from .models import Notification, NotificationStatus

        updated = Notification.objects.filter(
            id=notification_id,
            is_deleted=False,
        ).update(
            status=NotificationStatus.READ,
            sent_at=timezone.now(),
        )
        return updated > 0

    @staticmethod
    def get_unread_count(recipient_id: uuid.UUID | str) -> int:
        """
        Return the number of unread (PENDING or SENT) notifications for a recipient.
        """
        from .models import Notification, NotificationStatus

        return Notification.objects.filter(
            recipient_id=recipient_id,
            status__in=[NotificationStatus.PENDING, NotificationStatus.SENT],
            is_deleted=False,
        ).count()
