import uuid
from django.db import models
from apps.proveedores.models import Proveedor
from apps.sedes.models import Muelle
from apps.vehiculos.models import Conductor, Vehiculo
from apps.materiales.models import Material


class Cita(models.Model):
    ESTADO_CHOICES = [
        ('RESERVADA', 'Reservada / Pendiente Confirmar'),
        ('CONFIRMADA', 'Confirmada'),
        ('EN_MUELLE', 'En Muelle / Descargando'),
        ('COMPLETADA', 'Completada'),
        ('CANCELADA', 'Cancelada'),
        ('RECHAZADA', 'Rechazada por Inconsistencia'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    codigo_reserva = models.CharField(max_length=20, unique=True, verbose_name="Código de Reserva")
    proveedor = models.ForeignKey(Proveedor, on_delete=models.PROTECT, related_name="citas")
    muelle = models.ForeignKey(Muelle, on_delete=models.PROTECT, related_name="citas")
    vehiculo = models.ForeignKey(Vehiculo, on_delete=models.PROTECT, related_name="citas")
    conductor = models.ForeignKey(Conductor, on_delete=models.PROTECT, related_name="citas")
    
    fecha_cita = models.DateField(verbose_name="Fecha de la Cita")
    hora_inicio = models.TimeField(verbose_name="Hora Inicio")
    hora_fin = models.TimeField(verbose_name="Hora Fin")
    
    duracion_estimada_minutos = models.IntegerField(default=15, verbose_name="Duración Total (Min)")
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='RESERVADA')
    observaciones = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "Citas"
        verbose_name = "Cita"
        verbose_name_plural = "Citas"
        app_label = "citas"
        ordering = ['-fecha_cita', '-hora_inicio']

    def __str__(self):
        return f"{self.codigo_reserva} - {self.proveedor.razon_social} ({self.fecha_cita})"


class DetalleCitaMaterial(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cita = models.ForeignKey(Cita, on_delete=models.CASCADE, related_name="detalles")
    material = models.ForeignKey(Material, on_delete=models.PROTECT, related_name="detalles_cita")
    cantidad_estibas = models.IntegerField(default=1, verbose_name="Cantidad de Estibas")
    tiempo_calculado_minutos = models.IntegerField(verbose_name="Tiempo Calculado (Min)")

    class Meta:
        db_table = "DetallesCitaMaterial"
        verbose_name = "Detalle de Cita"
        verbose_name_plural = "Detalles de Cita"
        app_label = "citas"

    def __str__(self):
        return f"{self.cita.codigo_reserva} - {self.material.nombre} ({self.cantidad_estibas} estibas)"