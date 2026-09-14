// Contratos de datos para Proveedores y Catálogo de Materiales

export type EstadoProveedor = 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO' | 'EN_REVISION';

export interface TipoMaterial {
  id: string;
  codigo: string; // ej. "ALIM-PERECEDEROS"
  nombre: string;
  requiereRefrigeracion: boolean;
  temperaturaMinimaCelsius?: number;
  temperaturaMaximaCelsius?: number;
  minutosDescarguePorEstiba: number; // Factor para la calculadora de tiempos
  minutosDescarguePorCaja?: number;
  prioridadOperacional: 'ALTA' | 'MEDIA' | 'ESTANDAR';
  activo: boolean;
}

export interface Material {
  id: string;
  sku: string; // ej. "SKU-99482"
  descripcion: string;
  tipoMaterialId: string;
  unidadMedida: 'ESTIBA' | 'CAJA' | 'TONELADA' | 'UNIDAD';
  pesoPromedioKg: number;
  volumenM3: number;
  codRefSap?: string; // Código externo de integración
  activo: boolean;
}

export interface Proveedor {
  id: string;
  nitORut: string; // Identificación fiscal
  razonSocial: string;
  nombreComercial: string;
  emailContacto: string;
  telefonoContacto: string;
  estado: EstadoProveedor;
  calificacionDesempeno: number; // 1 a 5
  sedesAutorizadasIds: string[];
  tiposMaterialAutorizadosIds: string[];
  tiempoAdelantoCitaMinutos: number; // Cuánto tiempo antes puede solicitar
  limiteCitasPorDia: number;
  contactoResponsable: {
    nombre: string;
    cargo: string;
    telefono: string;
    email: string;
  };
  creadoEn: string;
  actualizadoEn: string;
}

export interface ProveedorSedeRel {
  id: string;
  proveedorId: string;
  sedeId: string;
  habilitado: boolean;
  condicionesEspeciales?: string;
  diasPermitidosSemana: number[]; // [1, 2, 3, 4, 5] (Lunes a Viernes)
}
