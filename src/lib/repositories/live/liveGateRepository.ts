import { executeLive } from "@/lib/api/http";
import type {
  ApiResponse,
  Cita,
  DriverPortalSession,
  EstadoTurnoPatio,
  InspeccionPorteria,
  RegistroSalidaPorteria,
  TurnoPatio,
} from "@/types";
import type { IGateRepository } from "../types";

export class LiveGateRepository implements IGateRepository {
  getTurnosPatio(filtros?: {
    sedeId?: string;
    estado?: EstadoTurnoPatio;
    search?: string;
  }): Promise<ApiResponse<TurnoPatio[]>> {
    const params = new URLSearchParams();
    if (filtros?.sedeId) params.append("sedeId", filtros.sedeId);
    if (filtros?.estado) params.append("estado", filtros.estado);
    if (filtros?.search) params.append("search", filtros.search);
    return executeLive(`/porteria/turnos?${params.toString()}`, "GET");
  }

  getTurnoPatioByCitaId(citaId: string): Promise<ApiResponse<TurnoPatio | null>> {
    return executeLive(`/porteria/turnos/cita/${citaId}`, "GET");
  }

  registrarLlegadaPorteria(data: {
    citaId: string;
    guardaId: string;
    guardaNombre: string;
    odometroKm?: number;
  }): Promise<ApiResponse<{ cita: Cita; turno: TurnoPatio }>> {
    return executeLive("/porteria/checkin", "POST", data);
  }

  guardarInspeccionPorteria(inspeccion: Partial<InspeccionPorteria>): Promise<ApiResponse<InspeccionPorteria>> {
    return executeLive("/porteria/inspecciones", "POST", inspeccion);
  }

  getInspeccionByCitaId(citaId: string): Promise<ApiResponse<InspeccionPorteria | null>> {
    return executeLive(`/porteria/inspecciones/cita/${citaId}`, "GET");
  }

  asignarTurnoPatio(
    citaId: string,
    codigoTurno?: string,
    prioridad: "ALTA" | "NORMAL" | "BAJA" = "NORMAL"
  ): Promise<ApiResponse<TurnoPatio>> {
    return executeLive("/porteria/turnos/asignar", "POST", { citaId, codigoTurno, prioridad });
  }

  cancelarTurnoPatio(turnoId: string): Promise<ApiResponse<boolean>> {
    return executeLive(`/porteria/turnos/${turnoId}/cancelar`, "DELETE");
  }

  llamarVehiculoAMuelle(turnoId: string, muelleId?: string): Promise<ApiResponse<TurnoPatio>> {
    return executeLive(`/porteria/turnos/${turnoId}/llamar`, "POST", { muelleId });
  }

  posicionarEnMuelle(turnoId: string): Promise<ApiResponse<TurnoPatio>> {
    return executeLive(`/porteria/turnos/${turnoId}/posicionar`, "POST", {});
  }

  iniciarDescargue(turnoId: string): Promise<ApiResponse<TurnoPatio>> {
    return executeLive(`/porteria/turnos/${turnoId}/iniciar-descargue`, "POST", {});
  }

  finalizarDescargue(turnoId: string): Promise<ApiResponse<TurnoPatio>> {
    return executeLive(`/porteria/turnos/${turnoId}/finalizar-descargue`, "POST", {});
  }

  registrarSalidaPlanta(data: Partial<RegistroSalidaPorteria>): Promise<ApiResponse<RegistroSalidaPorteria>> {
    return executeLive("/porteria/checkout", "POST", data);
  }

  getHistorialSalidas(sedeId?: string): Promise<ApiResponse<RegistroSalidaPorteria[]>> {
    const qs = sedeId ? `?sedeId=${sedeId}` : "";
    return executeLive(`/porteria/salidas${qs}`, "GET");
  }

  getDriverSession(query: {
    codigoCita?: string;
    placa?: string;
    cedula?: string;
  }): Promise<ApiResponse<DriverPortalSession | null>> {
    return executeLive("/driver/session", "POST", query);
  }
}
