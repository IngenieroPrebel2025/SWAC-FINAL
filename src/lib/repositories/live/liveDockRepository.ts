import { executeLive } from "@/lib/api/http";
import type { ApiResponse, EstadoMuelle, Muelle, MuelleDisponibilidadLog } from "@/types";
import type { IDockRepository } from "../types";

export class LiveDockRepository implements IDockRepository {
  getMuellesBySede(sedeId: string): Promise<ApiResponse<Muelle[]>> {
    return executeLive(`/sedes/${sedeId}/muelles`, "GET");
  }

  getMuelleById(id: string): Promise<ApiResponse<Muelle | null>> {
    return executeLive(`/muelles/${id}`, "GET");
  }

  createMuelle(muelle: Partial<Muelle>): Promise<ApiResponse<Muelle>> {
    return executeLive("/muelles", "POST", muelle);
  }

  updateMuelle(id: string, muelle: Partial<Muelle>): Promise<ApiResponse<Muelle>> {
    return executeLive(`/muelles/${id}`, "PUT", muelle);
  }

  deleteMuelle(id: string): Promise<ApiResponse<boolean>> {
    return executeLive(`/muelles/${id}`, "DELETE");
  }

  cambiarEstadoMuelle(
    muelleId: string,
    nuevoEstado: EstadoMuelle,
    motivo: string,
    usuarioId: string
  ): Promise<ApiResponse<Muelle>> {
    return executeLive(`/muelles/${muelleId}/estado`, "PATCH", { nuevoEstado, motivo, usuarioId });
  }

  getLogsDisponibilidad(sedeId: string): Promise<ApiResponse<MuelleDisponibilidadLog[]>> {
    return executeLive(`/sedes/${sedeId}/muelles/logs`, "GET");
  }

  registrarLogDisponibilidad(log: Partial<MuelleDisponibilidadLog>): Promise<ApiResponse<MuelleDisponibilidadLog>> {
    return executeLive(`/muelles/${log.muelleId}/disponibilidad-log`, "POST", log);
  }

  eliminarLogDisponibilidad(logId: string): Promise<ApiResponse<boolean>> {
    return executeLive(`/muelles/logs/${logId}`, "DELETE");
  }
}
