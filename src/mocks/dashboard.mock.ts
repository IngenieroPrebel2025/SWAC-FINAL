import {
  MetricasGerencialesGlobales,
  CurvaDemandaHoraria,
  ScorecardProveedorItem,
  DesgloseDwellTime,
  DistribucionMateriales,
  RecomendacionOptimizacionIA,
  DocumentoOcrAnalisis
} from '@/types';

export const MOCK_METRICAS_GERENCIALES: MetricasGerencialesGlobales = {
  otifGlobalPorcentaje: 96.8,
  otifMetaPorcentaje: 95.0,
  ocupacionMuellesPorcentaje: 84.2,
  dwellTimePromedioMinutos: 54,
  dwellTimeMetaMinutos: 90,
  citasTotalesHoy: 148,
  citasCompletadasHoy: 112,
  citasEnProcesoHoy: 28,
  citasCanceladasHoy: 5,
  citasRechazadasPorteriaHoy: 3,
  estibasProcesadasHoy: 3640,
  estibasCapacidadTotalHoy: 4320,
  toneladasMovilizadasHoy: 1845.6,
  emisionesCo2EvitadasKg: 420.5,
  tiempoAhorradoPorteriaMinutos: 1420
};

export const MOCK_CURVA_DEMANDA_HORARIA: CurvaDemandaHoraria[] = [
  { hora: '06:00', capacidadDisponibleEstibas: 360, demandaAgendadaEstibas: 280, muellesOcupados: 4, muellesTotales: 8, nivelCongestion: 'OPTIMO' },
  { hora: '07:00', capacidadDisponibleEstibas: 360, demandaAgendadaEstibas: 340, muellesOcupados: 6, muellesTotales: 8, nivelCongestion: 'OPTIMO' },
  { hora: '08:00', capacidadDisponibleEstibas: 480, demandaAgendadaEstibas: 460, muellesOcupados: 8, muellesTotales: 8, nivelCongestion: 'ALERTA' },
  { hora: '09:00', capacidadDisponibleEstibas: 480, demandaAgendadaEstibas: 490, muellesOcupados: 8, muellesTotales: 8, nivelCongestion: 'SATURADO' },
  { hora: '10:00', capacidadDisponibleEstibas: 480, demandaAgendadaEstibas: 430, muellesOcupados: 7, muellesTotales: 8, nivelCongestion: 'OPTIMO' },
  { hora: '11:00', capacidadDisponibleEstibas: 480, demandaAgendadaEstibas: 390, muellesOcupados: 6, muellesTotales: 8, nivelCongestion: 'OPTIMO' },
  { hora: '12:00', capacidadDisponibleEstibas: 360, demandaAgendadaEstibas: 220, muellesOcupados: 4, muellesTotales: 8, nivelCongestion: 'OPTIMO' },
  { hora: '13:00', capacidadDisponibleEstibas: 360, demandaAgendadaEstibas: 310, muellesOcupados: 5, muellesTotales: 8, nivelCongestion: 'OPTIMO' },
  { hora: '14:00', capacidadDisponibleEstibas: 480, demandaAgendadaEstibas: 470, muellesOcupados: 8, muellesTotales: 8, nivelCongestion: 'ALERTA' },
  { hora: '15:00', capacidadDisponibleEstibas: 480, demandaAgendadaEstibas: 450, muellesOcupados: 7, muellesTotales: 8, nivelCongestion: 'OPTIMO' },
  { hora: '16:00', capacidadDisponibleEstibas: 480, demandaAgendadaEstibas: 380, muellesOcupados: 6, muellesTotales: 8, nivelCongestion: 'OPTIMO' },
  { hora: '17:00', capacidadDisponibleEstibas: 360, demandaAgendadaEstibas: 260, muellesOcupados: 4, muellesTotales: 8, nivelCongestion: 'OPTIMO' },
  { hora: '18:00', capacidadDisponibleEstibas: 240, demandaAgendadaEstibas: 180, muellesOcupados: 3, muellesTotales: 8, nivelCongestion: 'OPTIMO' }
];

