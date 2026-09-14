"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { repositories } from "@/lib/repositories";
import { unwrap } from "@/lib/api/http";
import { queryKeys } from "@/lib/api/queryKeys";

/** Catálogos maestros compartidos por varios módulos (TanStack Query). */

export function useSedes(enabled = true) {
  return useQuery({
    queryKey: queryKeys.sedes,
    queryFn: async () => unwrap(await repositories.siteRepo.getSedes()),
    enabled,
  });
}

/** `sedeId` vacío = todos los muelles; `undefined` = consulta deshabilitada. */
export function useMuelles(sedeId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.muelles(sedeId ?? ""),
    queryFn: async () => unwrap(await repositories.dockRepo.getMuellesBySede(sedeId ?? "")),
    enabled: sedeId !== undefined,
  });
}

export function useProveedores() {
  return useQuery({
    queryKey: queryKeys.proveedores,
    queryFn: async () => unwrap(await repositories.supplierRepo.getProveedores()),
  });
}

export function useTiposMaterial() {
  return useQuery({
    queryKey: queryKeys.tiposMaterial,
    queryFn: async () => unwrap(await repositories.supplierRepo.getTiposMaterial()),
  });
}

export function useMateriales() {
  return useQuery({
    queryKey: queryKeys.materiales,
    queryFn: async () => unwrap(await repositories.supplierRepo.getMateriales()),
  });
}

export function useGuardarMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (material: Partial<import("@/types").Material>) => {
      const result = material.id
        ? await repositories.supplierRepo.updateMaterial(material.id, material)
        : await repositories.supplierRepo.createMaterial(material);
      return unwrap(result);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.materiales }),
  });
}

export function useVehiculos() {
  return useQuery({
    queryKey: queryKeys.vehiculos,
    queryFn: async () => unwrap(await repositories.appointmentRepo.getVehiculos()),
  });
}

export function useConductores() {
  return useQuery({
    queryKey: queryKeys.conductores,
    queryFn: async () => unwrap(await repositories.appointmentRepo.getConductores()),
  });
}
