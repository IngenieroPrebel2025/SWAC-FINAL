// Contratos de datos para Sedes, Muelles y Disponibilidad Operativa

export type TipoMuelle = 'RECEPCION' | 'DESPACHO' | 'MIXTO' | 'DEVOLUCIONES' | 'CROSS_DOCKING';

export type EstadoMuelle = 'DISPONIBLE' | 'OCUPADO' | 'MANTENIMIENTO' | 'INACTIVO' | 'RESERVADO';

export type TipoMaterialPermitido = 'SECOS' | 'REFRIGERADOS' | 'CONGELADOS' | 'PELIGROSOS' | 'VALOR' | 'GRANEL';

export interface Sede {
  id: string;
  codigo: string; // ej. "CD-BOG-01"
  nombre: string;
  direccion: string;
  ciudad: string;
  departamentoOEstado: string;
  pais: string;
  zonaHoraria: string; // ej. "America/Bogota"
  telefonoContacto: string;
  emailContacto: string;
  activo: boolean;
  diasNoLaborables: string[]; // ISO Dates "YYYY-MM-DD"
  horarioApertura: string; // "06:00"
  horarioCierre: string; // "22:00"
  tiempoSlotMinutosDefecto: number; // ej. 30 o 45
  toleranciaImpuntualidadMinutos: number; // ej. 15
  capacidadSimultaneaMuelles: number;
  creadoEn: string;
  actualizadoEn: string;
}

export interface Muelle {
  id: string;
  sedeId: string;
  codigoMuelle: string; // ej. "MUE-01", "MUE-02"
  nombre: string; // ej. "Muelle 1 - Refrigerados"
  tipo: TipoMuelle;
  materialesPermitidos: TipoMaterialPermitido[];
  alturaMaximaMetros?: number;
  pesoMaximoToneladas?: number;
  tieneRampaNiveladora: boolean;
  tiempoMaximoOperacionMinutos: number; // ej. 120
  tiempoBufferEntreCitasMinutos: number; // ej. 15
  estadoActual: EstadoMuelle;
  activo: boolean;
  observaciones?: string;
  creadoEn: string;
  actualizadoEn: string;
}

export interface MuelleDisponibilidadLog {
  id: string;
  muelleId: string;
  sedeId: string;
  fecha: string; // "YYYY-MM-DD"
  horaInicio: string; // "08:00"
  horaFin: string; // "14:00"
  estadoHabilitado: boolean;
  motivoCambio: string; // ej. "Falta de personal en turno", "Mantenimiento preventivo"
  usuarioId: string;
  registradoEn: string;
}
