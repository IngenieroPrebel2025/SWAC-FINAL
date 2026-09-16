"""
API v1 router.

Register DRF viewsets here with the shared router so they are
automatically exposed under /api/v1/.

Add new viewsets below the "Register viewsets" comment.
"""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.audit.views import AuditLogViewSet
from apps.notifications.views import NotificationViewSet
from apps.users.views import UserViewSet

app_name = "api-v1"

router = DefaultRouter()

# ---------------------------------------------------------------------------
# Register viewsets below this line
# ---------------------------------------------------------------------------

router.register(r"users", UserViewSet, basename="user")
router.register(r"audit-logs", AuditLogViewSet, basename="audit-log")
router.register(r"notifications", NotificationViewSet, basename="notification")

urlpatterns = [
    path("", include(router.urls)),
]
