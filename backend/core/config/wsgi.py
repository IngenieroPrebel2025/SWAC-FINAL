"""
WSGI config for the Django service.

Exposes the module-level callable ``application`` that WSGI servers
(Gunicorn, uWSGI) use.

The default settings module is ``core.config.settings.development``.
Override by setting the ``DJANGO_SETTINGS_MODULE`` environment variable
before starting the server.

Reference:
    https://docs.djangoproject.com/en/stable/howto/deployment/wsgi/
"""
import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.config.settings.development')

application = get_wsgi_application()
