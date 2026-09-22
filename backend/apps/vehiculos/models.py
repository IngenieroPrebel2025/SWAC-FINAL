import uuid
from django.db import models
from apps.proveedores.models import Proveedor


class Conductor(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    proveedor = models.ForeignKey(Proveedor, on_delete=models.CASCADE, related_name="conductores")
    nombre_completo = models.CharField(max_length=150, verbose_name="Nombre Completo")
    cedula = models.CharField(max_length=20, unique=True, verbose_name="Cédula / Documento")
    telefono = models.CharField(max_length=20, blank=True, null=True)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = "Conductores"
        verbose_name = "Conductor"
        verbose_name_plural = "Conductores"
        app_label = "vehiculos"

    def __str__(self):
        return f"{self.nombre_completo} ({self.cedula})"


class Vehiculo(models.Model):
    TIPO_VEHICULO_CHOICES = [
        ('TURBO', 'Turbo / Camión Pequeño'),
        ('SENCILO', 'Camión Sencillo'),
        ('TRAILER', 'Tractomula / Tráiler'),
        ('FURGON', 'Furgón'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    proveedor = models.ForeignKey(Proveedor, on_delete=models.CASCADE, related_name="vehiculos")
    placa = models.CharField(max_length=10, unique=True, verbose_name="Placa del Vehículo")
    tipo_vehiculo = models.CharField(max_length=20, choices=TIPO_VEHICULO_CHOICES, default='TURBO')
    vencimiento_soat = models.DateField(verbose_name="Vencimiento SOAT")
    vencimiento_tecnomecanica = models.DateField(verbose_name="Vencimiento Tecnomecánica")
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = "Vehiculos"
        verbose_name = "Vehículo"
        verbose_name_plural = "Vehículos"
        app_label = "vehiculos"

    def __str__(self):
        return f"{self.placa} - {self.get_tipo_vehiculo_display()}"