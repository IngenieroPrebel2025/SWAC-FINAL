// Contratos de datos para Vehículos, Conductores e Inspección Documental

export type TipoVehiculo = 'TRACTOMULA' | 'DOBLETROQUE' | 'SENCILLO' | 'TURBO' | 'FURGON' | 'CAMIONETA';

export type EstadoDocumento = 'VIGENTE' | 'POR_VENCER' | 'VENCIDO' | 'EN_REVISION' | 'RECHAZADO';

export interface Conductor {
  id: string;
  tipoDocumento: 'CC' | 'CE' | 'PASAPORTE' | 'DNI';
  numeroDocumento: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  email?: string;
  eps: string;
  arl: string;
  licenciaConduccionNumero: string;
  licenciaConduccionCategoria: string; // ej. "C2", "C3"
  licenciaVigencia: string; // "YYYY-MM-DD"
  fotoUrl?: string;
  estado: 'ACTIVO' | 'BLOQUEADO' | 'PENDIENTE_VALIDACION';
  bloqueoMotivo?: string;
}

export interface Vehiculo {
  id: string;
  placa: string; // ej. "KLO-892"
  tipoVehiculo: TipoVehiculo;
  marca: string;
  modeloAnio: number;
  color: string;
  tieneRemolque: boolean;
  placaRemolque?: string;
  capacidadCargaKg: number;
  volumenMaximoM3: number;
  esRefrigerado: boolean;
  empresaTransportadora?: string;
  estado: 'HABILITADO' | 'INSPECCION_PENDIENTE' | 'RECHAZADO';
}

export interface DocumentoVehiculoConductor {
  id: string;
  entidadTipo: 'VEHICULO' | 'CONDUCTOR' | 'CITA';
  entidadId: string;
  tipoDocumento: 'SOAT' | 'TECNOMECANICA' | 'LICENCIA' | 'POLIZA_RCE' | 'CERTIFICADO_FUMIGACION' | 'PLANILLA_ARL';
  numeroDocumento?: string;
  fechaEmision: string; // "YYYY-MM-DD"
  fechaVencimiento: string; // "YYYY-MM-DD"
  archivoUrl: string;
  estado: EstadoDocumento;
  validadoPorOcr: boolean;
  confianzaOcrPorcentaje?: number;
  datosExtraidosOcr?: Record<string, any>;
  validadoPorUsuarioId?: string;
  observaciones?: string;
  subidoEn: string;
}
