import { executeMock } from "@/lib/api/http";
import { MOCK_INTEGRACIONES } from "@/mocks/integrations.mock";
import type { ApiResponse, IntegracionApiConfig, ResultadoPruebaApi } from "@/types";
import type { IIntegrationRepository } from "../types";

function extraerValorPorRuta(obj: unknown, path: string): unknown {
  if (!obj || !path) return undefined;
  const record = obj as Record<string, unknown>;
  if (record[path] !== undefined) return record[path];
  return path.split(".").reduce<unknown>((actual, key) => {
    if (actual === null || actual === undefined) return undefined;
    return (actual as Record<string, unknown>)[key];
  }, obj);
}

export class MockIntegrationRepository implements IIntegrationRepository {
  private integraciones: IntegracionApiConfig[] = [...MOCK_INTEGRACIONES];

  getIntegraciones(): Promise<ApiResponse<IntegracionApiConfig[]>> {
    return executeMock("/integraciones", "GET", () => [...this.integraciones]);
  }

  getIntegracionById(id: string): Promise<ApiResponse<IntegracionApiConfig | null>> {
    return executeMock(`/integraciones/${id}`, "GET", () => this.integraciones.find((i) => i.id === id) ?? null);
  }

  guardarIntegracion(config: Partial<IntegracionApiConfig>): Promise<ApiResponse<IntegracionApiConfig>> {
    return executeMock(
      config.id ? `/integraciones/${config.id}` : "/integraciones",
      config.id ? "PUT" : "POST",
      () => {
        const existing = config.id ? this.integraciones.find((i) => i.id === config.id) : undefined;
        if (existing) {
          Object.assign(existing, config);
          return existing;
        }
        const nueva: IntegracionApiConfig = {
          nombreServicio: "Nuevo Servicio API",
          codigoIdentificador: `INT-API-${Date.now()}`,
          descripcion: "",
          urlBase: "https://api.empresa.com",
          endpoint: "/v1/resource",
          metodo: "GET",
          tipoAutenticacion: "NONE",
          credenciales: {},
          cabecerasPersonalizadas: [],
          timeoutMs: 5000,
          reintentosMaximos: 2,
          modoEjecucion: "MOCK_SYNTHETIC",
          mapeosCampos: [],
          cuerpoMockRespuestaJson: '{\n  "status": "OK"\n}',
          activo: true,
          ...config,
          id: `int-${Date.now()}`,
        };
        this.integraciones.push(nueva);
        return nueva;
      },
      config
    );
  }

  probarConexionApi(
    integracionId: string,
    payloadPrueba?: unknown,
    modoOverride?: "MOCK_SYNTHETIC" | "LIVE_REMOTE"
  ): Promise<ApiResponse<ResultadoPruebaApi>> {
    const integracion = this.integraciones.find((i) => i.id === integracionId);
    const modo = modoOverride ?? integracion?.modoEjecucion ?? "MOCK_SYNTHETIC";
    const endpoint = `/integraciones/${integracionId}/${modo === "MOCK_SYNTHETIC" ? "test-mock" : "test-live"}`;

    return executeMock(
      endpoint,
      "POST",
      () => {
        if (!integracion) throw new Error(`Integración ${integracionId} no encontrada`);

        let cuerpo: unknown;
        try {
          cuerpo = JSON.parse(integracion.cuerpoMockRespuestaJson || "{}");
        } catch {
          cuerpo = { raw: integracion.cuerpoMockRespuestaJson };
        }

        const cuerpoMapeado: Record<string, unknown> = {};
        const erroresMapeo: string[] = [];
        if (modo === "MOCK_SYNTHETIC") {
          integracion.mapeosCampos.forEach((map) => {
            const valor = extraerValorPorRuta(cuerpo, map.campoOrigenApi);
            if (valor !== undefined) cuerpoMapeado[map.campoDestinoSistema] = valor;
            else if (map.esRequerido) {
              erroresMapeo.push(`El campo requerido '${map.campoOrigenApi}' no se encontró en la respuesta de la API.`);
            }
          });
        }

        const resultado: ResultadoPruebaApi = {
          status: 200,
          statusText: modo === "MOCK_SYNTHETIC" ? "OK (Synthetic Mock Response)" : "OK (Live Gateway Ping)",
          tiempoRespuestaMs: Math.floor((modo === "MOCK_SYNTHETIC" ? 120 : 350) + Math.random() * 300),
          headersRecibidos:
            modo === "MOCK_SYNTHETIC"
              ? { "content-type": "application/json", "x-mock-engine": "SWAC-Adapter-V1" }
              : { "content-type": "application/json", "x-live-endpoint": `${integracion.urlBase}${integracion.endpoint}` },
          cuerpoOriginal: cuerpo,
          cuerpoMapeado: Object.keys(cuerpoMapeado).length > 0 ? cuerpoMapeado : cuerpo,
          erroresMapeo,
          modoUtilizado: modo,
          fechaEjecucion: new Date().toISOString(),
        };

        integracion.ultimaPruebaExitosa = erroresMapeo.length === 0;
        integracion.ultimoMensajePrueba =
          erroresMapeo.length === 0
            ? "Prueba completada con éxito. Mapeo verificado."
            : `Completada con advertencias: ${erroresMapeo.length} campos faltantes.`;
        integracion.fechaUltimaPrueba = resultado.fechaEjecucion;
        return resultado;
      },
      payloadPrueba
    );
  }
}
