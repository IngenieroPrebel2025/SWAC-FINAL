import uuid
from django.db import models


class TipoMaterial(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    codigo = models.CharField(max_length=20, unique=True, verbose_name="Código Tipo")
    nombre = models.CharField(max_length=100, verbose_name="Nombre del Tipo")  # Ej: Empaque, Materia Prima
    descripcion = models.TextField(blank=True, null=True)

    class Meta:
        db_table = "TiposMaterial"
        verbose_name = "Tipo de Material"
        verbose_name_plural = "Tipos de Material"
        app_label = "materiales"

    def __str__(self):
        return self.nombre


class Material(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tipo = models.ForeignKey(TipoMaterial, on_delete=models.CASCADE, related_name="materiales")
    codigo = models.CharField(max_length=30, unique=True, verbose_name="Código Material / SAP")
    nombre = models.CharField(max_length=150, verbose_name="Nombre del Material")
    tiempo_descarga_min_estiba = models.IntegerField(default=5, verbose_name="Minutos por Estiba")
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = "Materiales"
        verbose_name = "Material"
        verbose_name_plural = "Materiales"
        app_label = "materiales"

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"