export const MOCK_SCORECARD_PROVEEDORES: ScorecardProveedorItem[] = [
  {
    proveedorId: 'prov-001',
    nombreProveedor: 'Lácteos Andinos S.A.S.',
    totalCitasMes: 48,
    puntualidadPorcentaje: 98.2,
    cumplimientoEstibasPorcentaje: 99.4,
    rechazosPorteriaCount: 0,
    dwellTimePromedioMins: 46,
    calificacionGeneral: 4.9,
    nivelRiesgo: 'BAJO'
  },
  {
    proveedorId: 'prov-002',
    nombreProveedor: 'Frutas & Hortalizas del Valle',
    totalCitasMes: 36,
    puntualidadPorcentaje: 94.5,
    cumplimientoEstibasPorcentaje: 96.0,
    rechazosPorteriaCount: 1,
    dwellTimePromedioMins: 52,
    calificacionGeneral: 4.7,
    nivelRiesgo: 'BAJO'
  },
  {
    proveedorId: 'prov-003',
    nombreProveedor: 'Cárnicos y Embutidos Premium',
    totalCitasMes: 29,
    puntualidadPorcentaje: 88.0,
    cumplimientoEstibasPorcentaje: 92.5,
    rechazosPorteriaCount: 2,
    dwellTimePromedioMins: 68,
    calificacionGeneral: 4.1,
    nivelRiesgo: 'MEDIO'
  },
  {
    proveedorId: 'prov-004',
    nombreProveedor: 'Abarrotes & Granos Central',
    totalCitasMes: 52,
    puntualidadPorcentaje: 97.0,
    cumplimientoEstibasPorcentaje: 98.1,
    rechazosPorteriaCount: 0,
    dwellTimePromedioMins: 48,
    calificacionGeneral: 4.8,
    nivelRiesgo: 'BAJO'
  },
  {
    proveedorId: 'prov-005',
    nombreProveedor: 'Empaques y Plásticos Industriales',
    totalCitasMes: 22,
    puntualidadPorcentaje: 79.5,
    cumplimientoEstibasPorcentaje: 85.0,
    rechazosPorteriaCount: 3,
    dwellTimePromedioMins: 82,
    calificacionGeneral: 3.4,
    nivelRiesgo: 'ALTO'
  }
];

export const MOCK_DESGLOSE_DWELL_TIME: DesgloseDwellTime[] = [
  { fase: 'Inspección & Garita', tiempoMinutos: 7, porcentaje: 13.0, color: '#10B981', slaMinutos: 10, estado: 'DENTRO_SLA' },
  { fase: 'Espera en Patio / Cola', tiempoMinutos: 14, porcentaje: 26.0, color: '#F59E0B', slaMinutos: 20, estado: 'DENTRO_SLA' },
  { fase: 'Acople y Descargue Muelle', tiempoMinutos: 28, porcentaje: 51.8, color: '#6366F1', slaMinutos: 45, estado: 'DENTRO_SLA' },
  { fase: 'Paz y Salvo & Checkout', tiempoMinutos: 5, porcentaje: 9.2, color: '#06B6D4', slaMinutos: 10, estado: 'DENTRO_SLA' }
];

export const MOCK_DISTRIBUCION_MATERIALES: DistribucionMateriales[] = [
  { categoria: 'Lácteos & Refrigerados (2-4°C)', citasCount: 54, estibasCount: 1420, porcentaje: 39.0, color: '#0284C7' },
  { categoria: 'Secos, Granos & Abarrotes', citasCount: 46, estibasCount: 1240, porcentaje: 34.0, color: '#6366F1' },
  { categoria: 'Frutas & Perecederos Frescos', citasCount: 28, estibasCount: 580, porcentaje: 16.0, color: '#10B981' },
  { categoria: 'Congelados (-18°C)', citasCount: 12, estibasCount: 260, porcentaje: 7.0, color: '#8B5CF6' },
  { categoria: 'Empaques & Químicos de Limpieza', citasCount: 8, estibasCount: 140, porcentaje: 4.0, color: '#F59E0B' }
];

export const MOCK_RECOMENDACIONES_IA: RecomendacionOptimizacionIA[] = [
  {
    id: 'ia-rec-001',
    tipo: 'PREVENCION_CUELLO_BOTELLA',
    nivelUrgencia: 'CRITICA',
    titulo: 'Pico de Descarga Refrigerada Proyectado (09:00 - 10:30 AM)',
    descripcion: 'Se detecta un traslape de 4 camiones refrigerados para 2 bahías de frío habilitadas en Sede Rionegro. Riesgo de 35 min de dwell time adicional.',
    impactoEstimado: 'Ahorro de 28 min/camión y mitigación de rotura de cadena de frío.',
    accionSugerida: 'Habilitar temporalmente la Bahía M-03 como Muelle Reversible de Frío y asignar Cuadrilla de Apoyo #2.',
    aplicado: false,
    sedeId: 'sede-rio-01'
  },
  {
    id: 'ia-rec-002',
    tipo: 'EQUILIBRIO_CUADRILLA',
    nivelUrgencia: 'MEDIA',
    titulo: 'Rebalanceo de Cuadrillas en Muelle 02 (Abarrotes Pesados)',
    descripcion: 'Llegada programada de 30 estibas de arroz y granos a las 14:00. Con la cuadrilla estándar de 2 estibadores tomará 65 min.',
    impactoEstimado: 'Reducción del tiempo de descargue a 38 min con cumplimiento de SLA de ventana.',
    accionSugerida: 'Reforzar con 1 estibador adicional de la zona de consolidación de 14:00 a 15:00.',
    aplicado: false,
    sedeId: 'sede-rio-01'
  },
  {
    id: 'ia-rec-003',
    tipo: 'REASIGNACION_MUELLE',
    nivelUrgencia: 'INFORMATIVA',
    titulo: 'Optimización de Bahía Cercana a Cámara de Ultracongelados',
    descripcion: 'Camión de Cárnicos y Embutidos asignado en Muelle 04. Muelle 01 se desocupa a las 10:15.',
    impactoEstimado: 'Ahorro de 18 minutos de traslado en montacargas y menor pérdida de temperatura.',
    accionSugerida: 'Reasignar cita CTA-2026-0892 a Muelle 01 a las 10:15.',
    aplicado: true,
    sedeId: 'sede-rio-01'
  }
];

