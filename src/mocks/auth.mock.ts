import { Usuario, Rol, Permiso } from '@/types';

export const MOCK_PERMISOS: Permiso[] = [
  // Sedes y Muelles
  { id: 'perm-01', codigo: 'SEDES_LEER', nombre: 'Ver Sedes y CD', modulo: 'SEDES_MUELLES', accion: 'LEER', descripcion: 'Visualizar lista, métricas y detalle de centros de distribución' },
  { id: 'perm-02', codigo: 'SEDES_CONFIGURAR', nombre: 'Configurar Sedes & Horarios', modulo: 'SEDES_MUELLES', accion: 'CONFIGURAR', descripcion: 'Crear, editar horarios de operación, festivos y reglas de sede' },
  { id: 'perm-03', codigo: 'MUELLES_HABILITAR', nombre: 'Habilitación Dinámica Muelles', modulo: 'SEDES_MUELLES', accion: 'EDITAR', descripcion: 'Activar/desactivar muelles según disponibilidad de turno o cuadrilla' },
  { id: 'perm-04', codigo: 'MUELLES_MANTENIMIENTO', nombre: 'Bloqueo por Mantenimiento', modulo: 'SEDES_MUELLES', accion: 'EDITAR', descripcion: 'Poner muelles fuera de servicio por contingencias técnicas' },

  // Proveedores y Catálogo
  { id: 'perm-05', codigo: 'PROVEEDORES_LEER', nombre: 'Ver Proveedores', modulo: 'PROVEEDORES_MATERIALES', accion: 'LEER', descripcion: 'Consultar directorio de proveedores homologados y scorecards' },
  { id: 'perm-06', codigo: 'PROVEEDORES_ADMIN', nombre: 'Administrar Proveedores', modulo: 'PROVEEDORES_MATERIALES', accion: 'EDITAR', descripcion: 'Crear, bloquear y parametrizar cupos máximos a proveedores' },
  { id: 'perm-07', codigo: 'MATERIALES_GESTION', nombre: 'Catálogo de Materiales', modulo: 'PROVEEDORES_MATERIALES', accion: 'CONFIGURAR', descripcion: 'Configurar tiempos de descarga por estiba y reglas térmicas' },

  // Citas y Programación
  { id: 'perm-08', codigo: 'CITAS_LEER', nombre: 'Consultar Citas', modulo: 'CITAS_PROGRAMACION', accion: 'LEER', descripcion: 'Ver calendario general de citas y estado de slots' },
  { id: 'perm-09', codigo: 'CITAS_SOLICITAR', nombre: 'Solicitar / Agendar Cita', modulo: 'CITAS_PROGRAMACION', accion: 'CREAR', descripcion: 'Reservar cupo y registrar órdenes de entrega (OC)' },
  { id: 'perm-10', codigo: 'CITAS_APROBAR', nombre: 'Aprobar / Confirmar Cita', modulo: 'CITAS_PROGRAMACION', accion: 'APROBAR', descripcion: 'Validar y confirmar citas solicitadas por proveedores' },
  { id: 'perm-11', codigo: 'CITAS_REASIGNAR', nombre: 'Reasignar Muelle / Slot', modulo: 'CITAS_PROGRAMACION', accion: 'EDITAR', descripcion: 'Mover cita a otro muelle o ventana horaria ante contingencias' },
  { id: 'perm-12', codigo: 'CITAS_CANCELAR', nombre: 'Cancelar Cita', modulo: 'CITAS_PROGRAMACION', accion: 'ELIMINAR', descripcion: 'Liberar muelle y cancelar cita programada' },

  // Portería & Control de Acceso
  { id: 'perm-13', codigo: 'PORTERIA_LEER', nombre: 'Ver Turnos en Portería', modulo: 'PORTERIA_CONTROL', accion: 'LEER', descripcion: 'Visualizar lista de camiones esperados y en patio' },
  { id: 'perm-14', codigo: 'PORTERIA_REGISTRO', nombre: 'Check-in de Conductor', modulo: 'PORTERIA_CONTROL', accion: 'EDITAR', descripcion: 'Registrar llegada de conductor, inspección física y pase' },
  { id: 'perm-15', codigo: 'PORTERIA_OCR', nombre: 'Validación OCR de Placas', modulo: 'PORTERIA_CONTROL', accion: 'EDITAR', descripcion: 'Reconocer placa vehicular y remisión con cámara inteligente' },
  { id: 'perm-16', codigo: 'PORTERIA_SALIDA', nombre: 'Check-out & Paz y Salvo', modulo: 'PORTERIA_CONTROL', accion: 'EDITAR', descripcion: 'Registrar salida del vehículo del recinto logístico' },

  // Formularios Dinámicos & Workflows
  { id: 'perm-17', codigo: 'FORMULARIOS_VER', nombre: 'Ver Formularios', modulo: 'FORMULARIOS_WORKFLOWS', accion: 'LEER', descripcion: 'Consultar plantillas de inspección vehicular y de calidad' },
  { id: 'perm-18', codigo: 'FORMULARIOS_BUILDER', nombre: 'Constructor de Formularios', modulo: 'FORMULARIOS_WORKFLOWS', accion: 'CONFIGURAR', descripcion: 'Crear preguntas y reglas condicionales dinámicas por sede/material' },

  // Integraciones y APIs
  { id: 'perm-19', codigo: 'APIS_LEER', nombre: 'Ver Conexiones API', modulo: 'INTEGRACIONES_APIS', accion: 'LEER', descripcion: 'Consultar endpoints y estado de conectividad' },
  { id: 'perm-20', codigo: 'APIS_CONFIGURAR', nombre: 'Configurar APIs & Mappings', modulo: 'INTEGRACIONES_APIS', accion: 'CONFIGURAR', descripcion: 'Registrar endpoints, mapeos JSON y tokens corporativos' },
  { id: 'perm-21', codigo: 'APIS_TEST', nombre: 'Probar Webhooks y APIs', modulo: 'INTEGRACIONES_APIS', accion: 'CONFIGURAR', descripcion: 'Ejecutar pruebas sintéticas y live contra SAP/WMS' },

  // Usuarios, Roles & RBAC
  { id: 'perm-22', codigo: 'USUARIOS_LEER', nombre: 'Ver Directorio de Usuarios', modulo: 'USUARIOS_ROLES', accion: 'LEER', descripcion: 'Consultar listado de usuarios, roles y sedes' },
  { id: 'perm-23', codigo: 'USUARIOS_ADMIN', nombre: 'Administrar Usuarios', modulo: 'USUARIOS_ROLES', accion: 'CONFIGURAR', descripcion: 'Crear usuarios, restablecer contraseñas y asignar sedes' },
  { id: 'perm-24', codigo: 'ROLES_GESTION', nombre: 'Matriz RBAC y Permisos', modulo: 'USUARIOS_ROLES', accion: 'CONFIGURAR', descripcion: 'Crear roles personalizados y modificar matriz de permisos' },

  // Dashboards & Reportes
  { id: 'perm-25', codigo: 'DASHBOARDS_VER', nombre: 'Ver Dashboards Operacionales', modulo: 'DASHBOARDS_REPORTES', accion: 'LEER', descripcion: 'Acceso a KPIs en tiempo real de ocupación de muelles' },
  { id: 'perm-26', codigo: 'REPORTES_EXPORTAR', nombre: 'Exportar Reportes OTIF / SLA', modulo: 'DASHBOARDS_REPORTES', accion: 'EXPORTAR', descripcion: 'Descarga de datos consolidados en Excel / CSV' },

  // Auditoría & Trazabilidad
  { id: 'perm-27', codigo: 'AUDITORIA_VER', nombre: 'Ver Bitácora de Auditoría', modulo: 'AUDITORIA_LOGS', accion: 'LEER', descripcion: 'Visualizar logs inmutables de cambios y eventos de seguridad' }
];

