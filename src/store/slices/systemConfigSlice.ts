import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { SystemConfig } from "@/types";

export const DEFAULT_SYSTEM_CONFIG: SystemConfig = {
  dataSourceMode: process.env.NEXT_PUBLIC_DATA_SOURCE_MODE === "LIVE_API" ? "LIVE_API" : "MOCK",
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1",
  defaultTimeoutMs: 5000,
  syntheticDelayMs: 250,
  logHttpRequests: true,
  version: "1.0.0",
};

/**
 * Configuración de runtime del adaptador de datos (MOCK ↔ API real),
 * editable desde Configuración › Sistema y persistida en localStorage.
 */
export const systemConfigSlice = createSlice({
  name: "systemConfig",
  initialState: DEFAULT_SYSTEM_CONFIG,
  reducers: {
    hydrateSystemConfig(state, action: PayloadAction<Partial<SystemConfig> | null>) {
      if (action.payload) Object.assign(state, action.payload, { version: state.version });
    },
    updateSystemConfig(state, action: PayloadAction<Partial<SystemConfig>>) {
      Object.assign(state, action.payload);
    },
    resetSystemConfig() {
      return DEFAULT_SYSTEM_CONFIG;
    },
  },
});

export const { hydrateSystemConfig, updateSystemConfig, resetSystemConfig } =
  systemConfigSlice.actions;
export default systemConfigSlice.reducer;
