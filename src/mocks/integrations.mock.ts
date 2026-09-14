import { IntegracionApiConfig } from '@/types';

export const MOCK_INTEGRACIONES: IntegracionApiConfig[] = [
  {
    id: 'int-sap-001',
    nombreServicio: 'SAP S/4HANA - Maestro de Materiales y OC',
    codigoIdentificador: 'INT-SAP-ERP',
    descripcion: 'Consulta y validación de órdenes de compra, referencias SKU de materiales y datos de proveedores en SAP ERP empresarial.',
    urlBase: 'https://sap-gateway.empresa.com/api/v2',
    endpoint: '/orders/purchase-orders/validate',
    metodo: 'POST',
    tipoAutenticacion: 'BEARER_TOKEN',
    credenciales: {
      bearerToken: 'eyJhGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.sap_corp_mock_token_991'
    },
    cabecerasPersonalizadas: [
      { id: 'h-1', clave: 'X-SAP-Client', valor: '400', esSecreto: false, habilitado: true },
      { id: 'h-2', clave: 'X-Company-Code', valor: 'CO01', esSecreto: false, habilitado: true }
    ],
    timeoutMs: 4500,
    reintentosMaximos: 2,
    modoEjecucion: 'MOCK_SYNTHETIC',
    mapeosCampos: [
      {
        id: 'map-01',
        campoOrigenApi: 'order_number_sap',
        campoDestinoSistema: 'ordenCompraNumero',
        tipoDato: 'STRING',
        esRequerido: true
      },
      {
        id: 'map-02',
        campoOrigenApi: 'cod_ref_sap',
        campoDestinoSistema: 'sku',
        tipoDato: 'STRING',
        esRequerido: true
      },
      {
        id: 'map-03',
        campoOrigenApi: 'mat_description',
        campoDestinoSistema: 'descripcion',
        tipoDato: 'STRING',
        esRequerido: true
      },
      {
        id: 'map-04',
        campoOrigenApi: 'pallet_qty_planned',
        campoDestinoSistema: 'cantidadEstibas',
        tipoDato: 'NUMBER',
        esRequerido: true
      },
      {
        id: 'map-05',
        campoOrigenApi: 'gross_weight_kg',
        campoDestinoSistema: 'pesoTotalKg',
        tipoDato: 'NUMBER',
        esRequerido: true
      }
    ],
    cuerpoMockRespuestaJson: JSON.stringify(
      {
        status: 'SUCCESS',
        sap_transaction_id: 'SAP-TX-994821',
        data: {
          order_number_sap: 'OC-SAP-88390',
          vendor_nit: '900.124.582-1',
          vendor_name: 'LÁCTEOS Y DERIVADOS ANDINOS S.A.S.',
          estimated_delivery_date: '2026-02-27',
          target_plant: 'CD-BOG-NORTE',
          lines: [
            {
              cod_ref_sap: 'SKU-LACT-001',
              mat_description: 'Leche Entera UHT 1000ml (Caja x 12 unds)',
              pallet_qty_planned: 12,
              units_planned: 14400,
              gross_weight_kg: 10200,
              storage_condition: 'COLD_CHAIN_4C'
            }
          ]
        }
      },
      null,
      2
    ),
    plantillaCuerpoPeticionJson: JSON.stringify(
      {
        po_number: '{{ordenCompraNumero}}',
        vendor_tax_id: '{{nitORut}}',
        center_code: '{{codigoSede}}'
      },
      null,
      2
    ),
    ultimaPruebaExitosa: true,
    ultimoMensajePrueba: 'Conexión simulada exitosa (HTTP 200 OK) - Contrato SAP validado',
    fechaUltimaPrueba: '2026-02-27T08:15:00Z',
    activo: true
  },
  {
    id: 'int-wms-002',
    nombreServicio: 'Manhattan Associates WMS - Disponibilidad de Muelle',
    codigoIdentificador: 'INT-WMS-SCALE',
    descripcion: 'Sincronización en tiempo real con WMS para estatus de recepción en bahía y habilitación física de muelles.',
    urlBase: 'https://wms-gateway.empresa.com/wmx/api/v1',
    endpoint: '/dock-doors/status',
    metodo: 'GET',
    tipoAutenticacion: 'API_KEY',
    credenciales: {
      apiKeyHeaderName: 'x-api-key',
      apiKeyValue: 'manhattan_wms_prod_key_771'
    },
    cabecerasPersonalizadas: [
      { id: 'h-wms-1', clave: 'Facility-ID', valor: 'FAC-BOG-01', esSecreto: false, habilitado: true }
    ],
    timeoutMs: 3000,
    reintentosMaximos: 3,
    modoEjecucion: 'MOCK_SYNTHETIC',
    mapeosCampos: [
      {
        id: 'map-wms-1',
        campoOrigenApi: 'door_code',
        campoDestinoSistema: 'codigoMuelle',
        tipoDato: 'STRING',
        esRequerido: true
      },
      {
        id: 'map-wms-2',
        campoOrigenApi: 'door_occupancy_status',
        campoDestinoSistema: 'estadoActual',
        tipoDato: 'STRING',
        esRequerido: true
      }
    ],
    cuerpoMockRespuestaJson: JSON.stringify(
      {
        facility: 'FAC-BOG-01',
        doors: [
          { door_code: 'M-01', door_occupancy_status: 'DISPONIBLE', assigned_asn: null },
          { door_code: 'M-02', door_occupancy_status: 'OCUPADO', assigned_asn: 'ASN-884102' },
          { door_code: 'M-03', door_occupancy_status: 'DISPONIBLE', assigned_asn: null }
        ]
      },
      null,
      2
    ),
    ultimaPruebaExitosa: true,
    ultimoMensajePrueba: 'HTTP 200 OK - 3 muelles sincronizados con WMS',
    fechaUltimaPrueba: '2026-02-27T07:50:00Z',
    activo: true
  },
  {
    id: 'int-runt-003',
    nombreServicio: 'RUNT / MinTransporte - Validación de Vehículos y SOAT',
    codigoIdentificador: 'INT-RUNT-VEH',
    descripcion: 'Validación gubernamental automática de vigencia de SOAT y Revisión Técnico-Mecánica por placa.',
    urlBase: 'https://transporte.gov.co/api/v1',
    endpoint: '/vehiculos/consulta-placa',
    metodo: 'GET',
    tipoAutenticacion: 'BASIC_AUTH',
    credenciales: {
      username: 'corp_logistics_user',
      password: '••••••••••••'
    },
    cabecerasPersonalizadas: [],
    timeoutMs: 6000,
    reintentosMaximos: 1,
    modoEjecucion: 'MOCK_SYNTHETIC',
    mapeosCampos: [
      {
        id: 'map-runt-1',
        campoOrigenApi: 'placa_vehiculo',
        campoDestinoSistema: 'placa',
        tipoDato: 'STRING',
        esRequerido: true
      },
      {
        id: 'map-runt-2',
        campoOrigenApi: 'soat_vigente_flag',
        campoDestinoSistema: 'documento.soatVigente',
        tipoDato: 'BOOLEAN',
        esRequerido: true
      }
    ],
    cuerpoMockRespuestaJson: JSON.stringify(
      {
        placa_vehiculo: 'WZM-481',
        marca: 'KENWORTH',
        linea: 'T800',
        modelo: 2023,
        clase_vehiculo: 'TRACTOCAMION',
        soat: {
          numero_poliza: 'SOAT-2026-99120',
          aseguradora: 'Seguros del Estado',
          fecha_vencimiento: '2027-01-10',
          soat_vigente_flag: true
        },
        tecnomecanica: {
          numero_certificado: 'RUNT-CDA-445892',
          fecha_vencimiento: '2026-08-14',
          vigente_flag: true
        }
      },
      null,
      2
    ),
    ultimaPruebaExitosa: true,
    ultimoMensajePrueba: 'HTTP 200 OK - Validación RUNT exitosa',
    fechaUltimaPrueba: '2026-02-27T08:00:00Z',
    activo: true
  }
];
