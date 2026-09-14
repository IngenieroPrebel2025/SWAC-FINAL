"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { repositories } from "@/lib/repositories";
import { unwrap } from "@/lib/api/http";
import { queryKeys } from "@/lib/api/queryKeys";
import type { EstadoMuelle, Muelle, MuelleDisponibilidadLog, Sede } from "@/types";

export function useLogsDisponibilidad(sedeId: string) {
  return useQuery({
    queryKey: queryKeys.muellesLogs(sedeId),
    queryFn: async () => unwrap(await repositories.dockRepo.getLogsDisponibilidad(sedeId)),
  });
}

function useInvalidate(...keys: string[]) {
  const queryClient = useQueryClient();
  return () => keys.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
}

export function useGuardarSede() {
  const invalidate = useInvalidate("sedes");
  return useMutation({
    mutationFn: async (sede: Partial<Sede>) =>
      unwrap(
        sede.id
          ? await repositories.siteRepo.updateSede(sede.id, sede)
          : await repositories.siteRepo.createSede(sede)
      ),
    onSuccess: invalidate,
  });
}

export function useEliminarSede() {
  const invalidate = useInvalidate("sedes", "muelles");
  return useMutation({
    mutationFn: async (id: string) => unwrap(await repositories.siteRepo.deleteSede(id)),
    onSuccess: invalidate,
  });
}

export function useGuardarMuelle() {
  const invalidate = useInvalidate("muelles");
  return useMutation({
    mutationFn: async (muelle: Partial<Muelle>) =>
      unwrap(
        muelle.id
          ? await repositories.dockRepo.updateMuelle(muelle.id, muelle)
          : await repositories.dockRepo.createMuelle(muelle)
      ),
    onSuccess: invalidate,
  });
}

export function useEliminarMuelle() {
  const invalidate = useInvalidate("muelles");
  return useMutation({
    mutationFn: async (id: string) => unwrap(await repositories.dockRepo.deleteMuelle(id)),
    onSuccess: invalidate,
  });
}

export function useCambiarEstadoMuelle() {
  const invalidate = useInvalidate("muelles", "muelles-logs");
  return useMutation({
    mutationFn: async (vars: { muelleId: string; estado: EstadoMuelle; motivo: string; usuarioId: string }) =>
      unwrap(await repositories.dockRepo.cambiarEstadoMuelle(vars.muelleId, vars.estado, vars.motivo, vars.usuarioId)),
    onSuccess: invalidate,
  });
}

export function useRegistrarLogDisponibilidad() {
  const invalidate = useInvalidate("muelles-logs");
  return useMutation({
    mutationFn: async (log: Partial<MuelleDisponibilidadLog>) =>
      unwrap(await repositories.dockRepo.registrarLogDisponibilidad(log)),
    onSuccess: invalidate,
  });
}

export function useEliminarLogDisponibilidad() {
  const invalidate = useInvalidate("muelles-logs");
  return useMutation({
    mutationFn: async (logId: string) => unwrap(await repositories.dockRepo.eliminarLogDisponibilidad(logId)),
    onSuccess: invalidate,
  });
}
