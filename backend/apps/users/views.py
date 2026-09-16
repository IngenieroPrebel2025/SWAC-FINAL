from rest_framework import permissions
from rest_framework.viewsets import ModelViewSet

from .models import User
from .serializers import UserCreateSerializer, UserSerializer


class UserViewSet(ModelViewSet):
    """
    CRUD viewset for User management.

    All endpoints are restricted to admin users by default.
    Projects integrating an external auth provider should replace the
    permission_classes with their own policy (e.g. JWT-based scopes).

    list:     GET    /users/
    create:   POST   /users/
    retrieve: GET    /users/{id}/
    update:   PUT    /users/{id}/
    partial:  PATCH  /users/{id}/
    destroy:  DELETE /users/{id}/
    """

    queryset = User.objects.all().order_by('-created_at')
    # TODO: Replace IsAdminUser with your project's actual permission class.
    permission_classes = [permissions.IsAdminUser]

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer
