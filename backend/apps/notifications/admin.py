from django.contrib import admin

from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'recipient_id',
        'notification_type',
        'title',
        'status',
        'sent_at',
        'created_at',
    )
    list_filter = ('notification_type', 'status', 'created_at')
    search_fields = ('recipient_id', 'title', 'body')
    readonly_fields = (
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
    )
    ordering = ('-created_at',)
