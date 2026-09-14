import { executeMock } from "@/lib/api/http";
import { MOCK_FORMULARIOS, MOCK_RESPUESTAS_CITA } from "@/mocks/workflows.mock";
import type { ApiResponse, FaseWorkflow, FormularioDinamico, RespuestaFormularioCita } from "@/types";
import type { IWorkflowRepository } from "../types";

export class MockWorkflowRepository implements IWorkflowRepository {
  private formularios: FormularioDinamico[] = [...MOCK_FORMULARIOS];
  private respuestas: RespuestaFormularioCita[] = [...MOCK_RESPUESTAS_CITA];

  getFormularios(fase?: FaseWorkflow): Promise<ApiResponse<FormularioDinamico[]>> {
    return executeMock("/formularios", "GET", () =>
      fase ? this.formularios.filter((f) => f.faseWorkflow === fase) : [...this.formularios]
    );
  }

  getFormularioById(id: string): Promise<ApiResponse<FormularioDinamico | null>> {
    return executeMock(`/formularios/${id}`, "GET", () => this.formularios.find((f) => f.id === id) ?? null);
  }

  guardarFormulario(formulario: Partial<FormularioDinamico>): Promise<ApiResponse<FormularioDinamico>> {
    return executeMock(
      formulario.id ? `/formularios/${formulario.id}` : "/formularios",
      formulario.id ? "PUT" : "POST",
      () => {
        const now = new Date().toISOString();
        const idx = formulario.id ? this.formularios.findIndex((f) => f.id === formulario.id) : -1;
        if (idx !== -1) {
          this.formularios[idx] = {
            ...this.formularios[idx],
            ...formulario,
            version: (this.formularios[idx].version || 1) + 1,
            actualizadoEn: now,
          };
          return this.formularios[idx];
        }
        const id = `form-${Date.now()}`;
        const nuevo: FormularioDinamico = {
          codigo: `FRM-${Date.now()}`,
          nombre: "Nuevo Formulario Dinámico",
          descripcion: "",
          faseWorkflow: "SOLICITUD_PROVEEDOR",
          activo: true,
          ...formulario,
          id,
          preguntas: (formulario.preguntas ?? []).map((p) => ({ ...p, formularioId: id })),
          version: 1,
          creadoEn: now,
          actualizadoEn: now,
        };
        this.formularios.unshift(nuevo);
        return nuevo;
      },
      formulario
    );
  }

  deleteFormulario(id: string): Promise<ApiResponse<boolean>> {
    return executeMock(`/formularios/${id}`, "DELETE", () => {
      const len = this.formularios.length;
      this.formularios = this.formularios.filter((f) => f.id !== id);
      return this.formularios.length < len;
    });
  }

  duplicarFormulario(id: string): Promise<ApiResponse<FormularioDinamico>> {
    return executeMock(`/formularios/${id}/duplicar`, "POST", () => {
      const original = this.formularios.find((f) => f.id === id);
      if (!original) throw new Error("Formulario original no encontrado");
      const now = new Date().toISOString();
      const nuevoId = `form-${Date.now()}`;
      const copia: FormularioDinamico = {
        ...original,
        id: nuevoId,
        codigo: `${original.codigo}-COPIA`,
        nombre: `${original.nombre} (Copia)`,
        version: 1,
        preguntas: original.preguntas.map((p, i) => ({ ...p, id: `p-${Date.now()}-${i}`, formularioId: nuevoId })),
        creadoEn: now,
        actualizadoEn: now,
      };
      this.formularios.unshift(copia);
      return copia;
    });
  }

  guardarRespuestaFormulario(
    respuesta: Partial<RespuestaFormularioCita>
  ): Promise<ApiResponse<RespuestaFormularioCita>> {
    return executeMock(
      "/respuestas-formulario",
      "POST",
      () => {
        const nueva: RespuestaFormularioCita = {
          id: `resp-${Date.now()}`,
          citaId: respuesta.citaId ?? "cita-demo",
          formularioId: respuesta.formularioId ?? "",
          faseWorkflow: respuesta.faseWorkflow ?? "INSPECCION_SEGURIDAD",
          respuestasPorCampo: respuesta.respuestasPorCampo ?? {},
          completadoPorUsuarioId: respuesta.completadoPorUsuarioId ?? "usr-actual",
          completadoEn: new Date().toISOString(),
        };
        this.respuestas.push(nueva);
        return nueva;
      },
      respuesta
    );
  }

  getRespuestasByCita(citaId: string): Promise<ApiResponse<RespuestaFormularioCita[]>> {
    return executeMock(`/respuestas-formulario/cita/${citaId}`, "GET", () =>
      this.respuestas.filter((r) => r.citaId === citaId)
    );
  }
}
