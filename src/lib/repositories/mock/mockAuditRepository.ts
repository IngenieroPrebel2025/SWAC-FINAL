import { executeMock } from "@/lib/api/http";
import { store } from "@/store";
import { MOCK_AUDITORIA } from "@/mocks/audit.mock";
import type { ApiResponse, BitacoraAuditoria } from "@/types";
import type { IAuditRepository } from "../types";

export class MockAuditRepository implements IAuditRepository {
  private bitacora: BitacoraAuditoria[] = [...MOCK_AUDITORIA];

  getBitacora(filtros?: { categoria?: string; sedeId?: string }): Promise<ApiResponse<BitacoraAuditoria[]>> {
    return executeMock("/auditoria/logs", "GET", () =>
      this.bitacora.filter(
        (b) =>
          (!filtros?.categoria || b.categoria === filtros.categoria) &&
          (!filtros?.sedeId || !b.sedeId || b.sedeId === filtros.sedeId)
      )
    );
  }

  registrarEvento(evento: Partial<BitacoraAuditoria>): Promise<ApiResponse<BitacoraAuditoria>> {
    return executeMock(
      "/auditoria/logs",
      "POST",
      () => {
        const usuario = store.getState().auth.session?.usuario;
        const nuevo: BitacoraAuditoria = {
          categoria: "SISTEMA",
          accion: "CREAR",
          entidadTipo: "GENERAL",
          entidadId: "n/a",
          descripcion: "Evento registrado en sistema",
          usuarioId: usuario?.id ?? "usr-sistema",
          usuarioNombre: usuario?.nombreCompleto ?? "Sistema",
          usuarioEmail: usuario?.email ?? "sistema@swac.com",
          ...evento,
          id: `aud-${Date.now()}`,
          fechaRegistro: new Date().toISOString(),
        };
        this.bitacora.unshift(nuevo);
        return nuevo;
      },
      evento
    );
  }
}
