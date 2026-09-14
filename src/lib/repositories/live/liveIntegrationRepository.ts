import { executeLive } from "@/lib/api/http";
import type { ApiResponse, IntegracionApiConfig, ResultadoPruebaApi } from "@/types";
import type { IIntegrationRepository } from "../types";

export class LiveIntegrationRepository implements IIntegrationRepository {
  getIntegraciones(): Promise<ApiResponse<IntegracionApiConfig[]>> {
    return executeLive("/integraciones", "GET");
  }

  getIntegracionById(id: string): Promise<ApiResponse<IntegracionApiConfig | null>> {
    return executeLive(`/integraciones/${id}`, "GET");
  }

  guardarIntegracion(config: Partial<IntegracionApiConfig>): Promise<ApiResponse<IntegracionApiConfig>> {
    return config.id
      ? executeLive(`/integraciones/${config.id}`, "PUT", config)
      : executeLive("/integraciones", "POST", config);
  }

  probarConexionApi(
    integracionId: string,
    payloadPrueba?: unknown,
    modoOverride?: "MOCK_SYNTHETIC" | "LIVE_REMOTE"
  ): Promise<ApiResponse<ResultadoPruebaApi>> {
    return executeLive(`/integraciones/${integracionId}/test`, "POST", { payloadPrueba, modoOverride });
  }
}
