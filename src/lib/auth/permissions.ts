import type { SesionUsuario } from "@/types";

/** Sinónimos de códigos de permiso para interoperabilidad entre módulos. */
const EQUIVALENTS: Record<string, string[]> = {
  INDICADORES_LEER: ["DASHBOARDS_VER", "INDICADORES_LEER"],
  DASHBOARDS_VER: ["DASHBOARDS_VER", "INDICADORES_LEER"],
  FORMULARIOS_LEER: ["FORMULARIOS_VER", "FORMULARIOS_LEER"],
  FORMULARIOS_VER: ["FORMULARIOS_VER", "FORMULARIOS_LEER"],
  INTEGRACIONES_LEER: ["APIS_LEER", "INTEGRACIONES_LEER"],
  APIS_LEER: ["APIS_LEER", "INTEGRACIONES_LEER"],
  CITAS_LEER: ["CITAS_LEER", "CITAS_PROGRAMACION_LEER"],
  SEDES_LEER: ["SEDES_LEER", "SEDES_MUELLES_LEER"],
  MUELLES_HABILITAR: ["MUELLES_HABILITAR", "MUELLES_EDITAR"],
};

/**
 * Validador RBAC granular.
 * Acepta un código estándar (`CITAS_LEER`) o la tupla (acción, recurso, scopeId).
 * Orden de evaluación: administrador global → permisos especiales → permisos del rol.
 */
export function hasPermission(
  session: SesionUsuario | null,
  actionOrCode: string,
  resource?: string,
  scopeId?: string
): boolean {
  if (!session) return false;
  const user = session.usuario;
  if (user.rolCodigo === "ADMINISTRADOR") return true;

  const especiales = user.permisosEspeciales ?? [];
  if (especiales.length > 0) {
    const especial = especiales.find((p) => {
      const directAction = p.action === actionOrCode;
      const directResource = !resource || p.resource === resource;
      const directScope = !scopeId || !p.scopeId || p.scopeId === scopeId;
      if (directAction && directResource && directScope) return true;

      if (actionOrCode === "CITAS_LEER" && p.resource?.includes("CITAS") && p.action === "LEER") return true;
      if (actionOrCode === "SEDES_LEER" && p.resource?.includes("SEDES") && p.action === "LEER") return true;
      if (
        (actionOrCode === "MUELLES_HABILITAR" || actionOrCode === "MUELLES_EDITAR") &&
        p.resource?.includes("MUELLES") &&
        (p.action === "EDITAR" || p.action === "HABILITAR")
      ) {
        return !scopeId || !p.scopeId || p.scopeId === scopeId;
      }
      return false;
    });
    if (especial) return especial.concedido !== false;
  }

  const efectivos = session.permisosEfectivos;
  if (resource) {
    if (efectivos.includes(`${resource}_${actionOrCode}`)) return true;
    if (efectivos.includes(`${resource}_ADMIN`)) return true;
  }
  const targets = EQUIVALENTS[actionOrCode] ?? [actionOrCode];
  return targets.some((code) => efectivos.includes(code));
}

/** Aislamiento multi-sede: vacío = acceso a todas las sedes. */
export function isAllowedInSede(session: SesionUsuario | null, sedeId: string): boolean {
  if (!session) return false;
  const { sedesAsignadasIds, rolCodigo } = session.usuario;
  if (rolCodigo === "ADMINISTRADOR") return true;
  if (!sedesAsignadasIds || sedesAsignadasIds.length === 0) return true;
  return sedesAsignadasIds.includes(sedeId);
}
