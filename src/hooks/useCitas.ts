"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { repositories } from "@/lib/repositories";
import { unwrap } from "@/lib/api/http";
import { queryKeys, type CitasFilter } from "@/lib/api/queryKeys";
import { AppointmentRules } from "@/lib/domain/appointmentRules";
import type { Cita, EstadoCita, SlotSearchFilter, TipoVehiculo } from "@/types";

export function useCitas(filter: CitasFilter, enabled = true) {
  return useQuery({
    queryKey: queryKeys.citas(filter),
    queryFn: async () => unwrap(await repositories.appointmentRepo.getCitas(filter)),
    enabled,
  });
}

function useInvalidateOperacion() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["citas"] });
    queryClient.invalidateQueries({ queryKey: ["turnos"] });
    queryClient.invalidateQueries({ queryKey: ["driver-session"] });
  };
}

export function useCambiarEstadoCita() {
  const invalidate = useInvalidateOperacion();
  return useMutation({
    mutationFn: async (vars: { citaId: string; estado: EstadoCita; metadata?: Record<string, unknown> }) =>
      unwrap(await repositories.appointmentRepo.cambiarEstadoCita(vars.citaId, vars.estado, vars.metadata)),
    onSuccess: invalidate,
  });
}

export function useEliminarCita() {
  const invalidate = useInvalidateOperacion();
  return useMutation({
    mutationFn: async (citaId: string) => unwrap(await repositories.appointmentRepo.eliminarCita(citaId)),
    onSuccess: invalidate,
  });
}

export function useBuscarSlots() {
  return useMutation({
    mutationFn: async (filtro: SlotSearchFilter) =>
      unwrap(await repositories.appointmentRepo.getSlotsDisponibles(filtro)),
  });
}

export function useReservaTemporal() {
  return useMutation({
    mutationFn: async (data: {
      sedeId: string;
      muelleId: string;
      proveedorId: string;
      fecha: string;
      horaInicio: string;
      duracionMinutos: number;
    }) => unwrap(await repositories.appointmentRepo.crearReservaTemporal(data)),
  });
}

export interface TransporteInput {
  placa: string;
  tipoVehiculo: TipoVehiculo;
  placaRemolque?: string;
  empresaTransportadora: string;
  esRefrigerado: boolean;
  conductorNombre: string;
  conductorCedula: string;
  conductorTelefono: string;
  conductorArl: string;
  conductorEps: string;
}

/**
 * Programa una cita: valida la ventana operativa, resuelve (o registra)
 * vehículo y conductor y confirma la reserva temporal si existe.
 */
export function useProgramarCita() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { cita: Partial<Cita>; reservaId?: string; transporte: TransporteInput }) => {
      const { tiempos } = vars.cita;
      if (tiempos && !AppointmentRules.isWithinOperatingHours(tiempos.horaProgramadaInicio, tiempos.horaProgramadaFin)) {
        throw new Error("El horario solicitado está fuera de la ventana operativa del centro de distribución (06:00 – 22:00).");
      }

      const repo = repositories.appointmentRepo;
      const t = vars.transporte;
      const placa = t.placa.trim().toUpperCase();

      const vehiculos = unwrap(await repo.getVehiculos());
      const vehiculo =
        vehiculos.find((v) => v.placa.toUpperCase() === placa) ??
        unwrap(
          await repo.crearVehiculo({
            placa,
            tipoVehiculo: t.tipoVehiculo,
            tieneRemolque: Boolean(t.placaRemolque),
            placaRemolque: t.placaRemolque || undefined,
            empresaTransportadora: t.empresaTransportadora,
            esRefrigerado: t.esRefrigerado,
          })
        );

      const conductores = unwrap(await repo.getConductores());
      const [nombres, ...apellidos] = t.conductorNombre.trim().split(/\s+/);
      const conductor =
        conductores.find((c) => c.numeroDocumento === t.conductorCedula.trim()) ??
        unwrap(
          await repo.crearConductor({
            numeroDocumento: t.conductorCedula.trim(),
            nombres,
            apellidos: apellidos.join(" "),
            telefono: t.conductorTelefono,
            arl: t.conductorArl,
            eps: t.conductorEps,
          })
        );

      const payload: Partial<Cita> = { ...vars.cita, vehiculoId: vehiculo.id, conductorId: conductor.id };
      return vars.reservaId
        ? unwrap(await repo.confirmarReservaEnCita(vars.reservaId, payload))
        : unwrap(await repo.crearCita(payload));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["citas"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.vehiculos });
      queryClient.invalidateQueries({ queryKey: queryKeys.conductores });
    },
  });
}