export const MOCK_ROLES: Rol[] = [
  {
    id: 'rol-admin',
    codigo: 'ADMINISTRADOR',
    nombre: 'Administrador Global',
    descripcion: 'Acceso total e irrestricto a todas las sedes, muelles, usuarios, configuraciones de APIs, formularios dinámicos e indicadores.',
    esSistema: true,
    permisosIds: MOCK_PERMISOS.map(p => p.id),
    activo: true,
    creadoEn: '2025-01-01T00:00:00Z',
    actualizadoEn: '2025-01-01T00:00:00Z'
  },
  {
    id: 'rol-admin-sede',
    codigo: 'SUPERVISOR_CD',
    nombre: 'Administrador de Sede',
    descripcion: 'Solo puede visualizar, configurar y gestionar información (muelles, horarios, citas, portería) perteneciente a su Sede asignada.',
    esSistema: true,
    permisosIds: ['perm-01', 'perm-02', 'perm-03', 'perm-04', 'perm-05', 'perm-08', 'perm-10', 'perm-11', 'perm-12', 'perm-13', 'perm-14', 'perm-15', 'perm-16', 'perm-17', 'perm-25', 'perm-26'],
    activo: true,
    creadoEn: '2025-01-01T00:00:00Z',
    actualizadoEn: '2025-01-01T00:00:00Z'
  },
  {
    id: 'rol-prov',
    codigo: 'PROVEEDOR',
    nombre: 'Proveedor Logístico',
    descripcion: 'Acceso exclusivo a la solicitud de citas y consulta de histórico asociadas a su NIT o cuenta de empresa.',
    esSistema: true,
    permisosIds: ['perm-08', 'perm-09','perm-12'],
    activo: true,
    creadoEn: '2025-01-01T00:00:00Z',
    actualizadoEn: '2025-01-01T00:00:00Z'
  },
  {
    id: 'rol-port',
    codigo: 'PORTERIA',
    nombre: 'Oficial de Portería / Seguridad',
    descripcion: 'Interfaz simplificada filtrada exclusivamente por la sede física de turno, mostrando la agenda operativa del día.',
    esSistema: true,
    permisosIds: ['perm-13', 'perm-14', 'perm-15', 'perm-16'],
    activo: true,
    creadoEn: '2025-01-01T00:00:00Z',
    actualizadoEn: '2025-01-01T00:00:00Z'
  },
  {
    id: 'rol-custom',
    codigo: 'PERSONALIZADO',
    nombre: 'Usuario Operativo Personalizado',
    descripcion: 'Permisos asignados granularmente mediante excepciones por muelle o sede específica.',
    esSistema: false,
    permisosIds: ['perm-01', 'perm-08'],
    activo: true,
    creadoEn: '2025-02-01T00:00:00Z',
    actualizadoEn: '2025-02-01T00:00:00Z'
  },
  {
    id: 'rol-op-muelle',
    codigo: 'OPERADOR_MUELLE',
    nombre: 'Operador de Muelle & Cuadrilla',
    descripcion: 'Gestión en tiempo real de inicio/fin de descargue, inspección de calidad y conteo de estibas.',
    esSistema: true,
    permisosIds: ['perm-01', 'perm-03', 'perm-08', 'perm-13', 'perm-17'],
    activo: true,
    creadoEn: '2025-01-10T00:00:00Z',
    actualizadoEn: '2025-01-10T00:00:00Z'
  },
  {
    id: 'rol-audit',
    codigo: 'AUDITOR',
    nombre: 'Auditor de Seguridad y Procesos',
    descripcion: 'Auditoría en modo solo lectura de todas las bitácoras de eventos, trazabilidad de citas y métricas SLA.',
    esSistema: true,
    permisosIds: ['perm-01', 'perm-05', 'perm-08', 'perm-13', 'perm-19', 'perm-22', 'perm-25', 'perm-26', 'perm-27'],
    activo: true,
    creadoEn: '2025-01-15T00:00:00Z',
    actualizadoEn: '2025-01-15T00:00:00Z'
  }
];

