"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { repositories } from "@/lib/repositories";
import { unwrap } from "@/lib/api/http";
import { queryKeys, type TurnosFilter } from "@/lib/api/queryKeys";
import type { InspeccionPorteria, RegistroSalidaPorteria } from "@/types";

export function useTurnosPatio(filter: TurnosFilter = {}) {
  return useQuery({
    queryKey: queryKeys.turnos(filter),
    queryFn: async () => unwrap(await repositories.gateRepo.getTurnosPatio(filter)),
  });
}

export function useHistorialSalidas(sedeId?: string) {
  return useQuery({
    queryKey: queryKeys.salidas(sedeId),
    queryFn: async () => unwrap(await repositories.gateRepo.getHistorialSalidas(sedeId)),
  });
}

/** Pase digital del conductor por código de cita, placa o cédula. */
export function useDriverSession(query: string | null) {
  return useQuery({
    queryKey: queryKeys.driverSession(query ?? ""),
    queryFn: async () => {
      const q = query ?? "";
      return unwrap(await repositories.gateRepo.getDriverSession({ codigoCita: q, placa: q, cedula: q }));
    },
    enabled: Boolean(query),
  });
}

function useInvalidatePorteria() {
  const queryClient = useQueryClient();
  return () => {
    ["turnos", "citas", "salidas", "driver-session", "muelles"].forEach((key) =>
      queryClient.invalidateQueries({ queryKey: [key] })
    );
  };
}

export function useRegistrarLlegada() {
  const invalidate = useInvalidatePorteria();
  return useMutation({
    mutationFn: async (data: { citaId: string; guardaId: string; guardaNombre: string }) =>
      unwrap(await repositories.gateRepo.registrarLlegadaPorteria(data)),
    onSuccess: invalidate,
  });
}

export function useGuardarInspeccion() {
  const invalidate = useInvalidatePorteria();
  return useMutation({
    mutationFn: async (inspeccion: Partial<InspeccionPorteria>) =>
      unwrap(await repositories.gateRepo.guardarInspeccionPorteria(inspeccion)),
    onSuccess: invalidate,
  });
}

export function useLlamarAMuelle() {
  const invalidate = useInvalidatePorteria();
  return useMutation({
    mutationFn: async (vars: { turnoId: string; muelleId?: string }) =>
      unwrap(await repositories.gateRepo.llamarVehiculoAMuelle(vars.turnoId, vars.muelleId)),
    onSuccess: invalidate,
  });
}

export type AccionTurno = "posicionar" | "iniciar" | "finalizar";

export function useAvanzarTurno() {
  const invalidate = useInvalidatePorteria();
  return useMutation({
    mutationFn: async ({ turnoId, accion }: { turnoId: string; accion: AccionTurno }) => {
      const repo = repositories.gateRepo;
      if (accion === "posicionar") return unwrap(await repo.posicionarEnMuelle(turnoId));
      if (accion === "iniciar") return unwrap(await repo.iniciarDescargue(turnoId));
      return unwrap(await repo.finalizarDescargue(turnoId));
    },
    onSuccess: invalidate,
  });
}

export function useCancelarTurno() {
  const invalidate = useInvalidatePorteria();
  return useMutation({
    mutationFn: async (turnoId: string) => unwrap(await repositories.gateRepo.cancelarTurnoPatio(turnoId)),
    onSuccess: invalidate,
  });
}

export function useRegistrarSalida() {
  const invalidate = useInvalidatePorteria();
  return useMutation({
    mutationFn: async (data: Partial<RegistroSalidaPorteria>) =>
      unwrap(await repositories.gateRepo.registrarSalidaPlanta(data)),
    onSuccess: invalidate,
  });
}
