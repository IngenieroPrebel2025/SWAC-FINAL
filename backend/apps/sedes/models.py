import uuid
from django.conf import settings
from django.db import models


class Sede(models.Model):
    sede_id = models.UUIDField(
        primary_key=True, default=uuid.uuid4, editable=False
    )
    codigo_sede = models.CharField(max_length=20, unique=True)
    nombre = models.CharField(max_length=100)
    ciudad = models.CharField(max_length=50)
    estado = models.CharField(max_length=20, default='ACTIVO')
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'Sedes'

    def __str__(self):
        return f'{self.codigo_sede} - {self.nombre}'


class Muelle(models.Model):
    muelle_id = models.UUIDField(
        primary_key=True, default=uuid.uuid4, editable=False
    )
    sede = models.ForeignKey(
        Sede,
        on_delete=models.CASCADE,
        db_column='sede_id',
        related_name='muelles',
    )
    codigo_muelle = models.CharField(max_length=20)
    nombre = models.CharField(max_length=100)
    tipo = models.CharField(max_length=50)
    estado = models.CharField(max_length=20, default='ACTIVO')
    tiempo_operacion = models.IntegerField(help_text='Tiempo en minutos')

    class Meta:
        db_table = 'Muelles'

    def __str__(self):
        return f'{self.nombre} ({self.codigo_muelle})'


class HabilitacionMuelle(models.Model):
    habilitacion_id = models.UUIDField(
        primary_key=True, default=uuid.uuid4, editable=False
    )
    muelle = models.ForeignKey(
        Muelle,
        on_delete=models.CASCADE,
        db_column='muelle_id',
        related_name='habilitaciones',
    )
    fecha = models.DateField()
    hora_inicio = models.TimeField()
    hora_fin = models.TimeField()
    motivo = models.TextField(blank=True, null=True)
    usuario_modificacion = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        db_column='usuario_modificacion',
    )
    fecha_registro = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'Habilitacion_Muelles'