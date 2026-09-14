import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { HttpRequestLog } from "@/types";

const MAX_LOGS = 50;

interface HttpLogState {
  logs: HttpRequestLog[];
}

const initialState: HttpLogState = { logs: [] };

/** Telemetría de peticiones del adaptador de datos (mock y API real). */
export const httpLogSlice = createSlice({
  name: "httpLog",
  initialState,
  reducers: {
    addHttpLog(state, action: PayloadAction<HttpRequestLog>) {
      state.logs.unshift(action.payload);
      if (state.logs.length > MAX_LOGS) state.logs.length = MAX_LOGS;
    },
    clearHttpLogs(state) {
      state.logs = [];
    },
  },
});

export const { addHttpLog, clearHttpLogs } = httpLogSlice.actions;
export default httpLogSlice.reducer;
