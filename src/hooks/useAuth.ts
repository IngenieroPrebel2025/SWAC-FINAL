"use client";

import { useCallback, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setActiveSede, setSession } from "@/store/slices/authSlice";
import { hasPermission as checkPermission, isAllowedInSede as checkSede } from "@/lib/auth/permissions";
import { authenticate, impersonateSession } from "@/lib/auth/session";
import { useSedes } from "@/hooks/useCatalogos";
import type { Sede } from "@/types";

const NO_SEDES: Sede[] = [];

/**
 * Sesión, RBAC y alcance multi-sede del usuario autenticado.
 * Fuente de verdad: `store.auth` (Redux) + catálogo de sedes (TanStack Query).
 */
export function useAuth() {
  const dispatch = useAppDispatch();
  const session = useAppSelector((s) => s.auth.session);
  const activeSedeId = useAppSelector((s) => s.auth.activeSedeId);
  const hydrated = useAppSelector((s) => s.auth.hydrated);
  const { data: allSedes = NO_SEDES } = useSedes(Boolean(session));

  const usuario = session?.usuario ?? null;
  const rolCodigo = usuario?.rolCodigo ?? "";
  const isGlobalAdmin = rolCodigo === "ADMINISTRADOR";
  const isSiteAdmin = rolCodigo === "SUPERVISOR_CD";
  const isProvider = rolCodigo === "PROVEEDOR";
  const isGateOfficer = rolCodigo === "PORTERIA";
  const isCustomUser = rolCodigo === "PERSONALIZADO";

  const availableSedes = useMemo(() => {
    if (!usuario) return NO_SEDES;
    if (isGlobalAdmin || !usuario.sedesAsignadasIds?.length) return allSedes;
    return allSedes.filter((s) => usuario.sedesAsignadasIds.includes(s.id));
  }, [allSedes, usuario, isGlobalAdmin]);

  const activeSede = useMemo(
    () => availableSedes.find((s) => s.id === activeSedeId) ?? availableSedes[0] ?? null,
    [availableSedes, activeSedeId]
  );

  const hasPermission = useCallback(
    (actionOrCode: string, resource?: string, scopeId?: string) =>
      checkPermission(session, actionOrCode, resource, scopeId),
    [session]
  );

  const isAllowedInSede = useCallback((sedeId: string) => checkSede(session, sedeId), [session]);

  const setActiveSedeId = useCallback(
    (sedeId: string) => {
      if (checkSede(session, sedeId)) dispatch(setActiveSede(sedeId));
    },
    [dispatch, session]
  );

  const login = useCallback(
    async (email: string, password?: string) => {
      try {
        dispatch(setSession(await authenticate(email, password)));
        return { success: true as const };
      } catch (err) {
        return {
          success: false as const,
          error: err instanceof Error ? err.message : "No se pudo iniciar sesión",
        };
      }
    },
    [dispatch]
  );

  const logout = useCallback(() => {
    dispatch(setSession(null));
  }, [dispatch]);

  const impersonate = useCallback(
    async (usuarioId: string) => {
      const next = await impersonateSession(usuarioId);
      dispatch(setSession(next));
      return next;
    },
    [dispatch]
  );

  return {
    session,
    usuario,
    token: session?.token ?? null,
    hydrated,
    isAuthenticated: Boolean(session),
    rolCodigo,
    isGlobalAdmin,
    isSiteAdmin,
    isProvider,
    isGateOfficer,
    isCustomUser,
    allSedes,
    availableSedes,
    activeSede,
    activeSedeId,
    hasMultipleSedes: availableSedes.length > 1,
    hasPermission,
    isAllowedInSede,
    setActiveSedeId,
    login,
    logout,
    impersonate,
  };
}
