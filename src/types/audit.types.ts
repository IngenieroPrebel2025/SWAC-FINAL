// Contratos de datos para la Bitácora de Auditoría y Trazabilidad Operacional

export type CategoriaAuditoria =
  | 'CITAS'
  | 'SEDES'
  | 'MUELLES'
  | 'PROVEEDORES'
  | 'INTEGRACIONES'
  | 'FORMULARIOS'
  | 'SEGURIDAD_AUTH'
  | 'PORTERIA'
  | 'SISTEMA';

export type AccionAuditoria =
  | 'CREAR'
  | 'ACTUALIZAR'
  | 'ELIMINAR'
  | 'CAMBIO_ESTADO'
  | 'HABILITAR_MUELLE'
  | 'DESHABILITAR_MUELLE'
  | 'RESERVA_TEMPORAL'
  | 'EXPIRACION_RESERVA'
  | 'INGRESO_VEHICULO'
  | 'SALIDA_VEHICULO'
  | 'TEST_API'
  | 'LOGIN'
  | 'LOGOUT';

export interface BitacoraAuditoria {
  id: string;
  categoria: CategoriaAuditoria;
  accion: AccionAuditoria;
  entidadTipo: string;
  entidadId: string;
  descripcion: string;
  usuarioId: string;
  usuarioNombre: string;
  usuarioEmail: string;
  ipOrigen?: string;
  datosPrevios?: Record<string, any>;
  datosNuevos?: Record<string, any>;
  fechaRegistro: string; // ISO DateTime
  sedeId?: string;
}
