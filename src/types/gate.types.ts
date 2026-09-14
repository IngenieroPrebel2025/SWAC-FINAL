// Contratos de datos para el Módulo de Portería, Inspección de Seguridad y Portal del Conductor (FASE 6)

export type EstadoTurnoPatio =
  | 'EN_COLA_EXTERNA'
  | 'EN_INSPECCION_GARITA'
  | 'EN_PATIO_ESPERA'
  | 'LLAMADO_A_MUELLE'
  | 'EN_MUELLE'
  | 'DESCARGANDO'
  | 'DESCARGADO_LISTO_SALIDA'
  | 'SALIDA_REGISTRADA'
  | 'ACCESO_RECHAZADO';

export type ResultadoInspeccion = 'APROBADO' | 'RECHAZADO' | 'APROBADO_CON_OBSERVACIONES' | 'PENDIENTE';

export interface ItemChecklistPorteria {
  id: string;
  categoria: 'CONDUCTOR_SEGURIDAD' | 'VEHICULO_DOCUMENTOS' | 'ESTADO_MECANICO' | 'CARGA_FRIO_SELLOS';
  nombre: string;
  descripcion: string;
  esObligatorio: boolean;
  cumple: boolean;
  observacion?: string;
}

export interface InspeccionPorteria {
  id: string;
  citaId: string;
  codigoCita: string;
  sedeId: string;
  guardaSeguridadId: string;
  guardaSeguridadNombre: string;
  
  // Datos del Conductor verificado
  conductorId: string;
  conductorNombre: string;
  conductorCedula: string;
  arlVigente: boolean;
  epsVigente: boolean;
  eppCompleto: boolean; // Botas, chaleco, casco, gafas
  
  // Datos del Vehículo
  vehiculoId: string;
  vehiculoPlaca: string;
  soatVigente: boolean;
  tecnomecanicaVigente: boolean;
  
  // Furgón y Cadena de Frío
  inspeccionFurgonLimpio: boolean;
  libreOloresYPlagas: boolean;
  precintosRegistrados: string[];
  precintosCoincidenConRemision: boolean;
  temperaturaFurgonCelsius?: number;
  temperaturaCumpleRango: boolean;
  
  // Checklist Dinámico
  itemsChecklist: ItemChecklistPorteria[];
  
  // Dictamen y Horas
  resultado: ResultadoInspeccion;
  motivoRechazo?: string;
  observacionesGenerales?: string;
  fotosEvidencias: string[];
  
  fechaHoraInspeccion: string; // ISO
}

export interface TurnoPatio {
  id: string;
  citaId: string;
  codigoCita: string;
  codigoTurno: string; // ej. "PATIO-04"
  sedeId: string;
  muelleAsignadoId: string;
  muelleAsignadoNombre: string;
  vehiculoPlaca: string;
  conductorNombre: string;
  conductorTelefono: string;
  
  estado: EstadoTurnoPatio;
  horaLlegadaPorteria: string;
  horaIngresoPatio?: string;
  horaLlamadoMuelle?: string;
  horaPosicionadoEnMuelle?: string;
  horaInicioDescargue?: string;
  horaFinDescargue?: string;
  horaSalidaPlanta?: string;
  
  // Métricas
  minutosEnEsperaPatio: number;
  tiempoTotalEstadiaMinutos?: number;
  notificacionSmsEnviada: boolean;
  llamadasRealizadasCount: number;
  
  prioridad: 'ALTA' | 'NORMAL' | 'BAJA';
  observaciones?: string;
}

export interface RegistroSalidaPorteria {
  id: string;
  citaId: string;
  codigoCita: string;
  sedeId: string;
  vehiculoPlaca: string;
  conductorNombre: string;
  guardaSalidaNombre: string;
  
  horaSalida: string; // ISO
  remisionFirmadaYEntregada: boolean;
  inspeccionFurgonVacioOK: boolean;
  estibasRetornadasCount: number;
  novedadesSalida?: string;
  tiempoTotalEstadiaMinutos: number;
  cumplioSlaEstadia: boolean; // ej. <= 90 min
}

export interface DriverPortalSession {
  cita: import('./appointment.types').Cita;
  conductor: import('./vehicle.types').Conductor;
  vehiculo: import('./vehicle.types').Vehiculo;
  muelle?: import('./site.types').Muelle;
  sede?: import('./site.types').Sede;
  turnoPatio?: TurnoPatio;
  inspeccion?: InspeccionPorteria;
}
