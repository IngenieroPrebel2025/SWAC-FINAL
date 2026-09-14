import type {
  ApiResponse,
  BitacoraAuditoria,
  CalculoTiempoParametrizado,
  Cita,
  Conductor,
  DriverPortalSession,
  EstadoMuelle,
  EstadoTurnoPatio,
  FaseWorkflow,
  FormularioDinamico,
  InspeccionPorteria,
  IntegracionApiConfig,
  Material,
  Muelle,
  MuelleDisponibilidadLog,
  Permiso,
  Proveedor,
  RegistroSalidaPorteria,
  ReservaTemporal,
  RespuestaFormularioCita,
  ResultadoPruebaApi,
  Rol,
  Sede,
  SlotDisponible,
  SlotSearchFilter,
  TipoMaterial,
  TurnoPatio,
  Usuario,
  Vehiculo,
} from "@/types";

/*
 * Puertos de salida (contratos de repositorio). Cada uno tiene un adaptador
 * MOCK (datos en memoria) y uno LIVE (HTTP vía Axios). El factory en
 * `./index.ts` elige el adaptador según `systemConfig.dataSourceMode`.
 */

export interface ISiteRepository {
  getSedes(): Promise<ApiResponse<Sede[]>>;
  getSedeById(id: string): Promise<ApiResponse<Sede | null>>;
  createSede(sede: Partial<Sede>): Promise<ApiResponse<Sede>>;
  updateSede(id: string, sede: Partial<Sede>): Promise<ApiResponse<Sede>>;
  deleteSede(id: string): Promise<ApiResponse<boolean>>;
}

export interface IDockRepository {
  getMuellesBySede(sedeId: string): Promise<ApiResponse<Muelle[]>>;
  getMuelleById(id: string): Promise<ApiResponse<Muelle | null>>;
  createMuelle(muelle: Partial<Muelle>): Promise<ApiResponse<Muelle>>;
  updateMuelle(id: string, muelle: Partial<Muelle>): Promise<ApiResponse<Muelle>>;
  deleteMuelle(id: string): Promise<ApiResponse<boolean>>;
  cambiarEstadoMuelle(
    muelleId: string,
    nuevoEstado: EstadoMuelle,
    motivo: string,
    usuarioId: string
  ): Promise<ApiResponse<Muelle>>;
  getLogsDisponibilidad(sedeId: string): Promise<ApiResponse<MuelleDisponibilidadLog[]>>;
  registrarLogDisponibilidad(log: Partial<MuelleDisponibilidadLog>): Promise<ApiResponse<MuelleDisponibilidadLog>>;
  eliminarLogDisponibilidad(logId: string): Promise<ApiResponse<boolean>>;
}

export interface ISupplierRepository {
  getProveedores(): Promise<ApiResponse<Proveedor[]>>;
  getProveedorById(id: string): Promise<ApiResponse<Proveedor | null>>;
  getTiposMaterial(): Promise<ApiResponse<TipoMaterial[]>>;
  getMateriales(): Promise<ApiResponse<Material[]>>;
  createMaterial(material: Partial<Material>): Promise<ApiResponse<Material>>;
  updateMaterial(id: string, material: Partial<Material>): Promise<ApiResponse<Material>>;
}

export interface IAppointmentRepository {
  getCitas(filtros?: {
    sedeId?: string;
    fecha?: string;
    estado?: string;
    search?: string;
    proveedorId?: string;
  }): Promise<ApiResponse<Cita[]>>;
  getCitaById(id: string): Promise<ApiResponse<Cita | null>>;
  crearCita(data: Partial<Cita>): Promise<ApiResponse<Cita>>;
  actualizarCita(id: string, data: Partial<Cita>): Promise<ApiResponse<Cita>>;
  cancelarCita(id: string, motivo: string, usuarioId?: string): Promise<ApiResponse<Cita>>;
  eliminarCita(id: string): Promise<ApiResponse<boolean>>;
  crearReservaTemporal(data: {
    sedeId: string;
    muelleId: string;
    proveedorId: string;
    fecha: string;
    horaInicio: string;
    duracionMinutos: number;
  }): Promise<ApiResponse<ReservaTemporal>>;
  liberarReservaTemporal(reservaId: string): Promise<ApiResponse<boolean>>;
  confirmarReservaEnCita(reservaId: string, citaData: Partial<Cita>): Promise<ApiResponse<Cita>>;
  getSlotsDisponibles(filtro: SlotSearchFilter): Promise<ApiResponse<SlotDisponible[]>>;
  calcularDuracionSugerida(params: {
    tipoMaterialId: string;
    cantidadEstibas: number;
    cantidadCajas?: number;
  }): Promise<ApiResponse<CalculoTiempoParametrizado>>;
  cambiarEstadoCita(
    citaId: string,
    nuevoEstado: string,
    metadata?: Record<string, unknown>
  ): Promise<ApiResponse<Cita>>;
  getReservasTemporalesActivas(sedeId?: string): Promise<ApiResponse<ReservaTemporal[]>>;
  getVehiculos(): Promise<ApiResponse<Vehiculo[]>>;
  getConductores(): Promise<ApiResponse<Conductor[]>>;
  crearVehiculo(vehiculo: Partial<Vehiculo>): Promise<ApiResponse<Vehiculo>>;
  crearConductor(conductor: Partial<Conductor>): Promise<ApiResponse<Conductor>>;
}

