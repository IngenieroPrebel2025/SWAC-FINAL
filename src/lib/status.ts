import type {
  CodigoRol,
  EstadoCita,
  EstadoMuelle,
  EstadoTurnoPatio,
  TipoMuelle,
} from "@/types";
import type { StatusTone } from "@/types/ui";

export type Tone = "blue" | "green" | "coral" | "slate" | "amber" | "navy";

/** Color sólido (token) asociado a cada tono — usado en bloques del cronograma y barras. */
export const TONE_SOLID: Record<Tone, string> = {
  blue: "var(--solid-blue)",
  green: "var(--solid-green)",
  coral: "var(--solid-coral)",
  slate: "var(--solid-slate)",
  amber: "var(--solid-amber)",
  navy: "var(--solid-navy)",
};

export const ESTADO_CITA: Record<EstadoCita, { label: string; tone: Tone }> = {
  RESERVA_TEMPORAL: { label: "Reserva temporal", tone: "slate" },
  SOLICITADA: { label: "Solicitada", tone: "slate" },
  CONFIRMADA: { label: "Confirmada", tone: "blue" },
  EN_PORTERIA: { label: "En portería", tone: "amber" },
  EN_MUELLE: { label: "En muelle", tone: "navy" },
  DESCARGANDO: { label: "Descargando", tone: "navy" },
  COMPLETADA: { label: "Completada", tone: "green" },
  CANCELADA: { label: "Cancelada", tone: "coral" },
  RECHAZADA: { label: "Rechazada", tone: "coral" },
  NO_SHOW: { label: "No se presentó", tone: "slate" },
};

export const ESTADO_TURNO: Record<EstadoTurnoPatio, { label: string; tone: Tone }> = {
  EN_COLA_EXTERNA: { label: "Cola externa", tone: "slate" },
  EN_INSPECCION_GARITA: { label: "En inspección", tone: "amber" },
  EN_PATIO_ESPERA: { label: "En espera en patio", tone: "blue" },
  LLAMADO_A_MUELLE: { label: "Llamado a muelle", tone: "amber" },
  EN_MUELLE: { label: "En muelle", tone: "navy" },
  DESCARGANDO: { label: "Descargando", tone: "navy" },
  DESCARGADO_LISTO_SALIDA: { label: "Listo para salida", tone: "green" },
  SALIDA_REGISTRADA: { label: "Salida registrada", tone: "slate" },
  ACCESO_RECHAZADO: { label: "Acceso rechazado", tone: "coral" },
};

export const ESTADO_MUELLE: Record<EstadoMuelle, { label: string; status: StatusTone }> = {
  DISPONIBLE: { label: "Disponible", status: "active" },
  OCUPADO: { label: "En operación", status: "maintenance" },
  MANTENIMIENTO: { label: "Mantenimiento", status: "warning" },
  RESERVADO: { label: "Reservado", status: "maintenance" },
  INACTIVO: { label: "Inactivo", status: "inactive" },
};

export const TIPO_MUELLE: Record<TipoMuelle, { label: string; description: string; tone: Tone }> = {
  RECEPCION: { label: "Recepción", description: "Entrada de mercancías de proveedores", tone: "blue" },
  DESPACHO: { label: "Despacho", description: "Salida de pedidos a red de distribución", tone: "navy" },
  MIXTO: { label: "Mixto", description: "Operación flexible según demanda", tone: "slate" },
  DEVOLUCIONES: { label: "Devoluciones", description: "Logística inversa y producto no conforme", tone: "amber" },
  CROSS_DOCKING: { label: "Cross-docking", description: "Transferencia directa sin almacenamiento", tone: "green" },
};

export const ROL: Record<CodigoRol, { label: string; tone: Tone }> = {
  ADMINISTRADOR: { label: "Administrador global", tone: "navy" },
  SUPERVISOR_CD: { label: "Administrador de sede", tone: "blue" },
  PROVEEDOR: { label: "Proveedor", tone: "green" },
  PORTERIA: { label: "Portería", tone: "amber" },
  OPERADOR_MUELLE: { label: "Operador de muelle", tone: "blue" },
  AUDITOR: { label: "Auditor", tone: "slate" },
  PERSONALIZADO: { label: "Operativo personalizado", tone: "slate" },
};

export function rolInfo(codigo: string | undefined): { label: string; tone: Tone } {
  return (codigo && ROL[codigo as CodigoRol]) || { label: codigo || "Usuario", tone: "slate" };
}
