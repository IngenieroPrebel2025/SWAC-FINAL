"""
Database router for primary/replica setup.

Directs write operations to the ``default`` database and read operations to the
``replica`` alias when it is present in ``settings.DATABASES``.  Migrations
always run against ``default``.

Usage — add to settings::

    DATABASE_ROUTERS = ['infrastructure.database.routers.PrimaryReplicaRouter']
"""

from __future__ import annotations

from typing import Any

from django.conf import settings
from django.db import models

__all__ = ["PrimaryReplicaRouter"]


class PrimaryReplicaRouter:
    """Route reads to replica and writes to primary.

    When no ``replica`` key exists in ``settings.DATABASES`` all operations
    fall through to ``default``, making this router a safe no-op in
    single-database environments.
    """

    def db_for_read(
        self,
        model: type[models.Model],
        **hints: Any,
    ) -> str:
        """Return ``'replica'`` when configured, otherwise ``'default'``."""
        return "replica" if "replica" in settings.DATABASES else "default"

    def db_for_write(
        self,
        model: type[models.Model],
        **hints: Any,
    ) -> str:
        """Always write to the primary database."""
        return "default"

    def allow_relation(
        self,
        obj1: models.Model,
        obj2: models.Model,
        **hints: Any,
    ) -> bool:
        """Allow any relation between objects in the primary/replica pool."""
        return True

    def allow_migrate(
        self,
        db: str,
        app_label: str,
        model_name: str | None = None,
        **hints: Any,
    ) -> bool:
        """Only apply migrations to the primary database."""
        return db == "default"
