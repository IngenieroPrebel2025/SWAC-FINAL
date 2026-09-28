from django.contrib import admin
from .models import Proveedor


@admin.register(Proveedor)
class ProveedorAdmin(admin.ModelAdmin):
    list_display = ('nit', 'razon_social', 'nombre_contacto', 'correo_contacto', 'activo')
    search_fields = ('nit', 'razon_social', 'correo_contacto')
    list_filter = ('activo',)
    ordering = ('razon_social',)