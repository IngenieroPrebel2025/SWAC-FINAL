import { Cita, ReservaTemporal } from '@/types';

// Helper to get formatted dates relative to today
const getRelativeDate = (offsetDays: number = 0): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const TODAY = getRelativeDate(0);
const YESTERDAY = getRelativeDate(-1);
const TOMORROW = getRelativeDate(1);
const FIXED_DEMO_DATE = '2026-02-27';

// Generate comprehensive mock appointments
export const MOCK_CITAS: Cita[] = [
  // --- CITAS DE HOY: SEDE RIONEGRO (Principal) ---
  {
    id: 'cita-today-rio-01',
    codigoCita: 'CTA-2026-0901',
    sedeId: 'sede-rio-01',
    muelleId: 'mue-rio-01',
    proveedorId: 'prov-xyz', // Proveedor XYZ
    tipoOperacion: 'RECEPCION_PROVEEDOR',
    estado: 'DESCARGANDO',
    conductorId: 'cond-001',
    vehiculoId: 'veh-001',
    fechaCita: TODAY,
    tiempos: {
      horaProgramadaInicio: `${TODAY}T08:00:00Z`,
      horaProgramadaFin: `${TODAY}T09:30:00Z`,
      duracionEstimadaMinutos: 90,
      horaLlegadaPorteria: `${TODAY}T07:45:00Z`,
      horaIngresoPlanta: `${TODAY}T07:55:00Z`,
      horaLlamadoMuelle: `${TODAY}T08:02:00Z`,
      horaInicioDescargue: `${TODAY}T08:12:00Z`,
      minutosRetrasoLlegada: 0,
      tiempoTotalEstadiaMinutos: 48
    },
    items: [
      {
        id: 'item-today-01',
        citaId: 'cita-today-rio-01',
        materialId: 'mat-001',
        sku: 'SKU-LACT-001',
        descripcion: 'Leche Entera UHT 1000ml (Caja x 12 unds)',
        cantidadUnidades: 14400,
        cantidadEstibas: 14,
        pesoTotalKg: 11900,
        ordenCompraNumero: 'OC-XYZ-77012',
        facturaRemision: 'FAC-XYZ-1049',
        temperaturaObjetivoCelsius: 4
      }
    ],
    totalEstibas: 14,
    totalCajas: 1200,
    pesoTotalKg: 11900,
    observacionesOperativas: 'Recepción en curso para Proveedor XYZ. Cuadrilla asignada.',
    inspeccionPorteriaAprobada: true,
    creadoPorUsuarioId: 'usr-prov-xyz',
    creadoEn: `${YESTERDAY}T14:20:00Z`,
    actualizadoEn: `${TODAY}T08:12:00Z`
  },
  {
    id: 'cita-today-med-01',
    codigoCita: 'CTA-2026-0950',
    sedeId: 'sede-com-03', // Sede Comercial Medellín
    muelleId: 'mue-com-01',
    proveedorId: 'prov-xyz', // Proveedor XYZ
    tipoOperacion: 'RECEPCION_PROVEEDOR',
    estado: 'CONFIRMADA',
    conductorId: 'cond-002',
    vehiculoId: 'veh-002',
    fechaCita: TODAY,
    tiempos: {
      horaProgramadaInicio: `${TODAY}T11:00:00Z`,
      horaProgramadaFin: `${TODAY}T12:00:00Z`,
      duracionEstimadaMinutos: 60
    },
    items: [
      {
        id: 'item-today-med-01',
        citaId: 'cita-today-med-01',
        materialId: 'mat-002',
        sku: 'SKU-ABAR-015',
        descripcion: 'Abarrotes y Alimentos Secos Selección XYZ',
        cantidadUnidades: 600,
        cantidadEstibas: 10,
        pesoTotalKg: 8500,
        ordenCompraNumero: 'OC-XYZ-88001'
      }
    ],
    totalEstibas: 10,
    totalCajas: 600,
    pesoTotalKg: 8500,
    inspeccionPorteriaAprobada: false,
    observacionesOperativas: 'Despacho programado para Sede Medellín.',
    creadoPorUsuarioId: 'usr-prov-xyz',
    creadoEn: `${YESTERDAY}T18:00:00Z`,
    actualizadoEn: `${YESTERDAY}T18:00:00Z`
  },
  {
    id: 'cita-today-rio-02',
    codigoCita: 'CTA-2026-0902',
    sedeId: 'sede-rio-01',
    muelleId: 'mue-rio-02',
    proveedorId: 'prov-002',
    tipoOperacion: 'RECEPCION_PROVEEDOR',
    estado: 'EN_PORTERIA',
    conductorId: 'cond-002',
    vehiculoId: 'veh-002',
    fechaCita: TODAY,
    tiempos: {
      horaProgramadaInicio: `${TODAY}T10:00:00Z`,
      horaProgramadaFin: `${TODAY}T11:45:00Z`,
      duracionEstimadaMinutos: 105,
      horaLlegadaPorteria: `${TODAY}T09:40:00Z`,
      minutosRetrasoLlegada: 0
    },
    items: [
      {
        id: 'item-today-03',
        citaId: 'cita-today-rio-02',
        materialId: 'mat-002',
        sku: 'SKU-ABAR-015',
        descripcion: 'Arroz Premium Selección Especial Saco 25kg',
        cantidadUnidades: 900,
        cantidadEstibas: 22,
        pesoTotalKg: 22000,
        ordenCompraNumero: 'OC-SAP-91024'
      }
    ],
    totalEstibas: 22,
    totalCajas: 900,
    pesoTotalKg: 22000,
    inspeccionPorteriaAprobada: true,
    observacionesOperativas: 'Vehículo validado en Garita Norte. Pendiente llamado a Muelle 2.',
    creadoPorUsuarioId: 'usr-prov-02',
    creadoEn: `${YESTERDAY}T16:00:00Z`,
    actualizadoEn: `${TODAY}T09:40:00Z`
  },
  {
    id: 'cita-today-rio-03',
    codigoCita: 'CTA-2026-0903',
    sedeId: 'sede-rio-01',
    muelleId: 'mue-rio-03',
    proveedorId: 'prov-003',
    tipoOperacion: 'RECEPCION_PROVEEDOR',
    estado: 'CONFIRMADA',
    fechaCita: TODAY,
    conductorId: 'cond-001',
    vehiculoId: 'veh-001',
    tiempos: {
      horaProgramadaInicio: `${TODAY}T14:00:00Z`,
      horaProgramadaFin: `${TODAY}T15:00:00Z`,
      duracionEstimadaMinutos: 60
    },
    items: [
      {
        id: 'item-today-04',
        citaId: 'cita-today-rio-03',
        materialId: 'mat-004',
        sku: 'SKU-ASEO-040',
        descripcion: 'Detergente Líquido Concentrado 3000ml',
        cantidadUnidades: 450,
        cantidadEstibas: 8,
        pesoTotalKg: 7360,
        ordenCompraNumero: 'OC-SAP-92140'
      }
    ],
    totalEstibas: 8,
    totalCajas: 450,
    pesoTotalKg: 7360,
    inspeccionPorteriaAprobada: false,
    creadoPorUsuarioId: 'usr-prov-03',
    creadoEn: `${YESTERDAY}T18:30:00Z`,
    actualizadoEn: `${YESTERDAY}T18:30:00Z`
  },
  {
    id: 'cita-today-rio-04',
    codigoCita: 'CTA-2026-0904',
    sedeId: 'sede-rio-01',
    muelleId: 'mue-rio-04',
    proveedorId: 'prov-001',
    tipoOperacion: 'TRANSFERENCIA_INTERNA',
    estado: 'COMPLETADA',
    conductorId: 'cond-002',
    vehiculoId: 'veh-002',
    fechaCita: TODAY,
    tiempos: {
      horaProgramadaInicio: `${TODAY}T06:00:00Z`,
      horaProgramadaFin: `${TODAY}T07:30:00Z`,
      duracionEstimadaMinutos: 90,
      horaLlegadaPorteria: `${TODAY}T05:50:00Z`,
      horaIngresoPlanta: `${TODAY}T05:58:00Z`,
      horaLlamadoMuelle: `${TODAY}T06:02:00Z`,
      horaInicioDescargue: `${TODAY}T06:10:00Z`,
      horaFinDescargue: `${TODAY}T07:15:00Z`,
      horaSalidaPlanta: `${TODAY}T07:25:00Z`,
      minutosRetrasoLlegada: 0,
      tiempoTotalEstadiaMinutos: 95
    },
    items: [
      {
        id: 'item-today-05',
        citaId: 'cita-today-rio-04',
        materialId: 'mat-001',
        sku: 'SKU-LACT-001',
        descripcion: 'Leche Entera UHT 1000ml (Caja x 12 unds)',
        cantidadUnidades: 8000,
        cantidadEstibas: 8,
        pesoTotalKg: 6800,
        ordenCompraNumero: 'OC-SAP-88310'
      }
    ],
    totalEstibas: 8,
    totalCajas: 800,
    pesoTotalKg: 6800,
    inspeccionPorteriaAprobada: true,
    observacionesOperativas: 'Descargue completado sin novedades ni averías.',
    creadoPorUsuarioId: 'usr-prov-01',
    creadoEn: `${YESTERDAY}T10:00:00Z`,
    actualizadoEn: `${TODAY}T07:25:00Z`
  },

  // --- CITAS DE HOY: SEDE PRODUCTORA ---
  {
    id: 'cita-today-pro-01',
    codigoCita: 'CTA-2026-0905',
    sedeId: 'sede-pro-02',
    muelleId: 'mue-pro-01',
    proveedorId: 'prov-002',
    tipoOperacion: 'RECEPCION_PROVEEDOR',
    estado: 'EN_MUELLE',
    conductorId: 'cond-002',
    vehiculoId: 'veh-002',
    fechaCita: TODAY,
    tiempos: {
      horaProgramadaInicio: `${TODAY}T09:00:00Z`,
      horaProgramadaFin: `${TODAY}T11:00:00Z`,
      duracionEstimadaMinutos: 120,
      horaLlegadaPorteria: `${TODAY}T08:50:00Z`,
      horaIngresoPlanta: `${TODAY}T08:58:00Z`,
      horaLlamadoMuelle: `${TODAY}T09:05:00Z`,
      horaInicioDescargue: `${TODAY}T09:15:00Z`,
      minutosRetrasoLlegada: 0,
      tiempoTotalEstadiaMinutos: 40
    },
    items: [
      {
        id: 'item-today-06',
        citaId: 'cita-today-pro-01',
        materialId: 'mat-002',
        sku: 'SKU-ABAR-015',
        descripcion: 'Materia Prima Granel & Insumos de Producción',
        cantidadUnidades: 1200,
        cantidadEstibas: 24,
        pesoTotalKg: 24000,
        ordenCompraNumero: 'OC-PROD-5501'
      }
    ],
    totalEstibas: 24,
    totalCajas: 1200,
    pesoTotalKg: 24000,
    inspeccionPorteriaAprobada: true,
    creadoPorUsuarioId: 'usr-prov-02',
    creadoEn: `${YESTERDAY}T11:00:00Z`,
    actualizadoEn: `${TODAY}T09:15:00Z`
  },
  {
    id: 'cita-today-pro-02',
    codigoCita: 'CTA-2026-0906',
    sedeId: 'sede-pro-02',
    muelleId: 'mue-pro-02',
    proveedorId: 'prov-003',
    tipoOperacion: 'RECEPCION_PROVEEDOR',
    estado: 'CONFIRMADA',
    fechaCita: TODAY,
    conductorId: 'cond-001',
    vehiculoId: 'veh-001',
    tiempos: {
      horaProgramadaInicio: `${TODAY}T13:30:00Z`,
      horaProgramadaFin: `${TODAY}T15:00:00Z`,
      duracionEstimadaMinutos: 90
    },
    items: [
      {
        id: 'item-today-07',
        citaId: 'cita-today-pro-02',
        materialId: 'mat-004',
        sku: 'SKU-ASEO-040',
        descripcion: 'Insumos Químicos de Limpieza Grado Alimentario',
        cantidadUnidades: 500,
        cantidadEstibas: 10,
        pesoTotalKg: 9200,
        ordenCompraNumero: 'OC-PROD-5502'
      }
    ],
    totalEstibas: 10,
    totalCajas: 500,
    pesoTotalKg: 9200,
    inspeccionPorteriaAprobada: false,
    creadoPorUsuarioId: 'usr-prov-03',
    creadoEn: `${YESTERDAY}T15:00:00Z`,
    actualizadoEn: `${YESTERDAY}T15:00:00Z`
  },

  // --- CITAS DE HOY: SEDE COMERCIAL ---
  {
    id: 'cita-today-com-01',
    codigoCita: 'CTA-2026-0907',
    sedeId: 'sede-com-03',
    muelleId: 'mue-com-01',
    proveedorId: 'prov-001',
    tipoOperacion: 'RECEPCION_PROVEEDOR',
    estado: 'CONFIRMADA',
    fechaCita: TODAY,
    conductorId: 'cond-001',
    vehiculoId: 'veh-001',
    tiempos: {
      horaProgramadaInicio: `${TODAY}T10:30:00Z`,
      horaProgramadaFin: `${TODAY}T11:45:00Z`,
      duracionEstimadaMinutos: 75
    },
    items: [
      {
        id: 'item-today-08',
        citaId: 'cita-today-com-01',
        materialId: 'mat-001',
        sku: 'SKU-LACT-001',
        descripcion: 'Lácteos para Distribución Retail',
        cantidadUnidades: 6000,
        cantidadEstibas: 6,
        pesoTotalKg: 5100,
        ordenCompraNumero: 'OC-COM-7701'
      }
    ],
    totalEstibas: 6,
    totalCajas: 600,
    pesoTotalKg: 5100,
    inspeccionPorteriaAprobada: false,
    creadoPorUsuarioId: 'usr-prov-01',
    creadoEn: `${YESTERDAY}T09:00:00Z`,
    actualizadoEn: `${YESTERDAY}T09:00:00Z`
  },

  // --- CITAS DE MAÑANA (Agendadas a futuro) ---
  {
    id: 'cita-tmrw-rio-01',
    codigoCita: 'CTA-2026-0908',
    sedeId: 'sede-rio-01',
    muelleId: 'mue-rio-01',
    proveedorId: 'prov-001',
    tipoOperacion: 'RECEPCION_PROVEEDOR',
    estado: 'CONFIRMADA',
    fechaCita: TOMORROW,
    conductorId: 'cond-001',
    vehiculoId: 'veh-001',
    tiempos: {
      horaProgramadaInicio: `${TOMORROW}T08:00:00Z`,
      horaProgramadaFin: `${TOMORROW}T09:30:00Z`,
      duracionEstimadaMinutos: 90
    },
    items: [
      {
        id: 'item-tmrw-01',
        citaId: 'cita-tmrw-rio-01',
        materialId: 'mat-001',
        sku: 'SKU-LACT-001',
        descripcion: 'Leche Deslactosada y Derivados',
        cantidadUnidades: 12000,
        cantidadEstibas: 12,
        pesoTotalKg: 10200,
        ordenCompraNumero: 'OC-SAP-99100'
      }
    ],
    totalEstibas: 12,
    totalCajas: 1200,
    pesoTotalKg: 10200,
    inspeccionPorteriaAprobada: false,
    creadoPorUsuarioId: 'usr-prov-01',
    creadoEn: `${TODAY}T07:00:00Z`,
    actualizadoEn: `${TODAY}T07:00:00Z`
  },
  {
    id: 'cita-tmrw-rio-02',
    codigoCita: 'CTA-2026-0909',
    sedeId: 'sede-rio-01',
    muelleId: 'mue-rio-02',
    proveedorId: 'prov-002',
    tipoOperacion: 'RECEPCION_PROVEEDOR',
    estado: 'SOLICITADA',
    fechaCita: TOMORROW,
    conductorId: 'cond-002',
    vehiculoId: 'veh-002',
    tiempos: {
      horaProgramadaInicio: `${TOMORROW}T11:00:00Z`,
      horaProgramadaFin: `${TOMORROW}T12:30:00Z`,
      duracionEstimadaMinutos: 90
    },
    items: [
      {
        id: 'item-tmrw-02',
        citaId: 'cita-tmrw-rio-02',
        materialId: 'mat-002',
        sku: 'SKU-ABAR-015',
        descripcion: 'Granos y Cereales Importados',
        cantidadUnidades: 800,
        cantidadEstibas: 16,
        pesoTotalKg: 16000,
        ordenCompraNumero: 'OC-SAP-99105'
      }
    ],
    totalEstibas: 16,
    totalCajas: 800,
    pesoTotalKg: 16000,
    inspeccionPorteriaAprobada: false,
    creadoPorUsuarioId: 'usr-prov-02',
    creadoEn: `${TODAY}T08:30:00Z`,
    actualizadoEn: `${TODAY}T08:30:00Z`
  },

  // --- CITAS FECHA DEMO FIJA (2026-02-27) ---
  {
    id: 'cita-2026-001',
    codigoCita: 'CTA-2026-0891',
    sedeId: 'sede-rio-01',
    muelleId: 'mue-rio-01',
    proveedorId: 'prov-001',
    tipoOperacion: 'RECEPCION_PROVEEDOR',
    estado: 'EN_MUELLE',
    conductorId: 'cond-001',
    vehiculoId: 'veh-001',
    fechaCita: FIXED_DEMO_DATE,
    tiempos: {
      horaProgramadaInicio: '2026-02-27T08:00:00Z',
      horaProgramadaFin: '2026-02-27T09:30:00Z',
      duracionEstimadaMinutos: 90,
      horaLlegadaPorteria: '2026-02-27T07:48:00Z',
      horaIngresoPlanta: '2026-02-27T07:55:00Z',
      horaLlamadoMuelle: '2026-02-27T08:02:00Z',
      horaInicioDescargue: '2026-02-27T08:10:00Z',
      minutosRetrasoLlegada: 0,
      tiempoTotalEstadiaMinutos: 45
    },
    items: [
      {
        id: 'item-001',
        citaId: 'cita-2026-001',
        materialId: 'mat-001',
        sku: 'SKU-LACT-001',
        descripcion: 'Leche Entera UHT 1000ml (Caja x 12 unds)',
        cantidadUnidades: 14400,
        cantidadEstibas: 12,
        pesoTotalKg: 10200,
        ordenCompraNumero: 'OC-SAP-88390',
        facturaRemision: 'FAC-E-99412',
        temperaturaObjetivoCelsius: 4
      },
      {
        id: 'item-002',
        citaId: 'cita-2026-001',
        materialId: 'mat-003',
        sku: 'SKU-FRIO-088',
        descripcion: 'Queso Doble Crema Bloque 2.5kg',
        cantidadUnidades: 2400,
        cantidadEstibas: 4,
        pesoTotalKg: 2480,
        ordenCompraNumero: 'OC-SAP-88390',
        facturaRemision: 'FAC-E-99412',
        temperaturaObjetivoCelsius: 2
      }
    ],
    totalEstibas: 16,
    totalCajas: 1200,
    pesoTotalKg: 12680,
    observacionesOperativas: 'Recepción refrigerada urgente con termógrafo en rango (3.2°C)',
    inspeccionPorteriaAprobada: true,
    creadoPorUsuarioId: 'usr-prov-01',
    creadoEn: '2026-02-25T14:20:00Z',
    actualizadoEn: '2026-02-27T08:10:00Z'
  },
  {
    id: 'cita-2026-002',
    codigoCita: 'CTA-2026-0892',
    sedeId: 'sede-rio-01',
    muelleId: 'mue-rio-02',
    proveedorId: 'prov-002',
    tipoOperacion: 'RECEPCION_PROVEEDOR',
    estado: 'CONFIRMADA',
    conductorId: 'cond-002',
    vehiculoId: 'veh-002',
    fechaCita: FIXED_DEMO_DATE,
    tiempos: {
      horaProgramadaInicio: '2026-02-27T10:00:00Z',
      horaProgramadaFin: '2026-02-27T11:40:00Z',
      duracionEstimadaMinutos: 100
    },
    items: [
      {
        id: 'item-003',
        citaId: 'cita-2026-002',
        materialId: 'mat-002',
        sku: 'SKU-ABAR-015',
        descripcion: 'Arroz Premium Selección Especial Saco 25kg',
        cantidadUnidades: 800,
        cantidadEstibas: 20,
        pesoTotalKg: 20000,
        ordenCompraNumero: 'OC-SAP-91024'
      }
    ],
    totalEstibas: 20,
    totalCajas: 800,
    pesoTotalKg: 20000,
    inspeccionPorteriaAprobada: false,
    creadoPorUsuarioId: 'usr-prov-02',
    creadoEn: '2026-02-25T16:00:00Z',
    actualizadoEn: '2026-02-26T09:15:00Z'
  },
  {
    id: 'cita-2026-003',
    codigoCita: 'CTA-2026-0893',
    sedeId: 'sede-rio-01',
    muelleId: 'mue-rio-03',
    proveedorId: 'prov-003',
    tipoOperacion: 'RECEPCION_PROVEEDOR',
    estado: 'SOLICITADA',
    fechaCita: FIXED_DEMO_DATE,
    conductorId: 'cond-001',
    vehiculoId: 'veh-001',
    tiempos: {
      horaProgramadaInicio: '2026-02-27T14:00:00Z',
      horaProgramadaFin: '2026-02-27T14:45:00Z',
      duracionEstimadaMinutos: 45
    },
    items: [
      {
        id: 'item-004',
        citaId: 'cita-2026-003',
        materialId: 'mat-004',
        sku: 'SKU-ASEO-040',
        descripcion: 'Detergente Líquido Concentrado 3000ml',
        cantidadUnidades: 350,
        cantidadEstibas: 7,
        pesoTotalKg: 6440,
        ordenCompraNumero: 'OC-SAP-92140'
      }
    ],
    totalEstibas: 7,
    totalCajas: 350,
    pesoTotalKg: 6440,
    inspeccionPorteriaAprobada: false,
    creadoPorUsuarioId: 'usr-prov-03',
    creadoEn: '2026-02-26T18:30:00Z',
    actualizadoEn: '2026-02-26T18:30:00Z'
  }
];

export const MOCK_RESERVAS_TEMPORALES: ReservaTemporal[] = [
  {
    id: 'res-temp-901',
    tokenReserva: 'RSV-TMP-881923',
    sedeId: 'sede-rio-01',
    muelleId: 'mue-rio-01',
    proveedorId: 'prov-001',
    fecha: TODAY,
    horaInicio: '15:00',
    horaFin: '16:00',
    duracionCalculadaMinutos: 60,
    expiraEn: new Date(Date.now() + 8 * 60 * 1000).toISOString(),
    creadoEn: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    estado: 'ACTIVA'
  }
];
