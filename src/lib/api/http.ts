import type { AxiosError, Method } from "axios";
import apiClient from "@/lib/apiClient";
import { store } from "@/store";
import { addHttpLog } from "@/store/slices/httpLogSlice";
import type { ApiResponse, HttpRequestLog, MetodoHttp } from "@/types";

const newId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const clock = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

/** Copia profunda: evita compartir referencias mutables del adaptador mock con Redux / TanStack Query. */
const clone = <T>(value: T): T =>
  value === undefined ? value : (JSON.parse(JSON.stringify(value)) as T);

function log(entry: HttpRequestLog) {
  if (store.getState().systemConfig.logHttpRequests) store.dispatch(addHttpLog(entry));
}

/** Ejecución simulada con latencia configurable (adaptador MOCK). */
export async function executeMock<T>(
  endpoint: string,
  method: MetodoHttp,
  generate: () => T,
  requestPayload?: unknown
): Promise<ApiResponse<T>> {
  const { apiBaseUrl, syntheticDelayMs } = store.getState().systemConfig;
  const start = clock();
  if (syntheticDelayMs > 0) await new Promise((r) => setTimeout(r, syntheticDelayMs));
  const url = `${apiBaseUrl}${endpoint}`;

  try {
    const data = clone(generate());
    const executionTimeMs = Math.round(clock() - start);
    const timestamp = new Date().toISOString();
    log({
      id: newId("req-mock"),
      timestamp,
      method,
      url,
      source: "MOCK",
      status: 200,
      durationMs: executionTimeMs,
      requestPayload: clone(requestPayload),
      responsePayload: data,
    });
    return { success: true, data, timestamp, source: "MOCK_ADAPTER", executionTimeMs };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error en el adaptador mock";
    log({
      id: newId("req-mock-err"),
      timestamp: new Date().toISOString(),
      method,
      url,
      source: "MOCK",
      status: 500,
      durationMs: Math.round(clock() - start),
      requestPayload: clone(requestPayload),
      error: message,
    });
    throw new Error(message);
  }
}

/** Ejecución real contra el backend HTTP vía Axios (adaptador LIVE_API). */
export async function executeLive<T>(
  endpoint: string,
  method: MetodoHttp,
  payload?: unknown,
  headers?: Record<string, string>,
  timeoutMsOverride?: number
): Promise<ApiResponse<T>> {
  const { apiBaseUrl, defaultTimeoutMs } = store.getState().systemConfig;
  const timeout = timeoutMsOverride ?? defaultTimeoutMs;
  const url = `${apiBaseUrl}${endpoint}`;
  const start = clock();
  const hasBody = method === "POST" || method === "PUT" || method === "PATCH";

  try {
    const res = await apiClient.request<T>({
      url: endpoint,
      baseURL: apiBaseUrl,
      method: method as Method,
      data: hasBody ? payload : undefined,
      headers,
      timeout,
    });
    const executionTimeMs = Math.round(clock() - start);
    const timestamp = new Date().toISOString();
    log({
      id: newId("req-live"),
      timestamp,
      method,
      url,
      source: "LIVE_API",
      status: res.status,
      durationMs: executionTimeMs,
      requestPayload: payload,
      responsePayload: res.data,
    });
    return { success: true, data: res.data, timestamp, source: "LIVE_HTTP_ADAPTER", executionTimeMs };
  } catch (err) {
    const e = err as AxiosError<{ message?: string }>;
    const message =
      e.code === "ECONNABORTED"
        ? `Tiempo de espera agotado tras ${timeout} ms`
        : e.response?.data?.message ?? e.message ?? "Error de red";
    log({
      id: newId("req-live-err"),
      timestamp: new Date().toISOString(),
      method,
      url,
      source: "LIVE_API",
      status: e.response?.status ?? 0,
      durationMs: Math.round(clock() - start),
      requestPayload: payload,
      error: message,
    });
    throw new Error(message);
  }
}

/** Extrae `data` de un ApiResponse o lanza el error del contrato. */
export function unwrap<T>(res: ApiResponse<T>): T {
  if (!res.success) {
    throw new Error(res.error ?? res.errorMessage ?? res.message ?? "La operación no pudo completarse");
  }
  return res.data;
}
