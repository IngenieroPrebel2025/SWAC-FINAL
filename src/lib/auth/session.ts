import { repositories } from "@/lib/repositories";
import { unwrap } from "@/lib/api/http";
import type { SesionUsuario, Usuario } from "@/types";

interface AuthPayload {
  usuario: Usuario;
  token: string;
  permisos: string[];
}

function buildSession({ usuario, token, permisos }: AuthPayload, hours: number): SesionUsuario {
  return {
    token,
    refreshToken: `refresh-${usuario.id}-${Date.now()}`,
    expiraEn: new Date(Date.now() + hours * 60 * 60 * 1000).toISOString(),
    usuario,
    permisosEfectivos: permisos,
  };
}

/** Autentica contra el adaptador activo (mock o API real) y construye la sesión. */
export async function authenticate(email: string, password?: string): Promise<SesionUsuario> {
  const res = await repositories.authRepo.login(email.trim().toLowerCase(), password);
  return buildSession(unwrap(res), 8);
}

/** Inicia sesión como otro usuario (simulación de perfiles / soporte). */
export async function impersonateSession(usuarioId: string): Promise<SesionUsuario> {
  const res = await repositories.authRepo.impersonateUser(usuarioId);
  return buildSession(unwrap(res), 4);
}
