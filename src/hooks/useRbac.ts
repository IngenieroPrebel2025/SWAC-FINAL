"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { repositories } from "@/lib/repositories";
import { unwrap } from "@/lib/api/http";
import { queryKeys } from "@/lib/api/queryKeys";
import type { Rol, Usuario } from "@/types";

export function useUsuarios(enabled = true) {
  return useQuery({
    queryKey: queryKeys.usuarios,
    queryFn: async () => unwrap(await repositories.authRepo.getUsuarios()),
    enabled,
  });
}

export function useRoles() {
  return useQuery({
    queryKey: queryKeys.roles,
    queryFn: async () => unwrap(await repositories.authRepo.getRoles()),
  });
}

export function usePermisos() {
  return useQuery({
    queryKey: queryKeys.permisos,
    queryFn: async () => unwrap(await repositories.authRepo.getPermisos()),
  });
}

export function useGuardarUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (usuario: Partial<Usuario>) =>
      unwrap(
        usuario.id
          ? await repositories.authRepo.updateUsuario(usuario.id, usuario)
          : await repositories.authRepo.createUsuario(usuario)
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.usuarios }),
  });
}

export function useEliminarUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => unwrap(await repositories.authRepo.deleteUsuario(id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.usuarios }),
  });
}

export function useCrearRol() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (rol: Partial<Rol>) => unwrap(await repositories.authRepo.createRol(rol)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.roles }),
  });
}

export function useEliminarRol() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => unwrap(await repositories.authRepo.deleteRol(id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.roles }),
  });
}

/** Actualización optimista de la matriz RBAC (respuesta inmediata al marcar permisos). */
export function useActualizarPermisosRol() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { rolId: string; permisosIds: string[] }) =>
      unwrap(await repositories.authRepo.updateRolPermisos(vars.rolId, vars.permisosIds)),
    onMutate: async ({ rolId, permisosIds }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.roles });
      const previous = queryClient.getQueryData<Rol[]>(queryKeys.roles);
      queryClient.setQueryData<Rol[]>(queryKeys.roles, (old) =>
        old?.map((r) => (r.id === rolId ? { ...r, permisosIds } : r))
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.roles, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.roles }),
  });
}
