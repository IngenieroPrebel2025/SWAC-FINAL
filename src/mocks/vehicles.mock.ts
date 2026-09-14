import { Conductor, Vehiculo, DocumentoVehiculoConductor } from '@/types';

export const MOCK_CONDUCTORES: Conductor[] = [
  {
    id: 'cond-001',
    tipoDocumento: 'CC',
    numeroDocumento: '1018445902',
    nombres: 'Jairo Antonio',
    apellidos: 'Ramírez Gómez',
    telefono: '+57 314 887 1120',
    email: 'jairo.ramirez@transportesunidos.com',
    eps: 'Sanitas EPS',
    arl: 'SURA ARL',
    licenciaConduccionNumero: '1018445902-C3',
    licenciaConduccionCategoria: 'C3',
    licenciaVigencia: '2028-11-30',
    estado: 'ACTIVO'
  },
  {
    id: 'cond-002',
    tipoDocumento: 'CC',
    numeroDocumento: '79845210',
    nombres: 'Héctor Fabio',
    apellidos: 'Morales Cárdenas',
    telefono: '+57 320 541 9988',
    eps: 'Compensar EPS',
    arl: 'Positiva ARL',
    licenciaConduccionNumero: '79845210-C2',
    licenciaConduccionCategoria: 'C2',
    licenciaVigencia: '2027-06-15',
    estado: 'ACTIVO'
  }
];

export const MOCK_VEHICULOS: Vehiculo[] = [
  {
    id: 'veh-001',
    placa: 'WZM-481',
    tipoVehiculo: 'TRACTOMULA',
    marca: 'Kenworth T800',
    modeloAnio: 2023,
    color: 'Blanco / Azul Corporativo',
    tieneRemolque: true,
    placaRemolque: 'R-99014',
    capacidadCargaKg: 34000,
    volumenMaximoM3: 85,
    esRefrigerado: true,
    empresaTransportadora: 'Transportes Refrigerados del Norte S.A.',
    estado: 'HABILITADO'
  },
  {
    id: 'veh-002',
    placa: 'STR-920',
    tipoVehiculo: 'DOBLETROQUE',
    marca: 'International WorkStar',
    modeloAnio: 2022,
    color: 'Blanco',
    tieneRemolque: false,
    capacidadCargaKg: 18000,
    volumenMaximoM3: 45,
    esRefrigerado: false,
    empresaTransportadora: 'Logística Granelera Andina',
    estado: 'HABILITADO'
  }
];

export const MOCK_DOCUMENTOS: DocumentoVehiculoConductor[] = [
  {
    id: 'doc-001',
    entidadTipo: 'VEHICULO',
    entidadId: 'veh-001',
    tipoDocumento: 'SOAT',
    numeroDocumento: 'SOAT-2026-99120',
    fechaEmision: '2026-01-10',
    fechaVencimiento: '2027-01-10',
    archivoUrl: 'https://storage.empresa.com/docs/soat-wzm481.pdf',
    estado: 'VIGENTE',
    validadoPorOcr: true,
    confianzaOcrPorcentaje: 98.4,
    subidoEn: '2026-01-12T10:00:00Z'
  },
  {
    id: 'doc-002',
    entidadTipo: 'VEHICULO',
    entidadId: 'veh-001',
    tipoDocumento: 'TECNOMECANICA',
    numeroDocumento: 'RUNT-CDA-445892',
    fechaEmision: '2025-08-14',
    fechaVencimiento: '2026-08-14',
    archivoUrl: 'https://storage.empresa.com/docs/tecno-wzm481.pdf',
    estado: 'VIGENTE',
    validadoPorOcr: true,
    confianzaOcrPorcentaje: 96.1,
    subidoEn: '2025-08-15T15:30:00Z'
  }
];
