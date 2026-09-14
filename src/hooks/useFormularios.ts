"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { repositories } from "@/lib/repositories";
import { unwrap } from "@/lib/api/http";
import { queryKeys } from "@/lib/api/queryKeys";
import type { FormularioDinamico, RespuestaFormularioCita } from "@/types";

export function useFormulariosDinamicos() {
  return useQuery({
    queryKey: queryKeys.formularios,
    queryFn: async () => unwrap(await repositories.workflowRepo.getFormularios()),
  });
}

function useInvalidateFormularios() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.formularios });
}

export function useGuardarFormulario() {
  const invalidate = useInvalidateFormularios();
  return useMutation({
    mutationFn: async (formulario: Partial<FormularioDinamico>) =>
      unwrap(await repositories.workflowRepo.guardarFormulario(formulario)),
    onSuccess: invalidate,
  });
}

export function useEliminarFormulario() {
  const invalidate = useInvalidateFormularios();
  return useMutation({
    mutationFn: async (id: string) => unwrap(await repositories.workflowRepo.deleteFormulario(id)),
    onSuccess: invalidate,
  });
}

export function useDuplicarFormulario() {
  const invalidate = useInvalidateFormularios();
  return useMutation({
    mutationFn: async (id: string) => unwrap(await repositories.workflowRepo.duplicarFormulario(id)),
    onSuccess: invalidate,
  });
}

export function useGuardarRespuestaFormulario() {
  return useMutation({
    mutationFn: async (respuesta: Partial<RespuestaFormularioCita>) =>
      unwrap(await repositories.workflowRepo.guardarRespuestaFormulario(respuesta)),
  });
}
