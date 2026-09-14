// Contratos de datos del sistema, configuración de adaptadores y entorno

export type DataSourceMode = 'MOCK' | 'LIVE_API';

export interface SystemConfig {
  dataSourceMode: DataSourceMode;
  apiBaseUrl: string;
  defaultTimeoutMs: number;
  syntheticDelayMs: number; // Retardo simulado en modo MOCK para una UX realista
  logHttpRequests: boolean;
  version: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  errorMessage?: string;
  timestamp: string;
  source: 'MOCK_ADAPTER' | 'LIVE_HTTP_ADAPTER';
  executionTimeMs: number;
  metadata?: {
    totalRecords?: number;
    page?: number;
    pageSize?: number;
  };
}

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  errorCode: string;
  errorMessage: string;
  details?: unknown;
  timestamp: string;
  source: 'MOCK_ADAPTER' | 'LIVE_HTTP_ADAPTER';
}

export interface HttpRequestLog {
  id: string;
  timestamp: string;
  method: string;
  url: string;
  source: DataSourceMode;
  status: number;
  durationMs: number;
  requestPayload?: unknown;
  responsePayload?: unknown;
  error?: string;
}
