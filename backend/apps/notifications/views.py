from __future__ import annotations

import uuid

from django_filters import rest_framework as filters
from rest_framework import permissions, status
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from .models import Notification, NotificationStatus
from .serializers import NotificationSerializer
from .services import NotificationService


class NotificationFilter(filters.FilterSet):
    """FilterSet for Notification list endpoint."""

    recipient_id = filters.UUIDFilter(field_name='recipient_id')
    notification_type = filters.CharFilter(field_name='notification_type', lookup_expr='iexact')
    status = filters.CharFilter(field_name='status', lookup_expr='iexact')
    created_after = filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')

    class Meta:
        model = Notification
        fields = ['recipient_id', 'notification_type', 'status', 'created_after', 'created_before']


class NotificationViewSet(ModelViewSet):
    """
    Viewset for notifications.

    list:      GET    /notifications/
    retrieve:  GET    /notifications/{id}/
    mark-read: POST   /notifications/{id}/mark-read/

    Filtering query params:
      - recipient_id      (UUID)
      - notification_type (string)
      - status            (string)
      - created_after     (ISO 8601 datetime)
      - created_before    (ISO 8601 datetime)

    Write operations (create / update / destroy) are disabled by default; all
    mutations should go through NotificationService to preserve audit trails
    and delivery guarantees.
    """

    serializer_class = NotificationSerializer
    # TODO: Replace IsAdminUser with your project's actual permission class.
    permission_classes = [permissions.IsAdminUser]
    filter_backends = [filters.DjangoFilterBackend]
    filterset_class = NotificationFilter
    http_method_names = ['get', 'post', 'head', 'options']

    def get_queryset(self):
        return Notification.objects.filter(is_deleted=False).order_by('-created_at')

    # Disable direct create — all notifications must be created via NotificationService.
    def create(self, request: Request, *args, **kwargs) -> Response:
        return Response(
            {'detail': 'Use NotificationService to create notifications.'},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    @action(detail=True, methods=['post'], url_path='mark-read')
    def mark_read(self, request: Request, pk: str | None = None) -> Response:
        """
        POST /notifications/{id}/mark-read/
        Mark a single notification as read.
        """
        try:
            notification_id = uuid.UUID(str(pk))
        except ValueError:
            return Response({'detail': 'Invalid notification ID.'}, status=status.HTTP_400_BAD_REQUEST)

        updated = NotificationService.mark_read(notification_id)
        if not updated:
            return Response({'detail': 'Notification not found.'}, status=status.HTTP_404_NOT_FOUND)

        notification = Notification.objects.get(id=notification_id)
        return Response(NotificationSerializer(notification).data, status=status.HTTP_200_OK)
