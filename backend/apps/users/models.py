from django.contrib.auth.models import AbstractUser
from django.db import models

from apps.common.models import TimeStampedModel, UUIDModel


class User(AbstractUser, UUIDModel, TimeStampedModel):
    """
    Minimal placeholder user model.

    Projects should extend this class or replace it with their own auth
    provider's user model (e.g. Auth0, Cognito, Okta).  Authentication is
    intentionally NOT implemented in this template — see docs/security.md
    for integration options.

    Key decisions:
    - Email is the primary login identifier (USERNAME_FIELD = 'email').
    - The built-in username field is retained but not used for login.
    - UUIDModel supplies a UUID primary key, replacing the default integer PK.
    - TimeStampedModel supplies created_at / updated_at.
    """

    # Override email to enforce uniqueness at the database level.
    email = models.EmailField(unique=True)

    # Optional profile fields — extend as needed.
    phone = models.CharField(max_length=20, blank=True)
    avatar_url = models.URLField(blank=True)

    # is_active is already provided by AbstractUser; declared here for clarity.
    is_active = models.BooleanField(default=True)

    USERNAME_FIELD = 'email'
    # first_name and last_name are inherited from AbstractUser.
    REQUIRED_FIELDS = ['first_name', 'last_name']

    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self) -> str:
        return self.email
