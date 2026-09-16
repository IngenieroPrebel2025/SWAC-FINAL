from django.db import models


class ActiveManager(models.Manager):
    """Manager that filters out soft-deleted records."""

    def get_queryset(self) -> models.QuerySet:
        return super().get_queryset().filter(is_deleted=False)


class AllObjectsManager(models.Manager):
    """Manager that includes soft-deleted records."""

    pass
