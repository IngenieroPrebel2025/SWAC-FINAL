import uuid
from django.db import models


class TimeStampedModel(models.Model):
    """Abstract model with created_at and updated_at."""

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class UUIDModel(models.Model):
    """Abstract model with UUID primary key."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    class Meta:
        abstract = True


class SoftDeleteModel(models.Model):
    """Abstract model with soft delete."""

    is_deleted = models.BooleanField(default=False, db_index=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        abstract = True

    def soft_delete(self) -> None:
        """Mark the record as deleted without removing it from the database."""
        from django.utils import timezone

        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save(update_fields=['is_deleted', 'deleted_at'])


class BaseModel(UUIDModel, TimeStampedModel, SoftDeleteModel):
    """Full base model combining UUID primary key, timestamps, and soft delete."""

    class Meta:
        abstract = True
