#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys
from pathlib import Path


def main() -> None:
    """Run administrative tasks."""
    # 1. Obtener la ruta base del proyecto
    BASE_DIR = Path(__file__).resolve().parent

    # 2. Agregar la raíz al sys.path para que encuentre 'core' y 'apps' sin errores
    sys.path.append(str(BASE_DIR))

    # 3. Cargar el archivo .env indicando la ruta exacta
    try:
        from dotenv import load_dotenv
        load_dotenv(BASE_DIR / ".env")
    except ImportError:
        pass

    # 4. Asignar el módulo de configuración de Django
    os.environ.setdefault(
        'DJANGO_SETTINGS_MODULE',
        'core.config.settings.development'
    )

    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()