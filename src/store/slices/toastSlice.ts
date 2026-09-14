import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastMessage {
  id: string;
  type: ToastType;
  text: string;
  createdAt: string;
  read: boolean;
}

interface ToastState {
  /** Toasts visibles en pantalla. */
  active: ToastMessage[];
  /** Últimos eventos — alimentan el menú de notificaciones del header. */
  history: ToastMessage[];
}

const MAX_HISTORY = 20;

const initialState: ToastState = { active: [], history: [] };

export const toastSlice = createSlice({
  name: "toast",
  initialState,
  reducers: {
    pushToast: {
      reducer(state, action: PayloadAction<ToastMessage>) {
        state.active.push(action.payload);
        state.history.unshift(action.payload);
        if (state.history.length > MAX_HISTORY) state.history.length = MAX_HISTORY;
      },
      prepare(type: ToastType, text: string) {
        return {
          payload: {
            id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            type,
            text,
            createdAt: new Date().toISOString(),
            read: false,
          },
        };
      },
    },
    dismissToast(state, action: PayloadAction<string>) {
      state.active = state.active.filter((t) => t.id !== action.payload);
    },
    markAllNotificationsRead(state) {
      state.history.forEach((t) => {
        t.read = true;
      });
    },
    clearNotifications(state) {
      state.history = [];
    },
  },
});

export const { pushToast, dismissToast, markAllNotificationsRead, clearNotifications } =
  toastSlice.actions;
export default toastSlice.reducer;
