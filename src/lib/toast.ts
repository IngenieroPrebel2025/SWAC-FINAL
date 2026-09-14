import { store } from "@/store";
import { pushToast } from "@/store/slices/toastSlice";

/**
 * API imperativa de notificaciones (utilizable fuera de React:
 * callbacks de mutaciones, adaptadores, etc.). Renderizado por <Toaster />.
 */
export const toast = {
  success: (text: string) => store.dispatch(pushToast("success", text)),
  error: (text: string) => store.dispatch(pushToast("error", text)),
  info: (text: string) => store.dispatch(pushToast("info", text)),
  warning: (text: string) => store.dispatch(pushToast("warning", text)),
};
