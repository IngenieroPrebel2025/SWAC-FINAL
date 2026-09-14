import { executeLive } from "@/lib/api/http";
import type {
  ApiResponse,
  CalculoTiempoParametrizado,
  Cita,
  Conductor,
  ReservaTemporal,
  SlotDisponible,
  SlotSearchFilter,
  Vehiculo,
} from "@/types";
import type { IAppointmentRepository } from "../types";

export class LiveAppointmentRepository implements IAppointmentRepository {
  getCitas(filtros?: {
    sedeId?: string;
    fecha?: string;
    estado?: string;
    search?: string;
    proveedorId?: string;
  }): Promise<ApiResponse<Cita[]>> {
    const params = new URLSearchParams();
    Object.entries(filtros ?? {}).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    const qs = params.toString() ? `?${params.toString()}` : "";
    return executeLive(`/citas${qs}`, "GET");
  }

  getCitaById(id: string): Promise<ApiResponse<Cita | null>> {
    return executeLive(`/citas/${id}`, "GET");
  }

  crearCita(data: Partial<Cita>): Promise<ApiResponse<Cita>> {
    return executeLive("/citas", "POST", data);
  }

  actualizarCita(id: string, data: Partial<Cita>): Promise<ApiResponse<Cita>> {
    return executeLive(`/citas/${id}`, "PUT", data);
  }

  cancelarCita(id: string, motivo: string, usuarioId?: string): Promise<ApiResponse<Cita>> {
    return executeLive(`/citas/${id}/cancelar`, "PATCH", { motivo, usuarioId });
  }

  eliminarCita(id: string): Promise<ApiResponse<boolean>> {
    return executeLive(`/citas/${id}`, "DELETE");
  }

  crearReservaTemporal(data: {
    sedeId: string;
    muelleId: string;
    proveedorId: string;
    fecha: string;
    horaInicio: string;
    duracionMinutos: number;
  }): Promise<ApiResponse<ReservaTemporal>> {
    return executeLive("/citas/reservas-temporales", "POST", data);
  }

  liberarReservaTemporal(reservaId: string): Promise<ApiResponse<boolean>> {
    return executeLive(`/citas/reservas-temporales/${reservaId}/liberar`, "POST");
  }

  confirmarReservaEnCita(reservaId: string, citaData: Partial<Cita>): Promise<ApiResponse<Cita>> {
    return executeLive(`/citas/reservas-temporales/${reservaId}/confirmar`, "POST", citaData);
  }

  getSlotsDisponibles(filtro: SlotSearchFilter): Promise<ApiResponse<SlotDisponible[]>> {
    return executeLive("/citas/slots-disponibles", "POST", filtro);
  }

  calcularDuracionSugerida(params: {
    tipoMaterialId: string;
    cantidadEstibas: number;
    cantidadCajas?: number;
  }): Promise<ApiResponse<CalculoTiempoParametrizado>> {
    return executeLive("/citas/calcular-duracion", "POST", params);
  }

  cambiarEstadoCita(
    citaId: string,
    nuevoEstado: string,
    metadata?: Record<string, unknown>
  ): Promise<ApiResponse<Cita>> {
    return executeLive(`/citas/${citaId}/estado`, "PATCH", { nuevoEstado, ...metadata });
  }

  getReservasTemporalesActivas(sedeId?: string): Promise<ApiResponse<ReservaTemporal[]>> {
    const qs = sedeId ? `?sedeId=${sedeId}` : "";
    return executeLive(`/citas/reservas-temporales/activas${qs}`, "GET");
  }

  getVehiculos(): Promise<ApiResponse<Vehiculo[]>> {
    return executeLive("/vehiculos", "GET");
  }

  getConductores(): Promise<ApiResponse<Conductor[]>> {
    return executeLive("/conductores", "GET");
  }

  crearVehiculo(vehiculo: Partial<Vehiculo>): Promise<ApiResponse<Vehiculo>> {
    return executeLive("/vehiculos", "POST", vehiculo);
  }

  crearConductor(conductor: Partial<Conductor>): Promise<ApiResponse<Conductor>> {
    return executeLive("/conductores", "POST", conductor);
  }
}
