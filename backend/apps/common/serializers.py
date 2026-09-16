from rest_framework import serializers


class BaseModelSerializer(serializers.ModelSerializer):
    """Base serializer with common read-only fields inherited by all model serializers."""

    class Meta:
        read_only_fields = ('id', 'created_at', 'updated_at')
