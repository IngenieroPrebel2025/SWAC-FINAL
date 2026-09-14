import { executeLive } from "@/lib/api/http";
import type { ApiResponse, FaseWorkflow, FormularioDinamico, RespuestaFormularioCita } from "@/types";
import type { IWorkflowRepository } from "../types";

export class LiveWorkflowRepository implements IWorkflowRepository {
  getFormularios(fase?: FaseWorkflow): Promise<ApiResponse<FormularioDinamico[]>> {
    const qs = fase ? `?fase=${fase}` : "";
    return executeLive(`/formularios${qs}`, "GET");
  }

  getFormularioById(id: string): Promise<ApiResponse<FormularioDinamico | null>> {
    return executeLive(`/formularios/${id}`, "GET");
  }

  guardarFormulario(formulario: Partial<FormularioDinamico>): Promise<ApiResponse<FormularioDinamico>> {
    return formulario.id
      ? executeLive(`/formularios/${formulario.id}`, "PUT", formulario)
      : executeLive("/formularios", "POST", formulario);
  }

  deleteFormulario(id: string): Promise<ApiResponse<boolean>> {
    return executeLive(`/formularios/${id}`, "DELETE");
  }

  duplicarFormulario(id: string): Promise<ApiResponse<FormularioDinamico>> {
    return executeLive(`/formularios/${id}/duplicar`, "POST");
  }

  guardarRespuestaFormulario(
    respuesta: Partial<RespuestaFormularioCita>
  ): Promise<ApiResponse<RespuestaFormularioCita>> {
    return executeLive("/respuestas-formulario", "POST", respuesta);
  }

  getRespuestasByCita(citaId: string): Promise<ApiResponse<RespuestaFormularioCita[]>> {
    return executeLive(`/respuestas-formulario/cita/${citaId}`, "GET");
  }
}
