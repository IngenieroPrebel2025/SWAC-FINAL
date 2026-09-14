import { FormularioDinamico, RespuestaFormularioCita } from '@/types';

export const MOCK_FORMULARIOS: FormularioDinamico[] = [
  {
    id: 'form-001',
    codigo: 'FRM-PORTERIA-INSPEC',
    nombre: 'Inspección de Seguridad e Ingreso en Portería',
    descripcion: 'Checklist dinámico obligatorio en portería para validación física del vehículo, sellos de seguridad, termógrafo y EPPs.',
    faseWorkflow: 'INSPECCION_SEGURIDAD',
    version: 2,
    activo: true,
    preguntas: [
      {
        id: 'p-01',
        formularioId: 'form-001',
        codigoIdentificador: 'tiene_precinto_seguridad',
        etiqueta: '¿El vehículo cuenta con precinto / guaya de seguridad intacta?',
        tipoCampo: 'CHECKBOX',
        orden: 1,
        esRequerido: true,
        reglasCondicionales: []
      },
      {
        id: 'p-02',
        formularioId: 'form-001',
        codigoIdentificador: 'numero_precinto',
        etiqueta: 'Número del precinto / sello de seguridad verificado',
        tipoCampo: 'TEXTO',
        orden: 2,
        esRequerido: true,
        placeholder: 'ej. SL-992014-COL',
        ayudaTexto: 'Debe coincidir exactamente con el manifiesto de carga',
        reglasCondicionales: [
          {
            id: 'r-01',
            campoOrigenId: 'p-01',
            operador: 'ES_VERDADERO',
            valorComparacion: true,
            accion: 'MOSTRAR'
          }
        ]
      },
      {
        id: 'p-03',
        formularioId: 'form-001',
        codigoIdentificador: 'tipo_furgon',
        etiqueta: 'Tipo de Carrocería / Furgón',
        tipoCampo: 'SELECT',
        orden: 3,
        esRequerido: true,
        opciones: [
          { valor: 'FURGON_SECO', etiqueta: 'Furgón Seco / Cerrado' },
          { valor: 'FURGON_REFRIGERADO', etiqueta: 'Furgón Thermo King / Refrigerado' },
          { valor: 'ESTACAS_CARPADO', etiqueta: 'Estacas / Carpado' },
          { valor: 'PLATAFORMA_CONTENEDOR', etiqueta: 'Plataforma Porta-Contenedor' },
          { valor: 'CISTERNA_LIQUIDOS', etiqueta: 'Cisterna / Tanque' }
        ],
        reglasCondicionales: []
      },
      {
        id: 'p-04',
        formularioId: 'form-001',
        codigoIdentificador: 'temperatura_termografo_c',
        etiqueta: 'Lectura de Temperatura Termógrafo (°C)',
        tipoCampo: 'NUMERO',
        orden: 4,
        esRequerido: true,
        placeholder: 'ej. 3.5',
        ayudaTexto: 'Rango aceptable para refrigerados: 0°C a 8°C. Congelados: -18°C o menor.',
        validaciones: {
          min: -35,
          max: 35
        },
        reglasCondicionales: [
          {
            id: 'r-02',
            campoOrigenId: 'p-03',
            operador: 'IGUAL',
            valorComparacion: 'FURGON_REFRIGERADO',
            accion: 'MOSTRAR'
          }
        ]
      },
      {
        id: 'p-05',
        formularioId: 'form-001',
        codigoIdentificador: 'epps_verificados',
        etiqueta: 'Elementos de Protección Personal (EPP) Portados',
        tipoCampo: 'MULTI_SELECT',
        orden: 5,
        esRequerido: true,
        opciones: [
          { valor: 'BOTAS_SEGURIDAD', etiqueta: 'Botas de Seguridad con Puntera' },
          { valor: 'CHALECO_REFLECTIVO', etiqueta: 'Chaleco Reflectivo de Alta Visibilidad' },
          { valor: 'CASCO_BARBUQUEJO', etiqueta: 'Casco con Barbuquejo' },
          { valor: 'GAFAS_SEGURIDAD', etiqueta: 'Gafas de Seguridad Transparentes' },
          { valor: 'GUANTES_CARNAZA', etiqueta: 'Guantes de Nitrilo o Carnaza' }
        ],
        reglasCondicionales: []
      },
      {
        id: 'p-06',
        formularioId: 'form-001',
        codigoIdentificador: 'foto_evidencia_placa',
        etiqueta: 'Fotografía de la placa frontal y cabina del vehículo',
        tipoCampo: 'FOTO_EVIDENCIA',
        orden: 6,
        esRequerido: true,
        validaciones: {
          formatosPermitidos: ['.jpg', '.jpeg', '.png'],
          tamanioMaximoMb: 8
        },
        reglasCondicionales: []
      },
      {
        id: 'p-07',
        formularioId: 'form-001',
        codigoIdentificador: 'firma_guarda_porteria',
        etiqueta: 'Firma Digital de Conformidad - Oficial de Portería',
        tipoCampo: 'FIRMA_DIGITAL',
        orden: 7,
        esRequerido: true,
        reglasCondicionales: []
      }
    ],
    creadoEn: '2025-02-01T10:00:00Z',
    actualizadoEn: '2026-02-10T15:00:00Z'
  },
  {
    id: 'form-002',
    codigo: 'FRM-VEHICULO-CONDUCTOR',
    nombre: 'Registro de Vehículo, Conductor & Remolque',
    descripcion: 'Captura estructurada de datos de tracción, semirremolque y verificación de ARL / Seguridad Social.',
    faseWorkflow: 'DATOS_VEHICULO_CONDUCTOR',
    version: 1,
    activo: true,
    preguntas: [
      {
        id: 'p-20',
        formularioId: 'form-002',
        codigoIdentificador: 'nombre_completo_conductor',
        etiqueta: 'Nombre Completo del Conductor',
        tipoCampo: 'TEXTO',
        placeholder: 'ej. Carlos Alberto Gómez Méndez',
        orden: 1,
        esRequerido: true,
        reglasCondicionales: []
      },
      {
        id: 'p-21',
        formularioId: 'form-002',
        codigoIdentificador: 'documento_identidad_conductor',
        etiqueta: 'Cédula de Ciudadanía / Documento',
        tipoCampo: 'TEXTO',
        placeholder: 'ej. 79450123',
        orden: 2,
        esRequerido: true,
        validaciones: {
          patronRegex: '^[0-9]{6,12}$',
          mensajeError: 'El documento debe contener entre 6 y 12 dígitos numéricos'
        },
        reglasCondicionales: []
      },
      {
        id: 'p-22',
        formularioId: 'form-002',
        codigoIdentificador: 'telefono_contacto_conductor',
        etiqueta: 'Celular de Notificaciones SMS / WhatsApp',
        tipoCampo: 'TEXTO',
        placeholder: 'ej. +57 310 987 6543',
        orden: 3,
        esRequerido: true,
        reglasCondicionales: []
      },
      {
        id: 'p-23',
        formularioId: 'form-002',
        codigoIdentificador: 'arl_conductor',
        etiqueta: 'Aseguradora de Riesgos Laborales (ARL)',
        tipoCampo: 'SELECT',
        orden: 4,
        esRequerido: true,
        opciones: [
          { valor: 'SURA', etiqueta: 'Seguros SURA' },
          { valor: 'POSITIVA', etiqueta: 'Positiva Compañía de Seguros' },
          { valor: 'AXA_COLPATRIA', etiqueta: 'AXA Colpatria' },
          { valor: 'BOLIVAR', etiqueta: 'Seguros Bolívar' },
          { valor: 'COLMENA', etiqueta: 'Colmena Seguros' }
        ],
        reglasCondicionales: []
      },
      {
        id: 'p-24',
        formularioId: 'form-002',
        codigoIdentificador: 'es_tractomula_articulada',
        etiqueta: '¿Es un vehículo articulado con remolque / semirremolque?',
        tipoCampo: 'CHECKBOX',
        orden: 5,
        esRequerido: false,
        reglasCondicionales: []
      },
      {
        id: 'p-25',
        formularioId: 'form-002',
        codigoIdentificador: 'placa_remolque',
        etiqueta: 'Placa del Remolque / Tráiler (R-XXXXX)',
        tipoCampo: 'TEXTO',
        placeholder: 'ej. R-99014',
        orden: 6,
        esRequerido: true,
        reglasCondicionales: [
          {
            id: 'r-20',
            campoOrigenId: 'p-24',
            operador: 'ES_VERDADERO',
            valorComparacion: true,
            accion: 'MOSTRAR'
          }
        ]
      }
    ],
    creadoEn: '2025-02-10T11:00:00Z',
    actualizadoEn: '2026-01-15T09:00:00Z'
  },
  {
    id: 'form-003',
    codigo: 'FRM-DOC-VALIDATION',
    nombre: 'Validación y Radicación Documental de Carga',
    descripcion: 'Cotejo de factura electrónica, remisión, manifiesto electrónico RNDC y certificado de origen.',
    faseWorkflow: 'VALIDACION_DOCUMENTAL',
    version: 1,
    activo: true,
    preguntas: [
      {
        id: 'p-30',
        formularioId: 'form-003',
        codigoIdentificador: 'numero_factura_remision',
        etiqueta: 'Número de Factura o Remisión Principal',
        tipoCampo: 'TEXTO',
        placeholder: 'ej. FAC-2026-8841',
        orden: 1,
        esRequerido: true,
        reglasCondicionales: []
      },
      {
        id: 'p-31',
        formularioId: 'form-003',
        codigoIdentificador: 'valor_declarado_cop',
        etiqueta: 'Valor Total Declarado (COP $)',
        tipoCampo: 'NUMERO',
        placeholder: 'ej. 45000000',
        orden: 2,
        esRequerido: true,
        reglasCondicionales: []
      },
      {
        id: 'p-32',
        formularioId: 'form-003',
        codigoIdentificador: 'manifiesto_rndc_pdf',
        etiqueta: 'Manifiesto de Carga Electrónico (PDF)',
        tipoCampo: 'DOCUMENTO_ADJUNTO',
        orden: 3,
        esRequerido: true,
        validaciones: {
          formatosPermitidos: ['.pdf'],
          tamanioMaximoMb: 10
        },
        reglasCondicionales: []
      }
    ],
    creadoEn: '2025-02-15T10:00:00Z',
    actualizadoEn: '2026-02-01T12:00:00Z'
  },
  {
    id: 'form-004',
    codigo: 'FRM-DESCARGUE-CONTROL',
    nombre: 'Control de Descargue, Novedades & Mermas',
    descripcion: 'Registro de inicio/fin de descarga en muelle, estibas recibidas, diferencias y reporte de averías.',
    faseWorkflow: 'OPERACION_DESCARGUE',
    version: 1,
    activo: true,
    preguntas: [
      {
        id: 'p-40',
        formularioId: 'form-004',
        codigoIdentificador: 'cantidad_estibas_recibidas',
        etiqueta: 'Total de Estibas / Pallets Físicos Recibidos',
        tipoCampo: 'NUMERO',
        placeholder: 'ej. 24',
        orden: 1,
        esRequerido: true,
        reglasCondicionales: []
      },
      {
        id: 'p-41',
        formularioId: 'form-004',
        codigoIdentificador: 'hay_averias_o_faltantes',
        etiqueta: '¿Se identificaron averías, mermas o productos faltantes?',
        tipoCampo: 'CHECKBOX',
        orden: 2,
        esRequerido: true,
        reglasCondicionales: []
      },
      {
        id: 'p-42',
        formularioId: 'form-004',
        codigoIdentificador: 'descripcion_novedad',
        etiqueta: 'Detalle de la Novedad / Causa de Merma',
        tipoCampo: 'TEXTO_LARGO',
        placeholder: 'Indique referencias afectadas, lotes y motivo del daño...',
        orden: 3,
        esRequerido: true,
        reglasCondicionales: [
          {
            id: 'r-40',
            campoOrigenId: 'p-41',
            operador: 'ES_VERDADERO',
            valorComparacion: true,
            accion: 'MOSTRAR'
          }
        ]
      },
      {
        id: 'p-43',
        formularioId: 'form-004',
        codigoIdentificador: 'foto_evidencia_novedad',
        etiqueta: 'Fotografía de la Mercancía Averiada / Inconforme',
        tipoCampo: 'FOTO_EVIDENCIA',
        orden: 4,
        esRequerido: true,
        reglasCondicionales: [
          {
            id: 'r-41',
            campoOrigenId: 'p-41',
            operador: 'ES_VERDADERO',
            valorComparacion: true,
            accion: 'MOSTRAR'
          }
        ]
      },
      {
        id: 'p-44',
        formularioId: 'form-004',
        codigoIdentificador: 'firma_operador_muelle',
        etiqueta: 'Firma Digital del Operador de Muelle',
        tipoCampo: 'FIRMA_DIGITAL',
        orden: 5,
        esRequerido: true,
        reglasCondicionales: []
      }
    ],
    creadoEn: '2025-02-20T08:00:00Z',
    actualizadoEn: '2026-02-12T17:00:00Z'
  },
  {
    id: 'form-005',
    codigo: 'FRM-SALIDA-PAZYSALVO',
    nombre: 'Paz y Salvo & Acta de Salida de Planta',
    descripcion: 'Cierre de la operación, verificación de retiro de precintos sobrantes y firma del conductor.',
    faseWorkflow: 'SALIDA_PLANTA',
    version: 1,
    activo: true,
    preguntas: [
      {
        id: 'p-50',
        formularioId: 'form-005',
        codigoIdentificador: 'entrego_remision_sellada',
        etiqueta: '¿Se entregó copia de remisión sellada y cumplido al transportador?',
        tipoCampo: 'CHECKBOX',
        orden: 1,
        esRequerido: true,
        reglasCondicionales: []
      },
      {
        id: 'p-51',
        formularioId: 'form-005',
        codigoIdentificador: 'observaciones_salida',
        etiqueta: 'Observaciones de Salida de Garita',
        tipoCampo: 'TEXTO_LARGO',
        placeholder: 'Novedades de la salida o comentarios finales...',
        orden: 2,
        esRequerido: false,
        reglasCondicionales: []
      },
      {
        id: 'p-52',
        formularioId: 'form-005',
        codigoIdentificador: 'firma_conductor_salida',
        etiqueta: 'Firma Digital del Conductor de Paz y Salvo',
        tipoCampo: 'FIRMA_DIGITAL',
        orden: 3,
        esRequerido: true,
        reglasCondicionales: []
      }
    ],
    creadoEn: '2025-02-25T14:00:00Z',
    actualizadoEn: '2026-02-15T11:00:00Z'
  }
];

export const MOCK_RESPUESTAS_CITA: RespuestaFormularioCita[] = [
  {
    id: 'resp-001',
    citaId: 'cita-001',
    formularioId: 'form-001',
    faseWorkflow: 'INSPECCION_SEGURIDAD',
    respuestasPorCampo: {
      tiene_precinto_seguridad: true,
      numero_precinto: 'SL-992014-COL',
      tipo_furgon: 'FURGON_REFRIGERADO',
      temperatura_termografo_c: 4.2,
      epps_verificados: ['BOTAS_SEGURIDAD', 'CHALECO_REFLECTIVO', 'CASCO_BARBUQUEJO'],
      foto_evidencia_placa: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=400',
      firma_guarda_porteria: 'FIRMA_DIGITAL_CONFIRMADA_ID_99412'
    },
    completadoPorUsuarioId: 'usr-porteria-01',
    completadoEn: '2026-02-27T08:15:00Z'
  }
];
