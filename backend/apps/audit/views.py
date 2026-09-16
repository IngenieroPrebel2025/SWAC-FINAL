from django_filters import rest_framework as filters
from rest_framework import permissions
from rest_framework.viewsets import ReadOnlyModelViewSet

from .models import AuditLog
from .serializers import AuditLogSerializer


class AuditLogFilter(filters.FilterSet):
    """FilterSet for AuditLog list endpoint."""

    user_id = filters.UUIDFilter(field_name='user_id')
    action = filters.CharFilter(field_name='action', lookup_expr='iexact')
    resource_type = filters.CharFilter(field_name='resource_type', lookup_expr='iexact')
    created_after = filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')

    class Meta:
        model = AuditLog
        fields = ['user_id', 'action', 'resource_type', 'created_after', 'created_before']


class AuditLogViewSet(ReadOnlyModelViewSet):
    """
    Read-only viewset for audit logs.

    list:   GET  /audit/logs/            — paginated, filterable
    detail: GET  /audit/logs/{id}/       — single entry

    Filtering query params:
      - user_id         (UUID)
      - action          (case-insensitive string)
      - resource_type   (case-insensitive string)
      - created_after   (ISO 8601 datetime)
      - created_before  (ISO 8601 datetime)
    """

    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    # TODO: Replace IsAdminUser with your project's actual permission class.
    permission_classes = [permissions.IsAdminUser]
    filter_backends = [filters.DjangoFilterBackend]
    filterset_class = AuditLogFilter
    ordering_fields = ['created_at', 'action', 'resource_type']
    ordering = ['-created_at']
