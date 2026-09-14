import type { EstadoCita, Muelle } from "@/types";
import { formatIsoHour } from "@/lib/format";

/** Reglas de negocio puras del agendamiento (independientes de UI y transporte). */
export const AppointmentRules = {
  /** Ventana operativa del centro de distribución: 06:00 – 22:00. */
  isWithinOperatingHours(horaInicio: string, horaFin: string): boolean {
    const start = parseInt(formatIsoHour(horaInicio).split(":")[0], 10);
    const end = parseInt(formatIsoHour(horaFin).split(":")[0], 10);
    return start >= 6 && end <= 22 && start <= end;
  },

  /** Duración sugerida redondeada a bloques de 15 minutos. */
  calculateUnloadDurationMinutes(estibas: number, cajas = 0, frio = false): number {
    const base = 20;
    const perPallet = frio ? 4.5 : 3.5;
    const perBoxes = cajas > 0 ? (cajas / 100) * 2 : 0;
    return Math.ceil((base + estibas * perPallet + perBoxes) / 15) * 15;
  },

  /** Máquina de estados de la cita. */
  isValidStatusTransition(actual: EstadoCita, nuevo: EstadoCita): boolean {
    const allowed: Record<EstadoCita, EstadoCita[]> = {
      RESERVA_TEMPORAL: ["SOLICITADA", "CANCELADA"],
      SOLICITADA: ["CONFIRMADA", "RECHAZADA", "CANCELADA"],
      CONFIRMADA: ["EN_PORTERIA", "CANCELADA", "NO_SHOW"],
      EN_PORTERIA: ["EN_MUELLE", "CANCELADA", "RECHAZADA"],
      EN_MUELLE: ["DESCARGANDO", "CANCELADA"],
      DESCARGANDO: ["COMPLETADA", "CANCELADA"],
      COMPLETADA: [],
      CANCELADA: [],
      RECHAZADA: [],
      NO_SHOW: [],
    };
    return allowed[actual]?.includes(nuevo) ?? false;
  },

  /** Compatibilidad de cadena de frío entre muelle y tipo de material. */
  isDockCompatibleWithMaterial(muelle: Muelle, requiereFrio: boolean): boolean {
    if (!muelle.activo) return false;
    if (!requiereFrio) return true;
    return (
      muelle.materialesPermitidos.includes("REFRIGERADOS") ||
      muelle.materialesPermitidos.includes("CONGELADOS")
    );
  },
};
