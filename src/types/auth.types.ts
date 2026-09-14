// Contratos de datos para Autenticación, Usuarios y RBAC Granular

export type CodigoRol = 'ADMINISTRADOR' | 'PROVEEDOR' | 'PORTERIA' | 'SUPERVISOR_CD' | 'OPERADOR_MUELLE' | 'AUDITOR' | 'PERSONALIZADO';

export type ModuloSistema =
  | 'SEDES_MUELLES'
  | 'PROVEEDORES_MATERIALES'
  | 'CITAS_PROGRAMACION'
  | 'PORTERIA_CONTROL'
  | 'FORMULARIOS_WORKFLOWS'
  | 'INTEGRACIONES_APIS'
  | 'USUARIOS_ROLES'
  | 'DASHBOARDS_REPORTES'
  | 'AUDITORIA_LOGS';

export type AccionPermiso = 'CREAR' | 'LEER' | 'EDITAR' | 'ELIMINAR' | 'APROBAR' | 'RECHAZAR' | 'CONFIGURAR' | 'EXPORTAR';

export interface Permiso {
  id: string;
  codigo: string; // ej. "CITAS_CREAR", "MUELLES_HABILITAR", "APIS_CONFIGURAR"
  nombre: string;
  modulo: ModuloSistema;
  accion: AccionPermiso;
  descripcion: string;
}

export interface Rol {
  id: string;
  codigo: CodigoRol;
  nombre: string;
  descripcion: string;
  esSistema: boolean; // No eliminable si es rol nativo
  permisosIds: string[];
  activo: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

export interface Usuario {
  id: string;
  nombreCompleto: string;
  email: string;
  documentoIdentidad: string;
  telefono?: string;
  cargo?: string;
  rolId: string;
  rolCodigo: CodigoRol;
  proveedorId?: string; // Si el usuario pertenece a un proveedor específico
  nit_proveedor?: string; // NIT del proveedor (ej. 900.123.456-1)
  sedesAsignadasIds: string[]; // Sedes a las que tiene acceso (vacío = todas)
  activo: boolean;
  ultimoAcceso?: string;
  creadoEn: string;
  avatarUrl?: string;
  permisosEspeciales?: ActionPermission[];
}

export interface ActionPermission {
  action: AccionPermiso | string;
  resource: ModuloSistema | string;
  scopeId?: string; // e.g. 'mue-rio-02' o 'sede-rio-01'
  concedido?: boolean;
}

export interface UserContext {
  id: string;
  nombre: string;
  email: string;
  nit_proveedor?: string;
  proveedor_id?: string;
  rol_id: string;
  rol_codigo: CodigoRol | string;
  sedes_autorizadas: string[]; // IDs de sedes autorizadas (vacío o ['*'] = todas)
  permisos: ActionPermission[];
  permisos_especiales?: ActionPermission[];
  avatarUrl?: string;
  documentoIdentidad?: string;
  telefono?: string;
}

export interface AuthScope {
  activeSedeId: string;
  nit_proveedor?: string;
  proveedorId?: string;
  rolCodigo: CodigoRol | string;
}

export interface UsuarioSedeRel {
  usuarioId: string;
  sedeId: string;
  fechaAsignacion: string;
  asignadoPor?: string;
  activo: boolean;
}

export interface UsuarioPermisoEspecial {
  id: string;
  usuarioId: string;
  accion: AccionPermiso | string;
  recurso: ModuloSistema | string;
  scopeId?: string;
  concedido: boolean;
  motivo?: string;
  fechaExpiracion?: string;
  creadoEn: string;
}

export interface SesionUsuario {
  token: string;
  refreshToken: string;
  expiraEn: string;
  usuario: Usuario;
  permisosEfectivos: string[]; // Lista de códigos de permisos
}
