import {
  InspeccionPorteria,
  TurnoPatio,
  RegistroSalidaPorteria,
  ItemChecklistPorteria
} from '@/types';

export const CHECKLIST_PORTERIA_DEFAULT: ItemChecklistPorteria[] = [
  {
    id: 'chk-01',
    categoria: 'CONDUCTOR_SEGURIDAD',
    nombre: 'Seguridad Social (ARL y EPS)',
    descripcion: 'Verificar certificado vigente de ARL y EPS activo',
    esObligatorio: true,
    cumple: true
  },
  {
    id: 'chk-02',
    categoria: 'CONDUCTOR_SEGURIDAD',
    nombre: 'Elementos de Protección Personal (EPP)',
    descripcion: 'Botas de puntera de seguridad, chaleco reflectivo, casco y gafas',
    esObligatorio: true,
    cumple: true
  },
  {
    id: 'chk-03',
    categoria: 'CONDUCTOR_SEGURIDAD',
    nombre: 'Licencia de Conducción',
    descripcion: 'Licencia C2/C3 vigente del conductor asignado',
    esObligatorio: true,
    cumple: true
  },
  {
    id: 'chk-04',
    categoria: 'VEHICULO_DOCUMENTOS',
    nombre: 'SOAT y Revisión Técnico-Mecánica',
    descripcion: 'Pólizas vigentes en RUNT',
    esObligatorio: true,
    cumple: true
  },
  {
    id: 'chk-05',
    categoria: 'ESTADO_MECANICO',
    nombre: 'Condiciones de Carrocería y Luces',
    descripcion: 'Sin fugas visibles, llantas aptas, pito y alarma de reversa',
    esObligatorio: true,
    cumple: true
  },
  {
    id: 'chk-06',
    categoria: 'CARGA_FRIO_SELLOS',
    nombre: 'Aseo, Sanitización y Libre de Plagas',
    descripcion: 'Furgón higiénico, sin malos olores ni contaminantes cruzados',
    esObligatorio: true,
    cumple: true
  },
  {
    id: 'chk-07',
    categoria: 'CARGA_FRIO_SELLOS',
    nombre: 'Concordancia de Precintos / Sellos de Seguridad',
    descripcion: 'Número de precinto plástico/metálico coincide con factura/remisión',
    esObligatorio: true,
    cumple: true
  },
  {
    id: 'chk-08',
    categoria: 'CARGA_FRIO_SELLOS',
    nombre: 'Termógrafo y Cadena de Frío',
    descripcion: 'Temperatura de furgón entre 0°C y 4°C para refrigerados o <-18°C congelados',
    esObligatorio: false,
    cumple: true,
    observacion: 'Temperatura registrada: 3.4°C (Rango óptimo)'
  }
];

export const MOCK_INSPECCIONES: InspeccionPorteria[] = [
  {
    id: 'insp-001',
    citaId: 'cita-2026-001',
    codigoCita: 'CTA-2026-0891',
    sedeId: 'sede-rio-01',
    guardaSeguridadId: 'usr-005',
    guardaSeguridadNombre: 'Oficial Hernando Restrepo - Garita 1',
    conductorId: 'cond-001',
    conductorNombre: 'Jairo Antonio Ramírez',
    conductorCedula: '1018445902',
    arlVigente: true,
    epsVigente: true,
    eppCompleto: true,
    vehiculoId: 'veh-001',
    vehiculoPlaca: 'WZM-481',
    soatVigente: true,
    tecnomecanicaVigente: true,
    inspeccionFurgonLimpio: true,
    libreOloresYPlagas: true,
    precintosRegistrados: ['SEAL-COL-884910', 'SEAL-COL-884911'],
    precintosCoincidenConRemision: true,
    temperaturaFurgonCelsius: 3.2,
    temperaturaCumpleRango: true,
    itemsChecklist: CHECKLIST_PORTERIA_DEFAULT,
    resultado: 'APROBADO',
    observacionesGenerales: 'Conductor con EPP reglamentario y precintos en orden. Temperatura de lácteos en 3.2°C.',
    fotosEvidencias: [
      'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=500&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500&auto=format&fit=crop&q=60'
    ],
    fechaHoraInspeccion: '2026-02-27T07:52:00Z'
  },
  {
    id: 'insp-002',
    citaId: 'cita-2026-002',
    codigoCita: 'CTA-2026-0892',
    sedeId: 'sede-rio-01',
    guardaSeguridadId: 'usr-005',
    guardaSeguridadNombre: 'Oficial Hernando Restrepo - Garita 1',
    conductorId: 'cond-002',
    conductorNombre: 'Carlos Eduardo Mendoza',
    conductorCedula: '79844201',
    arlVigente: true,
    epsVigente: true,
    eppCompleto: true,
    vehiculoId: 'veh-002',
    vehiculoPlaca: 'STR-914',
    soatVigente: true,
    tecnomecanicaVigente: true,
    inspeccionFurgonLimpio: true,
    libreOloresYPlagas: true,
    precintosRegistrados: ['PREC-SECO-9912'],
    precintosCoincidenConRemision: true,
    temperaturaCumpleRango: true,
    itemsChecklist: CHECKLIST_PORTERIA_DEFAULT,
    resultado: 'APROBADO',
    observacionesGenerales: 'Carga seca abarrotes palletizada. Ingresa a patio de espera turno 02.',
    fotosEvidencias: [],
    fechaHoraInspeccion: '2026-02-27T09:42:00Z'
  }
];

