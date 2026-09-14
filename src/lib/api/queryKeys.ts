import type { EstadoTurnoPatio } from "@/types";

export interface CitasFilter {
  sedeId?: string;
  fecha?: string;
  estado?: string;
  search?: string;
  proveedorId?: string;
}

export interface TurnosFilter {
  sedeId?: string;
  estado?: EstadoTurnoPatio;
  search?: string;
}

/**
 * Llaves de TanStack Query centralizadas.
 * El primer segmento es el "dominio" → permite invalidar por prefijo.
 */
export const queryKeys = {
  sedes: ["sedes"] as const,
  muelles: (sedeId: string) => ["muelles", sedeId] as const,
  muellesLogs: (sedeId: string) => ["muelles-logs", sedeId] as const,
  proveedores: ["proveedores"] as const,
  tiposMaterial: ["tipos-material"] as const,
  materiales: ["materiales"] as const,
  vehiculos: ["vehiculos"] as const,
  conductores: ["conductores"] as const,
  citas: (filter: CitasFilter = {}) => ["citas", filter] as const,
  turnos: (filter: TurnosFilter = {}) => ["turnos", filter] as const,
  salidas: (sedeId?: string) => ["salidas", sedeId ?? "all"] as const,
  driverSession: (query: string) => ["driver-session", query] as const,
  formularios: ["formularios"] as const,
  usuarios: ["usuarios"] as const,
  roles: ["roles"] as const,
  permisos: ["permisos"] as const,
  integraciones: ["integraciones"] as const,
};
