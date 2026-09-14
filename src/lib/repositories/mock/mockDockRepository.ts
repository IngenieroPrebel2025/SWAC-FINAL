import { executeMock } from "@/lib/api/http";
import { todayIso } from "@/lib/format";
import { MOCK_MUELLES, MOCK_MUELLES_LOGS } from "@/mocks/sites.mock";
import type { ApiResponse, EstadoMuelle, Muelle, MuelleDisponibilidadLog } from "@/types";
import type { IDockRepository } from "../types";

export class MockDockRepository implements IDockRepository {
  /** Referencia compartida con los demás adaptadores mock (portería, citas). */
  private muelles: Muelle[] = MOCK_MUELLES;
  private logs: MuelleDisponibilidadLog[] = [...MOCK_MUELLES_LOGS];

  getMuellesBySede(sedeId: string): Promise<ApiResponse<Muelle[]>> {
    return executeMock(`/sedes/${sedeId}/muelles`, "GET", () =>
      sedeId ? this.muelles.filter((m) => m.sedeId === sedeId) : [...this.muelles]
    );
  }

  getMuelleById(id: string): Promise<ApiResponse<Muelle | null>> {
    return executeMock(`/muelles/${id}`, "GET", () => this.muelles.find((m) => m.id === id) ?? null);
  }

  createMuelle(data: Partial<Muelle>): Promise<ApiResponse<Muelle>> {
    return executeMock(
      "/muelles",
      "POST",
      () => {
        const now = new Date().toISOString();
        const nuevo: Muelle = {
          sedeId: "sede-rio-01",
          codigoMuelle: "M-NEW",
          nombre: "Nuevo Muelle",
          tipo: "RECEPCION",
          materialesPermitidos: ["SECOS"],
          alturaMaximaMetros: 4.5,
          pesoMaximoToneladas: 35,
          tieneRampaNiveladora: true,
          tiempoMaximoOperacionMinutos: 60,
          tiempoBufferEntreCitasMinutos: 15,
          estadoActual: "DISPONIBLE",
          activo: true,
          observaciones: "",
          ...data,
          id: `mue-${Date.now()}`,
          creadoEn: now,
          actualizadoEn: now,
        };
        this.muelles.push(nuevo);
        return nuevo;
      },
      data
    );
  }

  updateMuelle(id: string, data: Partial<Muelle>): Promise<ApiResponse<Muelle>> {
    return executeMock(
      `/muelles/${id}`,
      "PUT",
      () => {
        const idx = this.muelles.findIndex((m) => m.id === id);
        if (idx === -1) throw new Error(`Muelle ${id} no encontrado`);
        Object.assign(this.muelles[idx], data, { id, actualizadoEn: new Date().toISOString() });
        return this.muelles[idx];
      },
      data
    );
  }

  deleteMuelle(id: string): Promise<ApiResponse<boolean>> {
    return executeMock(`/muelles/${id}`, "DELETE", () => {
      const idx = this.muelles.findIndex((m) => m.id === id);
      if (idx === -1) return false;
      this.muelles.splice(idx, 1);
      return true;
    });
  }

  cambiarEstadoMuelle(
    muelleId: string,
    nuevoEstado: EstadoMuelle,
    motivo: string,
    usuarioId: string
  ): Promise<ApiResponse<Muelle>> {
    return executeMock(
      `/muelles/${muelleId}/estado`,
      "PATCH",
      () => {
        const muelle = this.muelles.find((m) => m.id === muelleId);
        if (!muelle) throw new Error(`Muelle ${muelleId} no encontrado`);
        const estadoAnterior = muelle.estadoActual;
        muelle.estadoActual = nuevoEstado;
        muelle.activo = nuevoEstado !== "INACTIVO" && nuevoEstado !== "MANTENIMIENTO";
        muelle.actualizadoEn = new Date().toISOString();

        this.logs.unshift({
          id: `log-mue-${Date.now()}`,
          muelleId,
          sedeId: muelle.sedeId,
          fecha: todayIso(),
          horaInicio: "06:00",
          horaFin: "22:00",
          estadoHabilitado: muelle.activo,
          motivoCambio: `Cambio de ${estadoAnterior} a ${nuevoEstado}: ${motivo}`,
          usuarioId: usuarioId || "usr-admin-global",
          registradoEn: new Date().toISOString(),
        });
        return muelle;
      },
      { nuevoEstado, motivo, usuarioId }
    );
  }

  getLogsDisponibilidad(sedeId: string): Promise<ApiResponse<MuelleDisponibilidadLog[]>> {
    return executeMock(`/sedes/${sedeId}/muelles/logs`, "GET", () =>
      sedeId ? this.logs.filter((l) => l.sedeId === sedeId) : [...this.logs]
    );
  }

  registrarLogDisponibilidad(data: Partial<MuelleDisponibilidadLog>): Promise<ApiResponse<MuelleDisponibilidadLog>> {
    return executeMock(
      `/muelles/${data.muelleId}/disponibilidad-log`,
      "POST",
      () => {
        const nuevo: MuelleDisponibilidadLog = {
          muelleId: "mue-rio-01",
          sedeId: "sede-rio-01",
          fecha: todayIso(),
          horaInicio: "06:00",
          horaFin: "22:00",
          estadoHabilitado: true,
          motivoCambio: "Ajuste de turno de muelle",
          usuarioId: "usr-admin-global",
          ...data,
          id: `log-mue-${Date.now()}`,
          registradoEn: new Date().toISOString(),
        };
        this.logs.unshift(nuevo);
        return nuevo;
      },
      data
    );
  }

  eliminarLogDisponibilidad(logId: string): Promise<ApiResponse<boolean>> {
    return executeMock(`/muelles/logs/${logId}`, "DELETE", () => {
      const len = this.logs.length;
      this.logs = this.logs.filter((l) => l.id !== logId);
      return this.logs.length < len;
    });
  }
}
