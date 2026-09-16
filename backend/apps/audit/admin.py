from django.contrib import admin

from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'action',
        'resource_type',
        'resource_id',
        'user_id',
        'ip_address',
        'created_at',
    )
    list_filter = ('action', 'resource_type', 'created_at')
    search_fields = ('user_id', 'resource_id', 'action', 'resource_type', 'ip_address')
    readonly_fields = (
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
    )
    ordering = ('-created_at',)

    def has_add_permission(self, request):  # type: ignore[override]
        return False

    def has_change_permission(self, request, obj=None):  # type: ignore[override]
        return False

    def has_delete_permission(self, request, obj=None):  # type: ignore[override]
        return False
