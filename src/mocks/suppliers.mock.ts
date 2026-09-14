import { Proveedor, TipoMaterial, Material, ProveedorSedeRel } from '@/types';

export const MOCK_TIPOS_MATERIAL: TipoMaterial[] = [
  {
    id: 'tmat-01',
    codigo: 'SECOS-ABARROTES',
    nombre: 'Abarrotes y Alimentos Secos',
    requiereRefrigeracion: false,
    minutosDescarguePorEstiba: 4.5,
    minutosDescarguePorCaja: 0.3,
    prioridadOperacional: 'ESTANDAR',
    activo: true
  },
  {
    id: 'tmat-02',
    codigo: 'FRIO-LACTEOS',
    nombre: 'Lácteos, Cárnicos y Embutidos',
    requiereRefrigeracion: true,
    temperaturaMinimaCelsius: 0,
    temperaturaMaximaCelsius: 4,
    minutosDescarguePorEstiba: 6.0,
    prioridadOperacional: 'ALTA',
    activo: true
  },
  {
    id: 'tmat-03',
    codigo: 'CONGELADOS',
    nombre: 'Ultracongelados e Helados',
    requiereRefrigeracion: true,
    temperaturaMinimaCelsius: -22,
    temperaturaMaximaCelsius: -18,
    minutosDescarguePorEstiba: 7.0,
    prioridadOperacional: 'ALTA',
    activo: true
  },
  {
    id: 'tmat-04',
    codigo: 'ASEO-HOGAR',
    nombre: 'Productos de Aseo, Cuidado Personal y Limpieza',
    requiereRefrigeracion: false,
    minutosDescarguePorEstiba: 5.0,
    prioridadOperacional: 'ESTANDAR',
    activo: true
  }
];

export const MOCK_MATERIALES: Material[] = [
  {
    id: 'mat-001',
    sku: 'SKU-LACT-001',
    descripcion: 'Leche Entera UHT 1000ml (Caja x 12 unds)',
    tipoMaterialId: 'tmat-02',
    unidadMedida: 'ESTIBA',
    pesoPromedioKg: 850,
    volumenM3: 1.4,
    codRefSap: 'SAP-MAT-99012',
    activo: true
  },
  {
    id: 'mat-002',
    sku: 'SKU-ABAR-015',
    descripcion: 'Arroz Premium Selección Especial Saco 25kg',
    tipoMaterialId: 'tmat-01',
    unidadMedida: 'ESTIBA',
    pesoPromedioKg: 1000,
    volumenM3: 1.2,
    codRefSap: 'SAP-MAT-45120',
    activo: true
  },
  {
    id: 'mat-003',
    sku: 'SKU-FRIO-088',
    descripcion: 'Queso Doble Crema Bloque 2.5kg',
    tipoMaterialId: 'tmat-02',
    unidadMedida: 'ESTIBA',
    pesoPromedioKg: 620,
    volumenM3: 1.1,
    codRefSap: 'SAP-MAT-33109',
    activo: true
  },
  {
    id: 'mat-004',
    sku: 'SKU-ASEO-040',
    descripcion: 'Detergente Líquido Concentrado 3000ml',
    tipoMaterialId: 'tmat-04',
    unidadMedida: 'ESTIBA',
    pesoPromedioKg: 920,
    volumenM3: 1.3,
    codRefSap: 'SAP-MAT-88410',
    activo: true
  }
];

