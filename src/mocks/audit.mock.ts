import { BitacoraAuditoria } from '@/types';

export const MOCK_AUDITORIA: BitacoraAuditoria[] = [
  {
    id: 'aud-001',
    categoria: 'MUELLES',
    accion: 'DESHABILITAR_MUELLE',
    entidadTipo: 'MUELLE',
    entidadId: 'mue-rio-05',
    descripcion: 'Deshabilitación temporal de Muelle 5 por mantenimiento preventivo de rampa hidráulica.',
    usuarioId: 'usr-admin-01',
    usuarioNombre: 'Ing. Carlos Eduardo Montoya',
    usuarioEmail: 'admin.logistica@swac.com',
    ipOrigen: '192.168.10.45',
    datosPrevios: { activo: true, estadoActual: 'DISPONIBLE' },
    datosNuevos: { activo: false, estadoActual: 'MANTENIMIENTO' },
    fechaRegistro: '2026-02-27T08:00:00Z',
    sedeId: 'sede-rio-01'
  },
  {
    id: 'aud-002',
    categoria: 'CITAS',
    accion: 'CAMBIO_ESTADO',
    entidadTipo: 'CITA',
    entidadId: 'cita-2026-001',
    descripcion: 'Cambio de estado de cita CTA-2026-0891 de EN_PORTERIA a EN_MUELLE (Muelle M-01).',
    usuarioId: 'usr-port-01',
    usuarioNombre: 'Sargento (R) Hernando Pardo',
    usuarioEmail: 'porteria.rionegro@swac.com',
    ipOrigen: '192.168.10.120',
    datosPrevios: { estado: 'EN_PORTERIA' },
    datosNuevos: { estado: 'EN_MUELLE', muelleId: 'mue-rio-01' },
    fechaRegistro: '2026-02-27T08:02:00Z',
    sedeId: 'sede-rio-01'
  },
  {
    id: 'aud-003',
    categoria: 'INTEGRACIONES',
    accion: 'TEST_API',
    entidadTipo: 'INTEGRACION_API',
    entidadId: 'int-sap-001',
    descripcion: 'Ejecución de prueba de contrato SAP S/4HANA en modo Mock Synthetic: Respuesta exitosa HTTP 200 OK.',
    usuarioId: 'usr-admin-01',
    usuarioNombre: 'Ing. Carlos Eduardo Montoya',
    usuarioEmail: 'admin.logistica@swac.com',
    ipOrigen: '192.168.10.45',
    fechaRegistro: '2026-02-27T08:15:00Z',
    sedeId: 'sede-rio-01'
  }
];
