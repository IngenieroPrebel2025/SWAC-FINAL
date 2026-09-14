import axios from "axios";
import { getAuthHeaders } from "@/lib/api/authHeaders";

/**
 * Cliente HTTP del backend SWAC. La URL base efectiva se resuelve por petición
 * desde `systemConfig.apiBaseUrl` (ver `lib/api/http.ts`); el interceptor
 * adjunta el Bearer token y el contexto multi-sede en cada llamada.
 */
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  Object.entries(getAuthHeaders()).forEach(([key, value]) => {
    config.headers.set(key, value);
  });
  return config;
});

export default apiClient;
