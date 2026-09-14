// Contratos de datos para el Constructor de Formularios Dinámicos y Fases de Workflow

export type TipoCampoFormulario =
  | 'TEXTO'
  | 'TEXTO_LARGO'
  | 'NUMERO'
  | 'SELECT'
  | 'MULTI_SELECT'
  | 'CHECKBOX'
  | 'FECHA'
  | 'HORA'
  | 'DOCUMENTO_ADJUNTO'
  | 'FOTO_EVIDENCIA'
  | 'FIRMA_DIGITAL'
  | 'SELECTOR_DEPENDIENTE'
  | 'CAMPO_CALCULADO';

export type FaseWorkflow =
  | 'SOLICITUD_PROVEEDOR'
  | 'DATOS_VEHICULO_CONDUCTOR'
  | 'VALIDACION_DOCUMENTAL'
  | 'LLEGADA_PORTERIA'
  | 'INSPECCION_SEGURIDAD'
  | 'ASIGNACION_MUELLE'
  | 'OPERACION_DESCARGUE'
  | 'SALIDA_PLANTA';

export interface ReglaCondicionalPregunta {
  id: string;
  campoOrigenId: string; // ID de otra pregunta
  operador: 'IGUAL' | 'DIFERENTE' | 'MAYOR_QUE' | 'MENOR_QUE' | 'CONTIENE' | 'NO_CONTIENE' | 'ES_VERDADERO' | 'ES_FALSO';
  valorComparacion: any;
  accion: 'MOSTRAR' | 'OCULTAR' | 'HACER_REQUERIDO' | 'DESHABILITAR' | 'CALCULAR_VALOR';
}

export interface OpcionSelector {
  valor: string;
  etiqueta: string;
  padreValorDependiente?: string; // Para selectores dependientes (ej. Ciudad depende de Departamento)
}

export interface PreguntaFormulario {
  id: string;
  formularioId: string;
  codigoIdentificador: string; // ej. "tiene_remolque", "placa_remolque", "temp_termografo"
  etiqueta: string;
  tipoCampo: TipoCampoFormulario;
  placeholder?: string;
  ayudaTexto?: string;
  orden: number;
  esRequerido: boolean;
  opciones?: OpcionSelector[];
  formulaCalculo?: string; // ej. "peso_bruto - peso_tara"
  reglasCondicionales: ReglaCondicionalPregunta[];
  validaciones?: {
    min?: number;
    max?: number;
    patronRegex?: string;
    mensajeError?: string;
    formatosPermitidos?: string[]; // ej. [".pdf", ".jpg"]
    tamanioMaximoMb?: number;
  };
}

export interface FormularioDinamico {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  faseWorkflow: FaseWorkflow;
  sedeId?: string; // Si aplica a sede específica o todas
  tipoOperacion?: string;
  preguntas: PreguntaFormulario[];
  version: number;
  activo: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

export interface RespuestaFormularioCita {
  id: string;
  citaId: string;
  formularioId: string;
  faseWorkflow: FaseWorkflow;
  respuestasPorCampo: Record<string, any>; // { "tiene_remolque": true, "placa_remolque": "R-102" }
  completadoPorUsuarioId: string;
  completadoEn: string;
}
