"""
ASGI config for the Django service.

Exposes the module-level callable ``application`` that ASGI servers
(Uvicorn, Daphne, Hypercorn, Gunicorn + UvicornWorker) use.

The default settings module is ``core.config.settings.development``.
Override by setting the ``DJANGO_SETTINGS_MODULE`` environment variable
before starting the server.

Reference:
    https://docs.djangoproject.com/en/stable/howto/deployment/asgi/
"""
import os

from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.config.settings.development')

# Initialise the Django application object.
# Any Django-level import must happen after this line.
application = get_asgi_application()
