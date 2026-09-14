import { executeLive } from "@/lib/api/http";
import type { ApiResponse, Sede } from "@/types";
import type { ISiteRepository } from "../types";

export class LiveSiteRepository implements ISiteRepository {
  getSedes(): Promise<ApiResponse<Sede[]>> {
    return executeLive("/sedes", "GET");
  }

  getSedeById(id: string): Promise<ApiResponse<Sede | null>> {
    return executeLive(`/sedes/${id}`, "GET");
  }

  createSede(sede: Partial<Sede>): Promise<ApiResponse<Sede>> {
    return executeLive("/sedes", "POST", sede);
  }

  updateSede(id: string, sede: Partial<Sede>): Promise<ApiResponse<Sede>> {
    return executeLive(`/sedes/${id}`, "PUT", sede);
  }

  deleteSede(id: string): Promise<ApiResponse<boolean>> {
    return executeLive(`/sedes/${id}`, "DELETE");
  }
}
