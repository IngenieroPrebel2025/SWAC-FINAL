import { executeMock } from "@/lib/api/http";
import { formatIsoHour, todayIso } from "@/lib/format";
import { store } from "@/store";
import { MOCK_CITAS, MOCK_RESERVAS_TEMPORALES } from "@/mocks/appointments.mock";
import { MOCK_CONDUCTORES, MOCK_VEHICULOS } from "@/mocks/vehicles.mock";
import { MOCK_MUELLES } from "@/mocks/sites.mock";
import { MOCK_TIPOS_MATERIAL } from "@/mocks/suppliers.mock";
import type {
  ApiResponse,
  CalculoTiempoParametrizado,
  Cita,
  Conductor,
  EstadoCita,
  ReservaTemporal,
  SlotDisponible,
  SlotSearchFilter,
  Vehiculo,
} from "@/types";
import type { IAppointmentRepository } from "../types";

const FRANJAS = ["06:00", "07:30", "09:00", "10:30", "12:00", "13:30", "15:00", "16:30", "18:00", "19:30"];

function addMinutes(hora: string, minutes: number): string {
  const [h, m] = hora.split(":").map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export class MockAppointmentRepository implements IAppointmentRepository {
  /** Arreglos compartidos con el adaptador mock de portería (misma "base de datos"). */
  private citas: Cita[] = MOCK_CITAS;
  private vehiculos: Vehiculo[] = MOCK_VEHICULOS;
  private conductores: Conductor[] = MOCK_CONDUCTORES;
  private reservas: ReservaTemporal[] = [...MOCK_RESERVAS_TEMPORALES];

  getCitas(filtros?: {
    sedeId?: string;
    fecha?: string;
    estado?: string;
    search?: string;
    proveedorId?: string;
  }): Promise<ApiResponse<Cita[]>> {
    return executeMock("/citas", "GET", () => {
      let result = [...this.citas];

      // Aislamiento automático de datos según el usuario autenticado
      const currentUser = store.getState().auth.session?.usuario;
      if (currentUser?.rolCodigo === "PROVEEDOR" && currentUser.proveedorId) {
        result = result.filter((c) => c.proveedorId === currentUser.proveedorId);
      } else if (filtros?.proveedorId && filtros.proveedorId !== "TODOS") {
        result = result.filter((c) => c.proveedorId === filtros.proveedorId);
      }

      if (filtros?.sedeId && filtros.sedeId !== "TODAS") {
        result = result.filter((c) => c.sedeId === filtros.sedeId);
      }
      if (filtros?.fecha && filtros.fecha !== "TODAS") {
        result = result.filter((c) => c.fechaCita === filtros.fecha);
      }
      if (filtros?.estado && filtros.estado !== "TODOS") {
        result = result.filter((c) => c.estado === filtros.estado);
      }
      if (filtros?.search) {
        const q = filtros.search.toLowerCase().trim();
        result = result.filter(
          (c) =>
            c.codigoCita.toLowerCase().includes(q) ||
            c.id.toLowerCase().includes(q) ||
            c.items.some(
              (it) => it.sku.toLowerCase().includes(q) || it.ordenCompraNumero?.toLowerCase().includes(q)
            )
        );
      }
      return result;
    });
  }

  getCitaById(id: string): Promise<ApiResponse<Cita | null>> {
    return executeMock(`/citas/${id}`, "GET", () =>
      this.citas.find((c) => c.id === id || c.codigoCita === id) ?? null
    );
  }

  private nextCodigo(): string {
    return `CTA-2026-${String(this.citas.length + 894).padStart(4, "0")}`;
  }

  crearCita(data: Partial<Cita>): Promise<ApiResponse<Cita>> {
    return executeMock(
      "/citas",
      "POST",
      () => {
        const fecha = data.fechaCita ?? todayIso();
        const now = new Date().toISOString();
        const items = data.items ?? [];
        const nueva: Cita = {
          id: data.id ?? `cita-${Date.now()}`,
          codigoCita: data.codigoCita ?? this.nextCodigo(),
          sedeId: data.sedeId ?? "sede-rio-01",
          muelleId: data.muelleId ?? "mue-rio-01",
          proveedorId: data.proveedorId ?? "prov-001",
          tipoOperacion: data.tipoOperacion ?? "RECEPCION_PROVEEDOR",
          estado: data.estado ?? "CONFIRMADA",
          esCitaEspecial: data.esCitaEspecial ?? false,
          motivoCitaEspecial: data.motivoCitaEspecial,
          conductorId: data.conductorId,
          vehiculoId: data.vehiculoId,
          fechaCita: fecha,
          tiempos: data.tiempos ?? {
            horaProgramadaInicio: `${fecha}T08:00:00Z`,
            horaProgramadaFin: `${fecha}T09:30:00Z`,
            duracionEstimadaMinutos: 90,
          },
          items,
          totalEstibas: data.totalEstibas ?? items.reduce((acc, it) => acc + (it.cantidadEstibas || 0), 0),
          totalCajas: data.totalCajas ?? items.reduce((acc, it) => acc + (it.cantidadUnidades || 0), 0),
          pesoTotalKg: data.pesoTotalKg ?? items.reduce((acc, it) => acc + (it.pesoTotalKg || 0), 0),
          observacionesOperativas: data.observacionesOperativas,
          inspeccionPorteriaAprobada: false,
          creadoPorUsuarioId: data.creadoPorUsuarioId ?? store.getState().auth.session?.usuario.id ?? "usr-sistema",
          creadoEn: now,
          actualizadoEn: now,
        };
        this.citas.unshift(nueva);
        return nueva;
      },
      data
    );
  }

  actualizarCita(id: string, data: Partial<Cita>): Promise<ApiResponse<Cita>> {
    return executeMock(
      `/citas/${id}`,
      "PUT",
      () => {
        const cita = this.citas.find((c) => c.id === id);
        if (!cita) throw new Error(`Cita con ID ${id} no encontrada`);
        Object.assign(cita, data, { id, actualizadoEn: new Date().toISOString() });
        return cita;
      },
      data
    );
  }

  cancelarCita(id: string, motivo: string, usuarioId?: string): Promise<ApiResponse<Cita>> {
    return executeMock(
      `/citas/${id}/cancelar`,
      "PATCH",
      () => {
        const cita = this.citas.find((c) => c.id === id);
        if (!cita) throw new Error(`Cita con ID ${id} no encontrada`);
        cita.estado = "CANCELADA";
        cita.motivoRechazoOCancelacion = motivo;
        cita.actualizadoEn = new Date().toISOString();
        return cita;
      },
      { motivo, usuarioId }
    );
  }

  eliminarCita(id: string): Promise<ApiResponse<boolean>> {
    return executeMock(`/citas/${id}`, "DELETE", () => {
      const idx = this.citas.findIndex((c) => c.id === id);
      if (idx === -1) return false;
      this.citas.splice(idx, 1);
      return true;
    });
  }

  crearReservaTemporal(data: {
    sedeId: string;
    muelleId: string;
    proveedorId: string;
    fecha: string;
    horaInicio: string;
    duracionMinutos: number;
  }): Promise<ApiResponse<ReservaTemporal>> {
    return executeMock(
      "/citas/reservas-temporales",
      "POST",
      () => {
        const reserva: ReservaTemporal = {
          id: `res-temp-${Date.now()}`,
          tokenReserva: `RSV-TMP-${Math.floor(100000 + Math.random() * 900000)}`,
          sedeId: data.sedeId,
          muelleId: data.muelleId,
          proveedorId: data.proveedorId,
          fecha: data.fecha,
          horaInicio: data.horaInicio,
          horaFin: addMinutes(data.horaInicio, data.duracionMinutos),
          duracionCalculadaMinutos: data.duracionMinutos,
          expiraEn: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
          creadoEn: new Date().toISOString(),
          estado: "ACTIVA",
        };
        this.reservas.unshift(reserva);
        return reserva;
      },
      data
    );
  }

  liberarReservaTemporal(reservaId: string): Promise<ApiResponse<boolean>> {
    return executeMock(`/citas/reservas-temporales/${reservaId}/liberar`, "POST", () => {
      const r = this.reservas.find((item) => item.id === reservaId || item.tokenReserva === reservaId);
      if (!r) return false;
      r.estado = "LIBERADA";
      return true;
    });
  }

  confirmarReservaEnCita(reservaId: string, citaData: Partial<Cita>): Promise<ApiResponse<Cita>> {
    return executeMock(
      `/citas/reservas-temporales/${reservaId}/confirmar`,
      "POST",
      () => {
        const r = this.reservas.find((item) => item.id === reservaId || item.tokenReserva === reservaId);
        if (r) r.estado = "CONVERTIDA_EN_CITA";
        const fecha = r?.fecha ?? citaData.fechaCita ?? todayIso();
        const now = new Date().toISOString();

        const nueva: Cita = {
          id: `cita-${Date.now()}`,
          codigoCita: this.nextCodigo(),
          sedeId: r?.sedeId ?? citaData.sedeId ?? "sede-rio-01",
          muelleId: r?.muelleId ?? citaData.muelleId ?? "mue-rio-01",
          proveedorId: r?.proveedorId ?? citaData.proveedorId ?? "prov-001",
          tipoOperacion: citaData.tipoOperacion ?? "RECEPCION_PROVEEDOR",
          estado: "CONFIRMADA",
          esCitaEspecial: citaData.esCitaEspecial ?? false,
          motivoCitaEspecial: citaData.motivoCitaEspecial,
          conductorId: citaData.conductorId,
          vehiculoId: citaData.vehiculoId,
          fechaCita: fecha,
          tiempos: {
            horaProgramadaInicio: `${fecha}T${r?.horaInicio ?? "08:00"}:00Z`,
            horaProgramadaFin: `${fecha}T${r?.horaFin ?? "09:30"}:00Z`,
            duracionEstimadaMinutos: r?.duracionCalculadaMinutos ?? 90,
          },
          items: citaData.items ?? [],
          totalEstibas: citaData.totalEstibas ?? 0,
          totalCajas: citaData.totalCajas ?? 0,
          pesoTotalKg: citaData.pesoTotalKg ?? 0,
          observacionesOperativas: citaData.observacionesOperativas,
          inspeccionPorteriaAprobada: false,
          creadoPorUsuarioId: store.getState().auth.session?.usuario.id ?? "usr-portal-prov",
          creadoEn: now,
          actualizadoEn: now,
        };
        this.citas.unshift(nueva);
        return nueva;
      },
      { reservaId, ...citaData }
    );
  }

  calcularDuracionSugerida(params: {
    tipoMaterialId: string;
    cantidadEstibas: number;
    cantidadCajas?: number;
  }): Promise<ApiResponse<CalculoTiempoParametrizado>> {
    return executeMock(
      "/citas/calcular-duracion",
      "POST",
      () => {
        const tipo = MOCK_TIPOS_MATERIAL.find((t) => t.id === params.tipoMaterialId || t.codigo === params.tipoMaterialId);
        const porEstiba = tipo?.minutosDescarguePorEstiba ?? 5;
        const base = 15;
        const tiempoEstibas = Math.ceil(params.cantidadEstibas * porEstiba);
        const tiempoCajas = params.cantidadCajas
          ? Math.ceil(params.cantidadCajas * (tipo?.minutosDescarguePorCaja ?? 0.1))
          : 0;
        const total = Math.max(30, base + tiempoEstibas + tiempoCajas);
        return {
          tipoMaterialId: params.tipoMaterialId,
          cantidadEstibas: params.cantidadEstibas,
          cantidadCajas: params.cantidadCajas,
          tiempoBaseMinutos: base,
          tiempoCalculadoMinutos: total,
          formulaAplicada: `Base(${base}m) + (${params.cantidadEstibas} estibas × ${porEstiba}m/estiba) = ${total} min`,
        };
      },
      params
    );
  }

  getSlotsDisponibles(filtro: SlotSearchFilter): Promise<ApiResponse<SlotDisponible[]>> {
    return executeMock(
      "/citas/slots-disponibles",
      "POST",
      () => {
        let muellesSede = MOCK_MUELLES.filter(
          (m) =>
            m.sedeId === filtro.sedeId &&
            m.activo &&
            m.estadoActual !== "MANTENIMIENTO" &&
            m.estadoActual !== "INACTIVO"
        );
        if (muellesSede.length === 0) {
          muellesSede = MOCK_MUELLES.filter((m) => m.activo && m.estadoActual !== "INACTIVO");
        }

        let duracion = filtro.duracionSolicitadaMinutos ?? 60;
        if (!filtro.duracionSolicitadaMinutos && filtro.tipoMaterialId && filtro.cantidadEstibas) {
          const tipo = MOCK_TIPOS_MATERIAL.find((t) => t.id === filtro.tipoMaterialId);
          duracion = Math.max(30, Math.ceil(15 + filtro.cantidadEstibas * (tipo?.minutosDescarguePorEstiba ?? 5)));
        }

        const slots: SlotDisponible[] = [];
        muellesSede.forEach((muelle) => {
          const esRefrigerado =
            muelle.materialesPermitidos.includes("REFRIGERADOS") || muelle.materialesPermitidos.includes("CONGELADOS");

          let score: number;
          let motivo: string;
          if (filtro.requiereRefrigeracion) {
            score = esRefrigerado ? 98 : 15;
            motivo = esRefrigerado
              ? "Muelle equipado con esclusa y sello térmico para cadena de frío"
              : "No recomendado: muelle sin esclusa refrigerada";
          } else {
            score = esRefrigerado ? 70 : 92;
            motivo = esRefrigerado
              ? "Muelle refrigerado utilizado para carga seca (capacidad de reserva)"
              : "Muelle de carga seca de alta rotación con rampa hidráulica";
          }

          const citasMuelle = this.citas.filter(
            (c) =>
              c.sedeId === filtro.sedeId &&
              c.muelleId === muelle.id &&
              c.fechaCita === filtro.fecha &&
              c.estado !== "CANCELADA" &&
              c.estado !== "RECHAZADA"
          );

          FRANJAS.forEach((horaInicio) => {
            const conflicto = citasMuelle.find((c) => formatIsoHour(c.tiempos.horaProgramadaInicio) === horaInicio);
            slots.push({
              horaInicio,
              horaFin: addMinutes(horaInicio, duracion),
              duracionMinutos: duracion,
              muelleId: muelle.id,
              muelleNombre: muelle.nombre,
              muelleCodigo: muelle.codigoMuelle,
              esRefrigerado,
              scoreIdoneidad: score,
              motivoRecomendacion: motivo,
              disponible: !conflicto,
              conflictoCitaCodigo: conflicto?.codigoCita,
            });
          });
        });

        return slots.sort((a, b) =>
          a.disponible === b.disponible ? b.scoreIdoneidad - a.scoreIdoneidad : a.disponible ? -1 : 1
        );
      },
      filtro
    );
  }

  cambiarEstadoCita(
    citaId: string,
    nuevoEstado: string,
    metadata?: Record<string, unknown>
  ): Promise<ApiResponse<Cita>> {
    return executeMock(
      `/citas/${citaId}/estado`,
      "PATCH",
      () => {
        const cita = this.citas.find((c) => c.id === citaId || c.codigoCita === citaId);
        if (!cita) throw new Error(`Cita ${citaId} no encontrada`);

        const nowIso = new Date().toISOString();
        cita.estado = nuevoEstado as EstadoCita;
        cita.actualizadoEn = nowIso;
        if (nuevoEstado === "EN_PORTERIA") cita.tiempos.horaLlegadaPorteria = nowIso;
        if (nuevoEstado === "EN_MUELLE") cita.tiempos.horaLlamadoMuelle = nowIso;
        if (nuevoEstado === "DESCARGANDO") cita.tiempos.horaInicioDescargue = nowIso;
        if (nuevoEstado === "COMPLETADA") {
          cita.tiempos.horaFinDescargue = nowIso;
          cita.tiempos.horaSalidaPlanta = nowIso;
        }
        if (typeof metadata?.observacionesOperativas === "string") {
          cita.observacionesOperativas = metadata.observacionesOperativas;
        }
        if (typeof metadata?.muelleId === "string") cita.muelleId = metadata.muelleId;
        if (typeof metadata?.motivoRechazoOCancelacion === "string") {
          cita.motivoRechazoOCancelacion = metadata.motivoRechazoOCancelacion;
        }
        return cita;
      },
      { nuevoEstado, ...metadata }
    );
  }

  getReservasTemporalesActivas(sedeId?: string): Promise<ApiResponse<ReservaTemporal[]>> {
    return executeMock("/citas/reservas-temporales/activas", "GET", () => {
      const now = Date.now();
      return this.reservas.filter(
        (r) => r.estado === "ACTIVA" && new Date(r.expiraEn).getTime() > now && (!sedeId || r.sedeId === sedeId)
      );
    });
  }

  getVehiculos(): Promise<ApiResponse<Vehiculo[]>> {
    return executeMock("/vehiculos", "GET", () => [...this.vehiculos]);
  }

  getConductores(): Promise<ApiResponse<Conductor[]>> {
    return executeMock("/conductores", "GET", () => [...this.conductores]);
  }

  crearVehiculo(vehiculo: Partial<Vehiculo>): Promise<ApiResponse<Vehiculo>> {
    return executeMock(
      "/vehiculos",
      "POST",
      () => {
        const nuevo: Vehiculo = {
          tipoVehiculo: "TRACTOMULA",
          marca: "Kenworth",
          modeloAnio: 2024,
          color: "Blanco",
          capacidadCargaKg: 30000,
          volumenMaximoM3: 80,
          empresaTransportadora: "Transportes Colombia",
          ...vehiculo,
          id: `veh-${Date.now()}`,
          placa: (vehiculo.placa ?? "NEW-000").toUpperCase(),
          tieneRemolque: Boolean(vehiculo.tieneRemolque),
          esRefrigerado: Boolean(vehiculo.esRefrigerado),
          estado: "HABILITADO",
        };
        this.vehiculos.unshift(nuevo);
        return nuevo;
      },
      vehiculo
    );
  }

  crearConductor(conductor: Partial<Conductor>): Promise<ApiResponse<Conductor>> {
    return executeMock(
      "/conductores",
      "POST",
      () => {
        const nuevo: Conductor = {
          tipoDocumento: "CC",
          numeroDocumento: "1000000",
          nombres: "Conductor",
          apellidos: "Nuevo",
          telefono: "+57 300 000 0000",
          eps: "Sura EPS",
          arl: "Positiva ARL",
          licenciaConduccionNumero: "1000000-C3",
          licenciaConduccionCategoria: "C3",
          licenciaVigencia: "2028-12-31",
          ...conductor,
          id: `cond-${Date.now()}`,
          estado: "ACTIVO",
        };
        this.conductores.unshift(nuevo);
        return nuevo;
      },
      conductor
    );
  }
}
