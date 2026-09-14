import { executeLive } from "@/lib/api/http";
import type { ApiResponse, BitacoraAuditoria } from "@/types";
import type { IAuditRepository } from "../types";

export class LiveAuditRepository implements IAuditRepository {
  getBitacora(filtros?: { categoria?: string; sedeId?: string }): Promise<ApiResponse<BitacoraAuditoria[]>> {
    const params = new URLSearchParams();
    if (filtros?.categoria) params.append("categoria", filtros.categoria);
    if (filtros?.sedeId) params.append("sedeId", filtros.sedeId);
    const qs = params.toString() ? `?${params.toString()}` : "";
    return executeLive(`/auditoria/logs${qs}`, "GET");
  }

  registrarEvento(evento: Partial<BitacoraAuditoria>): Promise<ApiResponse<BitacoraAuditoria>> {
    return executeLive("/auditoria/logs", "POST", evento);
  }
}
