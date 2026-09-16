from django.contrib.auth.hashers import make_password
from rest_framework import serializers

from .models import User


class UserSerializer(serializers.ModelSerializer):
    """
    Safe read serializer for User.

    Password and internal Django auth fields are deliberately excluded to
    prevent accidental exposure.  Use UserCreateSerializer for admin writes.
    """

    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'first_name',
            'last_name',
            'phone',
            'avatar_url',
            'is_active',
            'is_staff',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class UserCreateSerializer(serializers.ModelSerializer):
    """
    Write serializer for creating users via the admin interface.

    Intended for administrative / back-office use only — not for
    self-registration flows, which should be handled by the auth provider.
    """

    password = serializers.CharField(write_only=True, min_length=8, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'first_name',
            'last_name',
            'phone',
            'avatar_url',
            'is_active',
            'is_staff',
            'password',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def create(self, validated_data: dict) -> User:
        validated_data['password'] = make_password(validated_data['password'])
        return super().create(validated_data)
