// Contratos de datos para Citas, Detalle de Carga y Reservas Temporales

export type EstadoCita =
  | 'RESERVA_TEMPORAL'
  | 'SOLICITADA'
  | 'CONFIRMADA'
  | 'EN_PORTERIA'
  | 'EN_MUELLE'
  | 'DESCARGANDO'
  | 'COMPLETADA'
  | 'CANCELADA'
  | 'RECHAZADA'
  | 'NO_SHOW';

export type TipoOperacionCita = 'RECEPCION_PROVEEDOR' | 'DEVOLUCION' | 'TRANSFERENCIA_INTERNA' | 'DESPACHO_CLIENTE';

export interface CitaDetalleItem {
  id: string;
  citaId: string;
  materialId: string;
  sku: string;
  descripcion: string;
  cantidadUnidades: number;
  cantidadEstibas: number;
  pesoTotalKg: number;
  ordenCompraNumero?: string;
  facturaRemision?: string;
  temperaturaObjetivoCelsius?: number;
}

export interface CitaTiemposOperacion {
  horaProgramadaInicio: string; // ISO DateTime
  horaProgramadaFin: string; // ISO DateTime
  duracionEstimadaMinutos: number;
  horaLlegadaPorteria?: string; // ISO DateTime
  horaIngresoPlanta?: string; // ISO DateTime
  horaLlamadoMuelle?: string; // ISO DateTime
  horaInicioDescargue?: string; // ISO DateTime
  horaFinDescargue?: string; // ISO DateTime
  horaSalidaPlanta?: string; // ISO DateTime
  minutosRetrasoLlegada?: number; // >0 impuntual
  tiempoTotalEstadiaMinutos?: number;
}

export interface Cita {
  id: string;
  codigoCita: string; // ej. "CTA-2026-0891"
  sedeId: string;
  muelleId: string;
  proveedorId: string;
  tipoOperacion: TipoOperacionCita;
  estado: EstadoCita;
  
  // Asignaciones
  conductorId?: string;
  vehiculoId?: string;
  
  // Tiempos
  fechaCita: string; // "YYYY-MM-DD"
  tiempos: CitaTiemposOperacion;
  
  // Detalles de carga
  items: CitaDetalleItem[];
  totalEstibas: number;
  totalCajas: number;
  pesoTotalKg: number;
  
  // Control y trazabilidad
  motivoRechazoOCancelacion?: string;
  observacionesOperativas?: string;
  inspeccionPorteriaAprobada?: boolean;
  firmaConductorUrl?: string;
  firmaReceptorUrl?: string;
  
  // Meta
  creadoPorUsuarioId: string;
  creadoEn: string;
  actualizadoEn: string;
}

export interface ReservaTemporal {
  id: string;
  tokenReserva: string;
  sedeId: string;
  muelleId: string;
  proveedorId: string;
  fecha: string; // "YYYY-MM-DD"
  horaInicio: string; // "10:00"
  horaFin: string; // "10:45"
  duracionCalculadaMinutos: number;
  expiraEn: string; // ISO DateTime (ej. 10 minutos desde creación)
  creadoEn: string;
  estado: 'ACTIVA' | 'CONVERTIDA_EN_CITA' | 'EXPIRADA' | 'LIBERADA';
}

export interface CalculoTiempoParametrizado {
  tipoMaterialId: string;
  cantidadEstibas: number;
  cantidadCajas?: number;
  tiempoBaseMinutos: number;
  tiempoCalculadoMinutos: number;
  formulaAplicada: string;
}

export interface SlotDisponible {
  horaInicio: string; // "08:00"
  horaFin: string; // "09:30"
  duracionMinutos: number;
  muelleId: string;
  muelleNombre: string;
  muelleCodigo: string;
  esRefrigerado: boolean;
  scoreIdoneidad: number; // 0 - 100
  motivoRecomendacion: string;
  disponible: boolean;
  conflictoCitaCodigo?: string;
}

export interface SlotSearchFilter {
  sedeId: string;
  fecha: string; // "YYYY-MM-DD"
  tipoOperacion: TipoOperacionCita;
  tipoMaterialId: string;
  cantidadEstibas: number;
  cantidadCajas?: number;
  pesoTotalKg?: number;
  tipoVehiculo?: string;
  requiereRefrigeracion?: boolean;
  duracionSolicitadaMinutos?: number;
}

export interface ParametrosCapacidadDescargue {
  tiempoManiobraMinutos: number;
  tiempoBufferEntreCitasMinutos: number;
  minutosBasePorDefecto: number;
  minutosPorEstibaSecos: number;
  minutosPorEstibaFrio: number;
  minutosPorEstibaCongelado: number;
  minutosPorEstibaAseo: number;
  toleranciaImpuntualidadMinutos: number;
}