export const MOCK_PROVEEDORES: Proveedor[] = [
  {
    id: 'prov-001',
    nitORut: '900.124.582-1',
    razonSocial: 'LÁCTEOS Y DERIVADOS ANDINOS S.A.S.',
    nombreComercial: 'Lácteos Andinos',
    emailContacto: 'despachos@lacteosandinos.com',
    telefonoContacto: '+57 (601) 321-7788',
    estado: 'ACTIVO',
    calificacionDesempeno: 4.8,
    sedesAutorizadasIds: ['sede-rio-01', 'sede-pro-02', 'sede-com-03'],
    tiposMaterialAutorizadosIds: ['tmat-02', 'tmat-03'],
    tiempoAdelantoCitaMinutos: 1440, // 24 horas antes
    limiteCitasPorDia: 4,
    contactoResponsable: {
      nombre: 'Carolina Méndez Rojas',
      cargo: 'Jefe Nacional de Distribución y Flotas',
      telefono: '+57 310 998 4422',
      email: 'carolina.mendez@lacteosandinos.com'
    },
    creadoEn: '2025-01-15T10:00:00Z',
    actualizadoEn: '2026-02-10T11:20:00Z'
  },
  {
    id: 'prov-002',
    nitORut: '860.001.205-9',
    razonSocial: 'MOLINOS Y GRANOS DEL VALLE S.A.',
    nombreComercial: 'Granos del Valle',
    emailContacto: 'citascd@granosdelvalle.com',
    telefonoContacto: '+57 (602) 889-4000',
    estado: 'ACTIVO',
    calificacionDesempeno: 4.6,
    sedesAutorizadasIds: ['sede-rio-01', 'sede-pro-02', 'sede-com-03'],
    tiposMaterialAutorizadosIds: ['tmat-01'],
    tiempoAdelantoCitaMinutos: 2880, // 48 horas antes
    limiteCitasPorDia: 6,
    contactoResponsable: {
      nombre: 'Mauricio Restrepo',
      cargo: 'Coordinador de Logística de Entrega',
      telefono: '+57 315 442 1109',
      email: 'mrestrepo@granosdelvalle.com'
    },
    creadoEn: '2025-02-01T08:30:00Z',
    actualizadoEn: '2026-02-20T09:00:00Z'
  },
  {
    id: 'prov-003',
    nitORut: '800.231.990-4',
    razonSocial: 'CLEAN & CARE COLOMBIA S.A.S.',
    nombreComercial: 'CleanCare',
    emailContacto: 'entregas@cleancare.com.co',
    telefonoContacto: '+57 (601) 456-7890',
    estado: 'ACTIVO',
    calificacionDesempeno: 4.2,
    sedesAutorizadasIds: ['sede-rio-01', 'sede-pro-02'],
    tiposMaterialAutorizadosIds: ['tmat-04'],
    tiempoAdelantoCitaMinutos: 1440,
    limiteCitasPorDia: 3,
    contactoResponsable: {
      nombre: 'Felipe Vargas',
      cargo: 'Supervisor de Despachos',
      telefono: '+57 312 654 3321',
      email: 'fvargas@cleancare.com.co'
    },
    creadoEn: '2025-04-10T14:00:00Z',
    actualizadoEn: '2026-01-18T16:45:00Z'
  },
  {
    id: 'prov-xyz',
    nitORut: '900.123.456-1',
    razonSocial: 'PROVEEDOR LOGÍSTICO XYZ S.A.S.',
    nombreComercial: 'Proveedor XYZ',
    emailContacto: 'contacto@proveedorXYZ.com',
    telefonoContacto: '+57 (601) 789-0123',
    estado: 'ACTIVO',
    calificacionDesempeno: 4.9,
    sedesAutorizadasIds: ['sede-rio-01', 'sede-com-03'],
    tiposMaterialAutorizadosIds: ['tmat-01', 'tmat-02'],
    tiempoAdelantoCitaMinutos: 1440,
    limiteCitasPorDia: 5,
    contactoResponsable: {
      nombre: 'Gerardo Valencia',
      cargo: 'Gerente Comercial y Logística',
      telefono: '+57 301 555 9876',
      email: 'contacto@proveedorXYZ.com'
    },
    creadoEn: '2025-05-01T08:00:00Z',
    actualizadoEn: '2026-02-15T10:00:00Z'
  }
];

export const MOCK_PROVEEDOR_SEDES: ProveedorSedeRel[] = [
  {
    id: 'rel-001',
    proveedorId: 'prov-001',
    sedeId: 'sede-rio-01',
    habilitado: true,
    condicionesEspeciales: 'Exclusivo muelles refrigerados con termógrafo calibrado',
    diasPermitidosSemana: [1, 2, 3, 4, 5, 6]
  },
  {
    id: 'rel-002',
    proveedorId: 'prov-002',
    sedeId: 'sede-rio-01',
    habilitado: true,
    condicionesEspeciales: 'Muelle 2 preferente con rampa para montacargas 3T',
    diasPermitidosSemana: [1, 2, 3, 4, 5]
  }
];