export interface IIntegrationRepository {
  getIntegraciones(): Promise<ApiResponse<IntegracionApiConfig[]>>;
  getIntegracionById(id: string): Promise<ApiResponse<IntegracionApiConfig | null>>;
  guardarIntegracion(config: Partial<IntegracionApiConfig>): Promise<ApiResponse<IntegracionApiConfig>>;
  probarConexionApi(
    integracionId: string,
    payloadPrueba?: unknown,
    modoOverride?: "MOCK_SYNTHETIC" | "LIVE_REMOTE"
  ): Promise<ApiResponse<ResultadoPruebaApi>>;
}

export interface AuthLoginResult {
  usuario: Usuario;
  token: string;
  permisos: string[];
}

export interface IAuthRepository {
  getUsuarios(): Promise<ApiResponse<Usuario[]>>;
  getUsuarioById(id: string): Promise<ApiResponse<Usuario | null>>;
  createUsuario(usuario: Partial<Usuario>): Promise<ApiResponse<Usuario>>;
  updateUsuario(id: string, usuario: Partial<Usuario>): Promise<ApiResponse<Usuario>>;
  deleteUsuario(id: string): Promise<ApiResponse<boolean>>;
  getRoles(): Promise<ApiResponse<Rol[]>>;
  createRol(rol: Partial<Rol>): Promise<ApiResponse<Rol>>;
  updateRol(id: string, rol: Partial<Rol>): Promise<ApiResponse<Rol>>;
  deleteRol(id: string): Promise<ApiResponse<boolean>>;
  updateRolPermisos(rolId: string, permisosIds: string[]): Promise<ApiResponse<Rol>>;
  getPermisos(): Promise<ApiResponse<Permiso[]>>;
  login(email: string, password?: string): Promise<ApiResponse<AuthLoginResult>>;
  getUsuarioActual(): Promise<ApiResponse<Usuario | null>>;
  impersonateUser(usuarioId: string): Promise<ApiResponse<AuthLoginResult>>;
}

export interface IWorkflowRepository {
  getFormularios(fase?: FaseWorkflow): Promise<ApiResponse<FormularioDinamico[]>>;
  getFormularioById(id: string): Promise<ApiResponse<FormularioDinamico | null>>;
  guardarFormulario(formulario: Partial<FormularioDinamico>): Promise<ApiResponse<FormularioDinamico>>;
  deleteFormulario(id: string): Promise<ApiResponse<boolean>>;
  duplicarFormulario(id: string): Promise<ApiResponse<FormularioDinamico>>;
  guardarRespuestaFormulario(respuesta: Partial<RespuestaFormularioCita>): Promise<ApiResponse<RespuestaFormularioCita>>;
  getRespuestasByCita(citaId: string): Promise<ApiResponse<RespuestaFormularioCita[]>>;
}

export interface IAuditRepository {
  getBitacora(filtros?: { categoria?: string; sedeId?: string }): Promise<ApiResponse<BitacoraAuditoria[]>>;
  registrarEvento(evento: Partial<BitacoraAuditoria>): Promise<ApiResponse<BitacoraAuditoria>>;
}

export interface IGateRepository {
  getTurnosPatio(filtros?: {
    sedeId?: string;
    estado?: EstadoTurnoPatio;
    search?: string;
  }): Promise<ApiResponse<TurnoPatio[]>>;
  getTurnoPatioByCitaId(citaId: string): Promise<ApiResponse<TurnoPatio | null>>;
  registrarLlegadaPorteria(data: {
    citaId: string;
    guardaId: string;
    guardaNombre: string;
    odometroKm?: number;
  }): Promise<ApiResponse<{ cita: Cita; turno: TurnoPatio }>>;
  guardarInspeccionPorteria(inspeccion: Partial<InspeccionPorteria>): Promise<ApiResponse<InspeccionPorteria>>;
  getInspeccionByCitaId(citaId: string): Promise<ApiResponse<InspeccionPorteria | null>>;
  asignarTurnoPatio(
    citaId: string,
    codigoTurno?: string,
    prioridad?: "ALTA" | "NORMAL" | "BAJA"
  ): Promise<ApiResponse<TurnoPatio>>;
  cancelarTurnoPatio(turnoId: string): Promise<ApiResponse<boolean>>;
  llamarVehiculoAMuelle(turnoId: string, muelleId?: string): Promise<ApiResponse<TurnoPatio>>;
  posicionarEnMuelle(turnoId: string): Promise<ApiResponse<TurnoPatio>>;
  iniciarDescargue(turnoId: string): Promise<ApiResponse<TurnoPatio>>;
  finalizarDescargue(turnoId: string): Promise<ApiResponse<TurnoPatio>>;
  registrarSalidaPlanta(data: Partial<RegistroSalidaPorteria>): Promise<ApiResponse<RegistroSalidaPorteria>>;
  getHistorialSalidas(sedeId?: string): Promise<ApiResponse<RegistroSalidaPorteria[]>>;
  getDriverSession(query: {
    codigoCita?: string;
    placa?: string;
    cedula?: string;
  }): Promise<ApiResponse<DriverPortalSession | null>>;
}