export const MOCK_DOCUMENTOS_OCR: DocumentoOcrAnalisis[] = [
  {
    id: 'ocr-doc-001',
    tipoDocumento: 'REMISION_ENTREGA',
    nombreArchivo: 'Remision_LacteosAndinos_FE9023.pdf',
    confianzaGlobal: 98.7,
    fechaProcesamiento: '2026-08-27T08:15:30Z',
    datosExtraidos: {
      numeroDocumento: 'REM-2026-9023',
      proveedorNit: '900.834.122-4',
      proveedorRazonSocial: 'LÁCTEOS ANDINOS S.A.S.',
      placaVehiculo: 'WZM-481',
      conductorNombre: 'Jairo Antonio Ramírez',
      conductorCedula: '79.432.110',
      temperaturaRequeridaC: 4.0,
      temperaturaRegistradaC: 3.8,
      totalEstibas: 24,
      ordenCompraRelacionada: 'OC-2026-7811',
      itemsDetalle: [
        { codigoSku: 'SKU-LAC-001', descripcion: 'Leche Entera UHT 1000ml (Caja x 12)', cantidad: 1200, unidadMedida: 'CAJAS' },
        { codigoSku: 'SKU-LAC-002', descripcion: 'Yogurt Griego Fresa 150g', cantidad: 800, unidadMedida: 'BANDEJAS' },
        { codigoSku: 'SKU-LAC-003', descripcion: 'Queso Campesino Bloque 500g', cantidad: 450, unidadMedida: 'BLOQUES' }
      ]
    },
    discrepanciasDetectadas: [],
    estadoValidacion: 'VALIDO'
  },
  {
    id: 'ocr-doc-002',
    tipoDocumento: 'ORDEN_COMPRA_SAP',
    nombreArchivo: 'Remision_FrutasValle_FV8821.jpg',
    confianzaGlobal: 95.4,
    fechaProcesamiento: '2026-08-27T08:24:10Z',
    datosExtraidos: {
      numeroDocumento: 'REM-FV-8821',
      proveedorNit: '890.321.455-9',
      proveedorRazonSocial: 'FRUTAS & HORTALIZAS DEL VALLE S.A.',
      placaVehiculo: 'TNV-902',
      conductorNombre: 'Alfonso Gómez Vargas',
      conductorCedula: '19.882.341',
      temperaturaRequeridaC: 6.0,
      temperaturaRegistradaC: 9.5,
      totalEstibas: 18,
      ordenCompraRelacionada: 'OC-2026-7815',
      itemsDetalle: [
        { codigoSku: 'SKU-FRU-001', descripcion: 'Tomate Chonto Seleccionado', cantidad: 600, unidadMedida: 'CANASTILLAS' },
        { codigoSku: 'SKU-FRU-002', descripcion: 'Cebolla Cabezona Roja', cantidad: 400, unidadMedida: 'BULTOS' }
      ]
    },
    discrepanciasDetectadas: [
      {
        campo: 'Temperatura Termográfica',
        valorDocumento: '9.5°C Registrada en furgón',
        valorCitaSistema: 'Máximo 6.0°C según Ficha Técnica',
        gravedad: 'ADVERTENCIA',
        explicacion: 'La temperatura supera en +3.5°C la tolerancia pactada. Requiere inspección de calidad antes del descargue.'
      },
      {
        campo: 'Total Estibas Declaradas',
        valorDocumento: '18 Estibas',
        valorCitaSistema: '16 Estibas en Cita Programada',
        gravedad: 'INFO',
        explicacion: '2 estibas adicionales respecto al slot reservado (+12.5% volumen).'
      }
    ],
    estadoValidacion: 'CON_DISCREPANCIAS'
  },
  {
    id: 'ocr-doc-003',
    tipoDocumento: 'FOTO_PLACA_VEHICULAR',
    nombreArchivo: 'Camara_Garita_ANPR_WZM481.jpg',
    confianzaGlobal: 99.4,
    fechaProcesamiento: '2026-08-27T08:05:00Z',
    datosExtraidos: {
      placaVehiculo: 'WZM-481',
      conductorNombre: 'Jairo Antonio Ramírez'
    },
    discrepanciasDetectadas: [],
    estadoValidacion: 'VALIDO'
  }
];
