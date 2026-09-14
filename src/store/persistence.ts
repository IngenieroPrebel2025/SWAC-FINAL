import type { SesionUsuario, SystemConfig } from "@/types";
import type { store as appStore } from "./index";

const AUTH_KEY = "swac-auth-v1";
const CONFIG_KEY = "swac-system-config-v1";

interface PersistedAuth {
  session: SesionUsuario | null;
  activeSedeId?: string;
}

function read<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota / private mode */
  }
}

/** Lee la sesión persistida descartando las que ya expiraron. */
export function readPersistedAuth(): PersistedAuth {
  const stored = read<PersistedAuth>(AUTH_KEY);
  if (!stored?.session) return { session: null, activeSedeId: stored?.activeSedeId };
  const expired = new Date(stored.session.expiraEn).getTime() < Date.now();
  return { session: expired ? null : stored.session, activeSedeId: stored.activeSedeId };
}

export function readPersistedConfig(): Partial<SystemConfig> | null {
  return read<Partial<SystemConfig>>(CONFIG_KEY);
}

/** Persiste auth y configuración del sistema cada vez que cambian. */
export function startPersistence(store: typeof appStore): () => void {
  let prevAuth = store.getState().auth;
  let prevConfig = store.getState().systemConfig;

  return store.subscribe(() => {
    const { auth, systemConfig } = store.getState();
    if (!auth.hydrated) return;
    if (auth !== prevAuth) {
      prevAuth = auth;
      write(AUTH_KEY, { session: auth.session, activeSedeId: auth.activeSedeId });
    }
    if (systemConfig !== prevConfig) {
      prevConfig = systemConfig;
      write(CONFIG_KEY, systemConfig);
    }
  });
}