export const MOCK_USUARIOS: Usuario[] = [
  // 1. PERFIL REQUERIDO: Administrador Global
  {
    id: 'usr-admin-global',
    nombreCompleto: 'Carlos Eduardo Montoya (Admin Global)',
    email: 'admin_global@empresa.com',
    documentoIdentidad: '80199432',
    telefono: '+57 311 550 4400',
    rolId: 'rol-admin',
    rolCodigo: 'ADMINISTRADOR',
    sedesAsignadasIds: [], // Acceso total a todas las sedes
    activo: true,
    ultimoAcceso: '2026-02-27T08:20:00Z',
    creadoEn: '2025-01-05T08:00:00Z',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  },
  // 2. PERFIL REQUERIDO: Administrador de Sede Rionegro
  {
    id: 'usr-admin-rionegro',
    nombreCompleto: 'Andrea Morales (Admin Rionegro)',
    email: 'admin_rionegro@empresa.com',
    documentoIdentidad: '71988421',
    telefono: '+57 314 887 2399',
    rolId: 'rol-admin-sede',
    rolCodigo: 'SUPERVISOR_CD',
    sedesAsignadasIds: ['sede-rio-01'], // Exclusivo Sede Rionegro
    activo: true,
    ultimoAcceso: '2026-02-27T08:15:00Z',
    creadoEn: '2025-01-08T09:00:00Z',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  },
  // 3. PERFIL REQUERIDO: Portería / Seguridad Medellín
  {
    id: 'usr-porteria-medellin',
    nombreCompleto: 'Gabriel Torres (Portería Medellín)',
    email: 'porteria_medellin@empresa.com',
    documentoIdentidad: '19455820',
    telefono: '+57 300 221 4455',
    rolId: 'rol-port',
    rolCodigo: 'PORTERIA',
    sedesAsignadasIds: ['sede-com-03'], // Solo Sede Medellín (Comercial)
    activo: true,
    ultimoAcceso: '2026-02-27T06:00:00Z',
    creadoEn: '2025-01-10T08:00:00Z',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
  },
  // 4. PERFIL REQUERIDO: Proveedor XYZ (NIT 900.123.456-1)
  {
    id: 'usr-proveedor-xyz',
    nombreCompleto: 'Gerardo Valencia (Proveedor XYZ)',
    email: 'contacto@proveedorXYZ.com',
    documentoIdentidad: '52899120',
    telefono: '+57 301 555 9876',
    rolId: 'rol-prov',
    rolCodigo: 'PROVEEDOR',
    proveedorId: 'prov-xyz', // Proveedor XYZ S.A.S.
    nit_proveedor: '900.123.456-1',
    sedesAsignadasIds: [], // El proveedor no está atado a una sede; la elige al solicitar la cita
    activo: true,
    ultimoAcceso: '2026-02-27T07:40:00Z',
    creadoEn: '2025-01-15T10:00:00Z',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
  },
  // 5. PERFIL COMPLEMENTARIO: Usuario Personalizado (Custom Operativo)
  {
    id: 'usr-custom-01',
    nombreCompleto: 'Lucas Bedoya (Operativo Custom)',
    email: 'operativo_custom@empresa.com',
    documentoIdentidad: '80233910',
    telefono: '+57 320 556 1234',
    rolId: 'rol-custom',
    rolCodigo: 'PERSONALIZADO',
    sedesAsignadasIds: ['sede-rio-01'],
    activo: true,
    ultimoAcceso: '2026-02-27T07:05:00Z',
    creadoEn: '2025-01-20T08:00:00Z',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    permisosEspeciales: [
      { action: 'LEER', resource: 'SEDES_MUELLES', scopeId: 'sede-rio-01', concedido: true },
      { action: 'EDITAR', resource: 'MUELLES', scopeId: 'mue-rio-02', concedido: true },
      { action: 'LEER', resource: 'CITAS_PROGRAMACION', concedido: true }
    ]
  },
  // 6. Auditor
  {
    id: 'usr-audit-01',
    nombreCompleto: 'Valentina Soler (Auditoría)',
    email: 'auditoria.calidad@centrosdistribucion.com',
    documentoIdentidad: '1018449320',
    telefono: '+57 312 400 9088',
    rolId: 'rol-audit',
    rolCodigo: 'AUDITOR',
    sedesAsignadasIds: [], // Auditoría Global
    activo: true,
    ultimoAcceso: '2026-02-25T14:30:00Z',
    creadoEn: '2025-01-25T10:00:00Z',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
  }
];
