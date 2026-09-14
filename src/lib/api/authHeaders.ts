import { store } from "@/store";

/** Cabeceras de autenticación y aislamiento multi-sede para el backend. */
export function getAuthHeaders(): Record<string, string> {
  const { auth, systemConfig } = store.getState();
  const user = auth.session?.usuario;

  const headers: Record<string, string> = {
    "X-Client-Version": systemConfig.version,
    "X-Active-Sede": auth.activeSedeId,
    "X-Sedes-Asignadas": user?.sedesAsignadasIds?.length ? user.sedesAsignadasIds.join(",") : "ALL",
  };
  if (auth.session?.token) headers.Authorization = `Bearer ${auth.session.token}`;
  if (user?.rolCodigo) headers["X-User-Role"] = user.rolCodigo;
  if (user?.nit_proveedor) headers["X-Nit-Proveedor"] = user.nit_proveedor;
  if (user?.proveedorId) headers["X-Proveedor-Id"] = user.proveedorId;
  return headers;
}
