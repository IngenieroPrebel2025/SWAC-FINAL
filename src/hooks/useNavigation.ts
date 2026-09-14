"use client";

import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { filterNavigation, type AccessContext } from "@/config/navigation";

/** Contexto RBAC mínimo para evaluar reglas de acceso de navegación. */
export function useAccessContext(): AccessContext {
  const { rolCodigo, isGlobalAdmin, isSiteAdmin, isProvider, isGateOfficer, hasPermission } = useAuth();
  return useMemo(
    () => ({ rolCodigo, isGlobalAdmin, isSiteAdmin, isProvider, isGateOfficer, hasPermission }),
    [rolCodigo, isGlobalAdmin, isSiteAdmin, isProvider, isGateOfficer, hasPermission]
  );
}

/** Árbol de navegación filtrado por los permisos del usuario actual. */
export function useFilteredNavigation() {
  const ctx = useAccessContext();
  return useMemo(() => filterNavigation(ctx), [ctx]);
}
