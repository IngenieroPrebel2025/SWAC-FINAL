"""
Factory Boy factory for the User model.

Uses ``factory.django.DjangoModelFactory`` so Django's model lifecycle
(signals, save hooks) is exercised exactly as it would be in production.
"""

from __future__ import annotations

import factory
from factory.django import DjangoModelFactory
from faker import Faker

fake = Faker()


class UserFactory(DjangoModelFactory):
    """Create ``users.User`` instances for tests."""

    class Meta:
        model = "users.User"

    email = factory.LazyAttribute(lambda _: fake.unique.email())
    first_name = factory.LazyAttribute(lambda _: fake.first_name())
    last_name = factory.LazyAttribute(lambda _: fake.last_name())
    is_active = True
    is_staff = False
    is_superuser = False

    @classmethod
    def create_admin(cls) -> "UserFactory":  # type: ignore[return]
        """Shortcut to create a superuser / staff account."""
        return cls(is_staff=True, is_superuser=True)
