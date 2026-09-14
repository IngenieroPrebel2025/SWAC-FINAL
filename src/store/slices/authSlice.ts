import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { SesionUsuario } from "@/types";

export const DEFAULT_SEDE_ID = "sede-rio-01";

interface AuthState {
  /** Sesión autenticada (JWT + usuario + permisos efectivos). null = sin sesión. */
  session: SesionUsuario | null;
  /** Sede operativa activa — filtra muelles, citas y portería. */
  activeSedeId: string;
  /** true una vez leída la sesión persistida en el cliente. */
  hydrated: boolean;
}

const initialState: AuthState = {
  session: null,
  activeSedeId: DEFAULT_SEDE_ID,
  hydrated: false,
};

/** Garantiza que la sede activa pertenezca a las sedes asignadas del usuario. */
function alignActiveSede(state: AuthState) {
  const sedes = state.session?.usuario.sedesAsignadasIds ?? [];
  if (sedes.length > 0 && !sedes.includes(state.activeSedeId)) {
    state.activeSedeId = sedes[0];
  }
}

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    hydrateAuth(
      state,
      action: PayloadAction<{ session: SesionUsuario | null; activeSedeId?: string }>
    ) {
      state.session = action.payload.session;
      if (action.payload.activeSedeId) state.activeSedeId = action.payload.activeSedeId;
      alignActiveSede(state);
      state.hydrated = true;
    },
    setSession(state, action: PayloadAction<SesionUsuario | null>) {
      state.session = action.payload;
      alignActiveSede(state);
    },
    updateSessionPermissions(state, action: PayloadAction<string[]>) {
      if (state.session) state.session.permisosEfectivos = action.payload;
    },
    setActiveSede(state, action: PayloadAction<string>) {
      state.activeSedeId = action.payload;
    },
  },
});

export const { hydrateAuth, setSession, updateSessionPermissions, setActiveSede } =
  authSlice.actions;
export default authSlice.reducer;
