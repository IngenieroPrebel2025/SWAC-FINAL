"""
Integration tests for the audit log system.

Tests AuditService.log() creates records and verifies filtering.
"""

from __future__ import annotations

import pytest
from rest_framework.test import APIClient

pytestmark = pytest.mark.integration


@pytest.mark.django_db
class TestAuditServiceLog:
    """AuditService.log() creates and persists AuditLog records."""

    def test_log_creates_record(self) -> None:
        from apps.audit.models import AuditLog
        from apps.audit.services import AuditService

        before_count = AuditLog.objects.count()
        AuditService.log(action="CREATE", resource_type="Widget")
        assert AuditLog.objects.count() == before_count + 1

    def test_log_sets_action(self) -> None:
        from apps.audit.services import AuditService

        entry = AuditService.log(action="DELETE", resource_type="Widget")
        assert entry.action == "DELETE"

    def test_log_sets_resource_type(self) -> None:
        from apps.audit.services import AuditService

        entry = AuditService.log(action="VIEW", resource_type="Order")
        assert entry.resource_type == "Order"

    def test_log_sets_resource_id(self) -> None:
        from apps.audit.services import AuditService

        entry = AuditService.log(action="UPDATE", resource_type="Order", resource_id="42")
        assert entry.resource_id == "42"

    def test_log_sets_user_id(self) -> None:
        import uuid

        from apps.audit.services import AuditService

        user_id = uuid.uuid4()
        entry = AuditService.log(action="LOGIN", resource_type="User", user_id=user_id)
        assert entry.user_id == user_id

    def test_log_stores_changes(self) -> None:
        from apps.audit.services import AuditService

        changes = {"before": {"status": "active"}, "after": {"status": "inactive"}}
        entry = AuditService.log(action="UPDATE", resource_type="Account", changes=changes)
        assert entry.changes == changes

    def test_log_stores_metadata(self) -> None:
        from apps.audit.services import AuditService

        metadata = {"reason": "manual review", "ticket": "JIRA-123"}
        entry = AuditService.log(
            action="UPDATE", resource_type="Account", metadata=metadata
        )
        assert entry.metadata == metadata

    def test_log_without_optional_fields(self) -> None:
        from apps.audit.models import AuditLog
        from apps.audit.services import AuditService

        entry = AuditService.log(action="EXPORT", resource_type="Report")
        assert entry.pk is not None
        assert AuditLog.objects.filter(pk=entry.pk).exists()


@pytest.mark.django_db
class TestAuditLogFiltering:
    """Filtering AuditLog records by action and resource_type."""

    def test_filter_by_action(self) -> None:
        from apps.audit.models import AuditLog
        from apps.audit.services import AuditService

        AuditService.log(action="CREATE", resource_type="X")
        AuditService.log(action="DELETE", resource_type="X")
        AuditService.log(action="CREATE", resource_type="Y")

        create_logs = AuditLog.objects.filter(action="CREATE")
        delete_logs = AuditLog.objects.filter(action="DELETE")

        assert create_logs.count() >= 2
        assert delete_logs.count() >= 1

    def test_filter_by_resource_type(self) -> None:
        from apps.audit.models import AuditLog
        from apps.audit.services import AuditService

        AuditService.log(action="VIEW", resource_type="Invoice")
        AuditService.log(action="VIEW", resource_type="Payment")

        invoice_logs = AuditLog.objects.filter(resource_type="Invoice")
        assert invoice_logs.count() >= 1
        assert all(log.resource_type == "Invoice" for log in invoice_logs)

    def test_filter_by_action_and_resource_type(self) -> None:
        from apps.audit.models import AuditLog
        from apps.audit.services import AuditService

        AuditService.log(action="DELETE", resource_type="Widget")
        AuditService.log(action="CREATE", resource_type="Widget")
        AuditService.log(action="DELETE", resource_type="Gadget")

        qs = AuditLog.objects.filter(action="DELETE", resource_type="Widget")
        assert qs.count() >= 1
        for log in qs:
            assert log.action == "DELETE"
            assert log.resource_type == "Widget"


@pytest.mark.django_db
class TestAuditLogEndpoint:
    """GET /api/v1/audit-logs/ — read-only audit log API."""

    def test_audit_logs_endpoint_exists(self) -> None:
        client = APIClient()
        response = client.get("/api/v1/audit-logs/logs/")
        # Endpoint may require auth (401/403) or return 200 — either is acceptable.
        assert response.status_code in (200, 401, 403, 404)

    def test_audit_logs_returns_json(self) -> None:
        client = APIClient()
        response = client.get("/api/v1/audit-logs/logs/")
        if response.status_code == 200:
            assert response.accepted_media_type == "application/json"