export const MOCK_TURNOS_PATIO: TurnoPatio[] = [
  {
    id: 'turno-001',
    citaId: 'cita-2026-001',
    codigoCita: 'CTA-2026-0891',
    codigoTurno: 'TURNO-P-01',
    sedeId: 'sede-rio-01',
    muelleAsignadoId: 'mue-rio-01',
    muelleAsignadoNombre: 'Bahía 01 (Crossdock Refrigerado)',
    vehiculoPlaca: 'WZM-481',
    conductorNombre: 'Jairo Antonio Ramírez',
    conductorTelefono: '+57 314 887 1120',
    estado: 'EN_MUELLE',
    horaLlegadaPorteria: '2026-02-27T07:48:00Z',
    horaIngresoPatio: '2026-02-27T07:55:00Z',
    horaLlamadoMuelle: '2026-02-27T08:02:00Z',
    horaPosicionadoEnMuelle: '2026-02-27T08:08:00Z',
    horaInicioDescargue: '2026-02-27T08:15:00Z',
    minutosEnEsperaPatio: 7,
    notificacionSmsEnviada: true,
    llamadasRealizadasCount: 1,
    prioridad: 'ALTA',
    observaciones: 'Posicionado en Muelle 01 descargando lácteos refrigerados'
  },
  {
    id: 'turno-002',
    citaId: 'cita-2026-002',
    codigoCita: 'CTA-2026-0892',
    codigoTurno: 'TURNO-P-02',
    sedeId: 'sede-rio-01',
    muelleAsignadoId: 'mue-rio-02',
    muelleAsignadoNombre: 'Bahía 02 (Carga Seca Abarrotes)',
    vehiculoPlaca: 'STR-914',
    conductorNombre: 'Carlos Eduardo Mendoza',
    conductorTelefono: '+57 300 219 4433',
    estado: 'EN_PATIO_ESPERA',
    horaLlegadaPorteria: '2026-02-27T09:40:00Z',
    horaIngresoPatio: '2026-02-27T09:45:00Z',
    minutosEnEsperaPatio: 15,
    notificacionSmsEnviada: true,
    llamadasRealizadasCount: 0,
    prioridad: 'NORMAL',
    observaciones: 'Esperando liberación de Muelle 02 (est. llamado en 10 min)'
  },
  {
    id: 'turno-003',
    citaId: 'cita-2026-003',
    codigoCita: 'CTA-2026-0893',
    codigoTurno: 'TURNO-P-03',
    sedeId: 'sede-rio-01',
    muelleAsignadoId: 'mue-rio-03',
    muelleAsignadoNombre: 'Bahía 03 (Descargue General)',
    vehiculoPlaca: 'TLX-552',
    conductorNombre: 'Mario Alberto Gómez',
    conductorTelefono: '+57 311 902 8841',
    estado: 'EN_INSPECCION_GARITA',
    horaLlegadaPorteria: '2026-02-27T10:10:00Z',
    minutosEnEsperaPatio: 0,
    notificacionSmsEnviada: false,
    llamadasRealizadasCount: 0,
    prioridad: 'NORMAL',
    observaciones: 'En revisión de documentos y precintos de seguridad en Garita 2'
  }
];

export const MOCK_HISTORIAL_SALIDAS: RegistroSalidaPorteria[] = [
  {
    id: 'sal-001',
    citaId: 'cita-2026-004',
    codigoCita: 'CTA-2026-0888',
    sedeId: 'sede-rio-01',
    vehiculoPlaca: 'UYZ-819',
    conductorNombre: 'Gonzalo Silva',
    guardaSalidaNombre: 'Oficial Hernando Restrepo',
    horaSalida: '2026-02-27T07:30:00Z',
    remisionFirmadaYEntregada: true,
    inspeccionFurgonVacioOK: true,
    estibasRetornadasCount: 24,
    novedadesSalida: 'Descargue completado sin novedades ni faltantes.',
    tiempoTotalEstadiaMinutos: 62,
    cumplioSlaEstadia: true
  },
  {
    id: 'sal-002',
    citaId: 'cita-2026-005',
    codigoCita: 'CTA-2026-0889',
    sedeId: 'sede-rio-01',
    vehiculoPlaca: 'EQR-310',
    conductorNombre: 'Víctor Hugo Peña',
    guardaSalidaNombre: 'Oficial Hernando Restrepo',
    horaSalida: '2026-02-26T18:45:00Z',
    remisionFirmadaYEntregada: true,
    inspeccionFurgonVacioOK: true,
    estibasRetornadasCount: 16,
    novedadesSalida: 'Entrega conforme de químicos y aseo.',
    tiempoTotalEstadiaMinutos: 78,
    cumplioSlaEstadia: true
  }
];
