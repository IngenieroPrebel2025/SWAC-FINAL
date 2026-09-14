// Contratos de datos para el Módulo Visual de Gestión de APIs e Integraciones

export type MetodoHttp = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type TipoAutenticacionApi = 'NONE' | 'API_KEY' | 'BEARER_TOKEN' | 'OAUTH2' | 'BASIC_AUTH';

export type ModoEjecucionIntegracion = 'MOCK_SYNTHETIC' | 'LIVE_REMOTE';

export interface ParametroCabecera {
  id: string;
  clave: string;
  valor: string;
  esSecreto: boolean;
  habilitado: boolean;
}

export interface MapeoCampoApi {
  id: string;
  campoOrigenApi: string; // ej. "cod_ref_sap", "doc_driver_number", "delivery_date"
  campoDestinoSistema: string; // ej. "sku", "conductor.numeroDocumento", "fechaCita"
  tipoDato: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'DATE_ISO' | 'ARRAY' | 'OBJECT';
  esRequerido: boolean;
  transformacionJs?: string; // ej. "value.trim().toUpperCase()"
  valorPorDefecto?: any;
}

export interface IntegracionApiConfig {
  id: string;
  nombreServicio: string; // ej. "SAP ERP S/4HANA", "Manhattan WMS", "RUNT MinTransporte"
  codigoIdentificador: string; // ej. "INT-SAP-MATERIALS", "INT-WMS-RECEIPT"
  descripcion: string;
  urlBase: string; // ej. "https://api.empresa.com/v1"
  endpoint: string; // ej. "/materials/validate"
  metodo: MetodoHttp;
  tipoAutenticacion: TipoAutenticacionApi;
  credenciales: {
    apiKeyHeaderName?: string;
    apiKeyValue?: string;
    bearerToken?: string;
    username?: string;
    password?: string;
    oauthTokenUrl?: string;
    oauthClientId?: string;
    oauthClientSecret?: string;
  };
  cabecerasPersonalizadas: ParametroCabecera[];
  timeoutMs: number; // ej. 5000
  reintentosMaximos: number; // ej. 3
  modoEjecucion: ModoEjecucionIntegracion;
  mapeosCampos: MapeoCampoApi[];
  cuerpoMockRespuestaJson: string; // JSON de respuesta simulada para Mock Mode
  plantillaCuerpoPeticionJson?: string;
  ultimaPruebaExitosa?: boolean;
  ultimoMensajePrueba?: string;
  fechaUltimaPrueba?: string;
  activo: boolean;
}

export interface ResultadoPruebaApi {
  status: number;
  statusText: string;
  tiempoRespuestaMs: number;
  headersRecibidos: Record<string, string>;
  cuerpoOriginal: any;
  cuerpoMapeado: any;
  erroresMapeo: string[];
  modoUtilizado: ModoEjecucionIntegracion;
  fechaEjecucion: string;
}
