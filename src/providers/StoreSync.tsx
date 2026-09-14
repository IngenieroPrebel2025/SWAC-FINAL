"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { store } from "@/store";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { hydrateAuth } from "@/store/slices/authSlice";
import { hydrateSystemConfig } from "@/store/slices/systemConfigSlice";
import { readPersistedAuth, readPersistedConfig, startPersistence } from "@/store/persistence";

/**
 * Hidrata Redux desde localStorage tras el montaje (SSR-safe), activa la
 * persistencia y reinicia la caché de TanStack Query cuando cambian el
 * usuario o el origen de datos (evita mostrar datos de otro perfil/adaptador).
 */
export function StoreSync() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const userId = useAppSelector((s) => s.auth.session?.usuario.id);
  const mode = useAppSelector((s) => s.systemConfig.dataSourceMode);
  const apiBaseUrl = useAppSelector((s) => s.systemConfig.apiBaseUrl);

  useEffect(() => {
    dispatch(hydrateSystemConfig(readPersistedConfig()));
    dispatch(hydrateAuth(readPersistedAuth()));
    return startPersistence(store);
  }, [dispatch]);

  useEffect(() => {
    queryClient.resetQueries();
  }, [userId, mode, apiBaseUrl, queryClient]);

  return null;
}
