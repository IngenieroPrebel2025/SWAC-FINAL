import uuid
from django.db import models


class Proveedor(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nit = models.CharField(max_length=20, unique=True, verbose_name="NIT / RUT")
    razon_social = models.CharField(max_length=150, verbose_name="Razón Social")
    nombre_contacto = models.CharField(max_length=100, blank=True, null=True)
    correo_contacto = models.EmailField(verbose_name="Correo de Contacto")
    telefono_contacto = models.CharField(max_length=20, blank=True, null=True)
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'Proveedores'
        verbose_name = 'Proveedor'
        verbose_name_plural = 'Proveedores'

    def __str__(self):
        return f"{self.razon_social} ({self.nit})"