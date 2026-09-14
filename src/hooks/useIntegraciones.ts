"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { repositories } from "@/lib/repositories";
import { unwrap } from "@/lib/api/http";
import { queryKeys } from "@/lib/api/queryKeys";
import type { IntegracionApiConfig, ModoEjecucionIntegracion } from "@/types";

export function useIntegraciones() {
  return useQuery({
    queryKey: queryKeys.integraciones,
    queryFn: async () => unwrap(await repositories.integrationRepo.getIntegraciones()),
  });
}

export function useGuardarIntegracion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (config: Partial<IntegracionApiConfig>) =>
      unwrap(await repositories.integrationRepo.guardarIntegracion(config)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.integraciones }),
  });
}

export function useProbarConexion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { integracionId: string; modo?: ModoEjecucionIntegracion }) =>
      unwrap(await repositories.integrationRepo.probarConexionApi(vars.integracionId, undefined, vars.modo)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.integraciones }),
  });
}
