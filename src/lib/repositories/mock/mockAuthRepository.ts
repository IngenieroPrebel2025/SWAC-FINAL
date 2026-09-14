import { executeMock } from "@/lib/api/http";
import { createSimulatedJwt } from "@/lib/auth/jwt";
import { MOCK_PERMISOS, MOCK_ROLES, MOCK_USUARIOS } from "@/mocks/auth.mock";
import type { ApiResponse, Permiso, Rol, Usuario } from "@/types";
import type { AuthLoginResult, IAuthRepository } from "../types";

export class MockAuthRepository implements IAuthRepository {
  private usuarios: Usuario[] = [...MOCK_USUARIOS];
  private roles: Rol[] = [...MOCK_ROLES];
  private permisos: Permiso[] = [...MOCK_PERMISOS];
  private usuarioActivo: Usuario | null = null;

  private permisosDeUsuario(usuario: Usuario): string[] {
    const rol = this.roles.find((r) => r.id === usuario.rolId);
    return rol ? this.permisos.filter((p) => rol.permisosIds.includes(p.id)).map((p) => p.codigo) : [];
  }

  private authResult(usuario: Usuario): AuthLoginResult {
    const permisos = this.permisosDeUsuario(usuario);
    this.usuarioActivo = usuario;
    return { usuario, token: createSimulatedJwt(usuario, permisos), permisos };
  }

  getUsuarios(): Promise<ApiResponse<Usuario[]>> {
    return executeMock("/usuarios", "GET", () => [...this.usuarios]);
  }

  getUsuarioById(id: string): Promise<ApiResponse<Usuario | null>> {
    return executeMock(`/usuarios/${id}`, "GET", () => this.usuarios.find((u) => u.id === id) ?? null);
  }

  createUsuario(data: Partial<Usuario>): Promise<ApiResponse<Usuario>> {
    return executeMock(
      "/usuarios",
      "POST",
      () => {
        if (this.usuarios.some((u) => u.email.toLowerCase() === data.email?.toLowerCase())) {
          throw new Error(`Ya existe un usuario registrado con el correo ${data.email}`);
        }
        const rol = this.roles.find((r) => r.id === data.rolId) ?? this.roles[0];
        const nuevo: Usuario = {
          nombreCompleto: "Nuevo Usuario",
          email: "usuario@empresa.com",
          documentoIdentidad: "12345678",
          telefono: "+57 300 000 0000",
          activo: true,
          ...data,
          id: `usr-${Date.now().toString().slice(-6)}`,
          rolId: rol.id,
          rolCodigo: rol.codigo,
          sedesAsignadasIds: data.sedesAsignadasIds ?? [],
          creadoEn: new Date().toISOString(),
        };
        this.usuarios.unshift(nuevo);
        return nuevo;
      },
      data
    );
  }

  updateUsuario(id: string, data: Partial<Usuario>): Promise<ApiResponse<Usuario>> {
    return executeMock(
      `/usuarios/${id}`,
      "PUT",
      () => {
        const idx = this.usuarios.findIndex((u) => u.id === id);
        if (idx === -1) throw new Error(`Usuario con ID ${id} no encontrado`);
        const rol = data.rolId ? this.roles.find((r) => r.id === data.rolId) : undefined;
        const actualizado: Usuario = {
          ...this.usuarios[idx],
          ...data,
          rolCodigo: rol?.codigo ?? this.usuarios[idx].rolCodigo,
          id,
        };
        this.usuarios[idx] = actualizado;
        return actualizado;
      },
      data
    );
  }

  deleteUsuario(id: string): Promise<ApiResponse<boolean>> {
    return executeMock(`/usuarios/${id}`, "DELETE", () => {
      const len = this.usuarios.length;
      this.usuarios = this.usuarios.filter((u) => u.id !== id);
      return this.usuarios.length < len;
    });
  }

  getRoles(): Promise<ApiResponse<Rol[]>> {
    return executeMock("/roles", "GET", () => [...this.roles]);
  }

  createRol(data: Partial<Rol>): Promise<ApiResponse<Rol>> {
    return executeMock(
      "/roles",
      "POST",
      () => {
        const now = new Date().toISOString();
        const nuevo: Rol = {
          codigo: "PERSONALIZADO",
          nombre: "Nuevo Rol Personalizado",
          descripcion: "",
          permisosIds: [],
          ...data,
          id: `rol-${Date.now().toString().slice(-6)}`,
          esSistema: false,
          activo: true,
          creadoEn: now,
          actualizadoEn: now,
        };
        this.roles.push(nuevo);
        return nuevo;
      },
      data
    );
  }

  updateRol(id: string, data: Partial<Rol>): Promise<ApiResponse<Rol>> {
    return executeMock(
      `/roles/${id}`,
      "PUT",
      () => {
        const idx = this.roles.findIndex((r) => r.id === id);
        if (idx === -1) throw new Error(`Rol con ID ${id} no encontrado`);
        this.roles[idx] = { ...this.roles[idx], ...data, id, actualizadoEn: new Date().toISOString() };
        return this.roles[idx];
      },
      data
    );
  }

  deleteRol(id: string): Promise<ApiResponse<boolean>> {
    return executeMock(`/roles/${id}`, "DELETE", () => {
      const rol = this.roles.find((r) => r.id === id);
      if (rol?.esSistema) throw new Error("No es posible eliminar roles del sistema.");
      if (this.usuarios.some((u) => u.rolId === id)) {
        throw new Error("El rol tiene usuarios asignados. Reasígnelos antes de eliminarlo.");
      }
      const len = this.roles.length;
      this.roles = this.roles.filter((r) => r.id !== id);
      return this.roles.length < len;
    });
  }

  updateRolPermisos(rolId: string, permisosIds: string[]): Promise<ApiResponse<Rol>> {
    return executeMock(
      `/roles/${rolId}/permisos`,
      "PATCH",
      () => {
        const idx = this.roles.findIndex((r) => r.id === rolId);
        if (idx === -1) throw new Error(`Rol con ID ${rolId} no encontrado`);
        this.roles[idx] = { ...this.roles[idx], permisosIds: [...permisosIds], actualizadoEn: new Date().toISOString() };
        return this.roles[idx];
      },
      { permisosIds }
    );
  }

  getPermisos(): Promise<ApiResponse<Permiso[]>> {
    return executeMock("/permisos", "GET", () => [...this.permisos]);
  }

  login(email: string): Promise<ApiResponse<AuthLoginResult>> {
    return executeMock(
      "/auth/login",
      "POST",
      () => {
        const found = this.usuarios.find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (!found) {
          throw new Error("Credenciales inválidas. Seleccione uno de los perfiles de demostración autorizados.");
        }
        if (!found.activo) throw new Error("El usuario se encuentra inactivo. Contacte al administrador.");
        return this.authResult(found);
      },
      { email }
    );
  }

  getUsuarioActual(): Promise<ApiResponse<Usuario | null>> {
    return executeMock("/auth/me", "GET", () => this.usuarioActivo);
  }

  impersonateUser(usuarioId: string): Promise<ApiResponse<AuthLoginResult>> {
    return executeMock(`/auth/impersonate/${usuarioId}`, "POST", () => {
      const found = this.usuarios.find((u) => u.id === usuarioId);
      if (!found) throw new Error("Usuario no encontrado");
      return this.authResult(found);
    });
  }
}
