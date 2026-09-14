import { configureStore } from "@reduxjs/toolkit";
import uiReducer from "./slices/uiSlice";
import authReducer from "./slices/authSlice";
import systemConfigReducer from "./slices/systemConfigSlice";
import httpLogReducer from "./slices/httpLogSlice";
import toastReducer from "./slices/toastSlice";

/**
 * Redux store — estado global de cliente.
 *   ui           → loading global / banner
 *   auth         → sesión JWT, sede activa
 *   systemConfig → adaptador de datos (MOCK | LIVE_API), URL, latencia
 *   httpLog      → telemetría de peticiones
 *   toast        → notificaciones efímeras + historial
 * El estado de servidor (citas, muelles, usuarios…) vive en TanStack Query.
 */
export const store = configureStore({
  reducer: {
    ui: uiReducer,
    auth: authReducer,
    systemConfig: systemConfigReducer,
    httpLog: httpLogReducer,
    toast: toastReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      immutableCheck: { warnAfter: 128 },
      serializableCheck: { warnAfter: 128 },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
