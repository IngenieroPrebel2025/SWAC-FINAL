// Contratos de datos para Dashboards Gerenciales, KPIs de Operación e Inteligencia Artificial / OCR (FASE 7)

export interface MetricasGerencialesGlobales {
  otifGlobalPorcentaje: number;
  otifMetaPorcentaje: number;
  ocupacionMuellesPorcentaje: number;
  dwellTimePromedioMinutos: number;
  dwellTimeMetaMinutos: number;
  citasTotalesHoy: number;
  citasCompletadasHoy: number;
  citasEnProcesoHoy: number;
  citasCanceladasHoy: number;
  citasRechazadasPorteriaHoy: number;
  estibasProcesadasHoy: number;
  estibasCapacidadTotalHoy: number;
  toneladasMovilizadasHoy: number;
  emisionesCo2EvitadasKg: number;
  tiempoAhorradoPorteriaMinutos: number;
}

export interface CurvaDemandaHoraria {
  hora: string; // ej. "06:00", "07:00", ...
  capacidadDisponibleEstibas: number;
  demandaAgendadaEstibas: number;
  muellesOcupados: number;
  muellesTotales: number;
  nivelCongestion: 'OPTIMO' | 'ALERTA' | 'SATURADO';
}

export interface ScorecardProveedorItem {
  proveedorId: string;
  nombreProveedor: string;
  totalCitasMes: number;
  puntualidadPorcentaje: number;
  cumplimientoEstibasPorcentaje: number;
  rechazosPorteriaCount: number;
  dwellTimePromedioMins: number;
  calificacionGeneral: number; // 1 a 5 estrellas
  nivelRiesgo: 'BAJO' | 'MEDIO' | 'ALTO';
}

export interface DesgloseDwellTime {
  fase: string;
  tiempoMinutos: number;
  porcentaje: number;
  color: string;
  slaMinutos: number;
  estado: 'DENTRO_SLA' | 'EN_RIESGO' | 'FUERA_SLA';
}

export interface DistribucionMateriales {
  categoria: string;
  citasCount: number;
  estibasCount: number;
  porcentaje: number;
  color: string;
}

export interface RecomendacionOptimizacionIA {
  id: string;
  tipo: 'REASIGNACION_MUELLE' | 'PREVENCION_CUELLO_BOTELLA' | 'REGLA_TEMPERATURA' | 'EQUILIBRIO_CUADRILLA';
  nivelUrgencia: 'CRITICA' | 'MEDIA' | 'INFORMATIVA';
  titulo: string;
  descripcion: string;
  impactoEstimado: string;
  accionSugerida: string;
  aplicado: boolean;
  sedeId: string;
}

export interface DocumentoOcrAnalisis {
  id: string;
  tipoDocumento: 'REMISION_ENTREGA' | 'ORDEN_COMPRA_SAP' | 'CERTIFICADO_CALIDAD' | 'FOTO_PLACA_VEHICULAR';
  nombreArchivo: string;
  confianzaGlobal: number; // ej. 98.4
  fechaProcesamiento: string;
  datosExtraidos: {
    numeroDocumento?: string;
    proveedorNit?: string;
    proveedorRazonSocial?: string;
    placaVehiculo?: string;
    conductorNombre?: string;
    conductorCedula?: string;
    temperaturaRequeridaC?: number;
    temperaturaRegistradaC?: number;
    totalEstibas?: number;
    ordenCompraRelacionada?: string;
    itemsDetalle?: Array<{
      codigoSku: string;
      descripcion: string;
      cantidad: number;
      unidadMedida: string;
    }>;
  };
  discrepanciasDetectadas: Array<{
    campo: string;
    valorDocumento: string;
    valorCitaSistema: string;
    gravedad: 'BLOQUEANTE' | 'ADVERTENCIA' | 'INFO';
    explicacion: string;
  }>;
  estadoValidacion: 'VALIDO' | 'CON_DISCREPANCIAS' | 'RECHAZADO_AUTOMATICO';
}
