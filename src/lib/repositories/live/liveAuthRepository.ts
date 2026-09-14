import { executeLive } from "@/lib/api/http";
import type { ApiResponse, Permiso, Rol, Usuario } from "@/types";
import type { AuthLoginResult, IAuthRepository } from "../types";

export class LiveAuthRepository implements IAuthRepository {
  getUsuarios(): Promise<ApiResponse<Usuario[]>> {
    return executeLive("/usuarios", "GET");
  }

  getUsuarioById(id: string): Promise<ApiResponse<Usuario | null>> {
    return executeLive(`/usuarios/${id}`, "GET");
  }

  createUsuario(usuario: Partial<Usuario>): Promise<ApiResponse<Usuario>> {
    return executeLive("/usuarios", "POST", usuario);
  }

  updateUsuario(id: string, usuario: Partial<Usuario>): Promise<ApiResponse<Usuario>> {
    return executeLive(`/usuarios/${id}`, "PUT", usuario);
  }

  deleteUsuario(id: string): Promise<ApiResponse<boolean>> {
    return executeLive(`/usuarios/${id}`, "DELETE");
  }

  getRoles(): Promise<ApiResponse<Rol[]>> {
    return executeLive("/roles", "GET");
  }

  createRol(rol: Partial<Rol>): Promise<ApiResponse<Rol>> {
    return executeLive("/roles", "POST", rol);
  }

  updateRol(id: string, rol: Partial<Rol>): Promise<ApiResponse<Rol>> {
    return executeLive(`/roles/${id}`, "PUT", rol);
  }

  deleteRol(id: string): Promise<ApiResponse<boolean>> {
    return executeLive(`/roles/${id}`, "DELETE");
  }

  updateRolPermisos(rolId: string, permisosIds: string[]): Promise<ApiResponse<Rol>> {
    return executeLive(`/roles/${rolId}/permisos`, "PATCH", { permisosIds });
  }

  getPermisos(): Promise<ApiResponse<Permiso[]>> {
    return executeLive("/permisos", "GET");
  }

  login(email: string, password?: string): Promise<ApiResponse<AuthLoginResult>> {
    return executeLive("/auth/login", "POST", { email, password });
  }

  getUsuarioActual(): Promise<ApiResponse<Usuario | null>> {
    return executeLive("/auth/me", "GET");
  }

  impersonateUser(usuarioId: string): Promise<ApiResponse<AuthLoginResult>> {
    return executeLive(`/auth/impersonate/${usuarioId}`, "POST");
  }
}
