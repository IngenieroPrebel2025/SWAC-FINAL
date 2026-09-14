"use client";

import { useAuth } from "@/hooks/useAuth";
import { getInitials } from "@/lib/format";
import { rolInfo } from "@/lib/status";

/** Datos de presentación del usuario autenticado (header, menús, avatar). */
export function useCurrentUser() {
  const { usuario } = useAuth();
  if (!usuario) return { data: undefined };

  const nombre = usuario.nombreCompleto.replace(/\s*\(.*?\)\s*/g, " ").trim();
  return {
    data: {
      id: usuario.id,
      nombre,
      primerNombre: nombre.split(" ")[0],
      email: usuario.email,
      initials: getInitials(nombre),
      rolCodigo: usuario.rolCodigo,
      roleLabel: rolInfo(usuario.rolCodigo).label,
      roleTone: rolInfo(usuario.rolCodigo).tone,
      nitProveedor: usuario.nit_proveedor,
    },
  };
}
