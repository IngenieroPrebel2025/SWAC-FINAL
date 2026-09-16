from rest_framework import serializers


class CheckSerializer(serializers.Serializer):
    """
    Schema representation of an individual health check result.
    Used for API documentation (e.g. drf-spectacular).
    """

    database = serializers.CharField(read_only=True)
    cache = serializers.CharField(read_only=True)


class HealthSerializer(serializers.Serializer):
    """
    Schema representation of the general health response.
    Used for API documentation (e.g. drf-spectacular).
    """

    status = serializers.CharField(read_only=True)
    service = serializers.CharField(read_only=True)
    version = serializers.CharField(read_only=True)
    timestamp = serializers.DateTimeField(read_only=True)


class ReadinessSerializer(serializers.Serializer):
    """
    Schema representation of the readiness response.
    Used for API documentation (e.g. drf-spectacular).
    """

    status = serializers.CharField(read_only=True)
    checks = CheckSerializer(read_only=True)
