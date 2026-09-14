import { executeMock } from "@/lib/api/http";
import {
  CHECKLIST_PORTERIA_DEFAULT,
  MOCK_HISTORIAL_SALIDAS,
  MOCK_INSPECCIONES,
  MOCK_TURNOS_PATIO,
} from "@/mocks/gate.mock";
import { MOCK_CITAS } from "@/mocks/appointments.mock";
import { MOCK_CONDUCTORES, MOCK_VEHICULOS } from "@/mocks/vehicles.mock";
import { MOCK_MUELLES, MOCK_SEDES } from "@/mocks/sites.mock";
import type {
  ApiResponse,
  Cita,
  DriverPortalSession,
  EstadoTurnoPatio,
  InspeccionPorteria,
  RegistroSalidaPorteria,
  TurnoPatio,
} from "@/types";
import type { IGateRepository } from "../types";

export class MockGateRepository implements IGateRepository {
  private turnos: TurnoPatio[] = [...MOCK_TURNOS_PATIO];
  private inspecciones: InspeccionPorteria[] = [...MOCK_INSPECCIONES];
  private salidas: RegistroSalidaPorteria[] = [...MOCK_HISTORIAL_SALIDAS];

  private findCita(idOrCodigo?: string): Cita | undefined {
    if (!idOrCodigo) return undefined;
    return MOCK_CITAS.find((c) => c.id === idOrCodigo || c.codigoCita === idOrCodigo);
  }

  private findTurno(turnoId: string): TurnoPatio {
    const turno = this.turnos.find((t) => t.id === turnoId);
    if (!turno) throw new Error("Turno no encontrado");
    return turno;
  }

  private buildTurno(cita: Cita, estado: EstadoTurnoPatio, extra: Partial<TurnoPatio> = {}): TurnoPatio {
    const nowIso = new Date().toISOString();
    const muelle = MOCK_MUELLES.find((m) => m.id === cita.muelleId);
    const cond = MOCK_CONDUCTORES.find((c) => c.id === cita.conductorId);
    const veh = MOCK_VEHICULOS.find((v) => v.id === cita.vehiculoId);
    return {
      id: `turno-${Date.now()}`,
      citaId: cita.id,
      codigoCita: cita.codigoCita,
      codigoTurno: `TURNO-P-${String(this.turnos.length + 1).padStart(2, "0")}`,
      sedeId: cita.sedeId,
      muelleAsignadoId: cita.muelleId,
      muelleAsignadoNombre: muelle ? `${muelle.codigoMuelle} (${muelle.nombre})` : "Bahía asignada",
      vehiculoPlaca: veh?.placa ?? "PLACA-PEND",
      conductorNombre: cond ? `${cond.nombres} ${cond.apellidos}` : "Conductor asignado",
      conductorTelefono: cond?.telefono ?? "+57 300 000 0000",
      estado,
      horaLlegadaPorteria: nowIso,
      minutosEnEsperaPatio: 0,
      notificacionSmsEnviada: true,
      llamadasRealizadasCount: 0,
      prioridad: "NORMAL",
      ...extra,
    };
  }

  getTurnosPatio(filtros?: {
    sedeId?: string;
    estado?: EstadoTurnoPatio;
    search?: string;
  }): Promise<ApiResponse<TurnoPatio[]>> {
    return executeMock("/porteria/turnos", "GET", () => {
      const q = filtros?.search?.toLowerCase();
      return this.turnos.filter(
        (t) =>
          (!filtros?.sedeId || t.sedeId === filtros.sedeId) &&
          (!filtros?.estado || t.estado === filtros.estado) &&
          (!q ||
            t.codigoTurno.toLowerCase().includes(q) ||
            t.codigoCita.toLowerCase().includes(q) ||
            t.vehiculoPlaca.toLowerCase().includes(q) ||
            t.conductorNombre.toLowerCase().includes(q))
      );
    });
  }

  getTurnoPatioByCitaId(citaId: string): Promise<ApiResponse<TurnoPatio | null>> {
    return executeMock(`/porteria/turnos/cita/${citaId}`, "GET", () =>
      this.turnos.find((t) => t.citaId === citaId || t.codigoCita === citaId) ?? null
    );
  }

  registrarLlegadaPorteria(data: {
    citaId: string;
    guardaId: string;
    guardaNombre: string;
    odometroKm?: number;
  }): Promise<ApiResponse<{ cita: Cita; turno: TurnoPatio }>> {
    return executeMock(
      "/porteria/checkin",
      "POST",
      () => {
        const cita = this.findCita(data.citaId);
        if (!cita) throw new Error(`Cita no encontrada: ${data.citaId}`);
        cita.estado = "EN_PORTERIA";
        cita.tiempos.horaLlegadaPorteria ??= new Date().toISOString();

        let turno = this.turnos.find((t) => t.citaId === cita.id);
        if (!turno) {
          turno = this.buildTurno(cita, "EN_INSPECCION_GARITA", {
            observaciones: `Ingresó a portería registrado por ${data.guardaNombre}`,
          });
          this.turnos.unshift(turno);
        } else {
          turno.estado = "EN_INSPECCION_GARITA";
        }
        return { cita, turno };
      },
      data
    );
  }

  guardarInspeccionPorteria(inspeccion: Partial<InspeccionPorteria>): Promise<ApiResponse<InspeccionPorteria>> {
    return executeMock(
      "/porteria/inspecciones",
      "POST",
      () => {
        const nowIso = new Date().toISOString();
        const nueva: InspeccionPorteria = {
          citaId: "cita-new",
          codigoCita: "CTA-XXXX",
          sedeId: "sede-rio-01",
          guardaSeguridadId: "usr-porteria-medellin",
          guardaSeguridadNombre: "Oficial de Seguridad",
          conductorId: "cond-001",
          conductorNombre: "Conductor",
          conductorCedula: "000000",
          arlVigente: true,
          epsVigente: true,
          eppCompleto: true,
          vehiculoId: "veh-001",
          vehiculoPlaca: "PLACA",
          soatVigente: true,
          tecnomecanicaVigente: true,
          inspeccionFurgonLimpio: true,
          libreOloresYPlagas: true,
          precintosRegistrados: [],
          precintosCoincidenConRemision: true,
          temperaturaCumpleRango: true,
          itemsChecklist: CHECKLIST_PORTERIA_DEFAULT,
          resultado: "APROBADO",
          observacionesGenerales: "",
          fotosEvidencias: [],
          ...inspeccion,
          id: inspeccion.id ?? `insp-${Date.now()}`,
          fechaHoraInspeccion: nowIso,
        };

        const existingIdx = this.inspecciones.findIndex((i) => i.citaId === nueva.citaId);
        if (existingIdx >= 0) this.inspecciones[existingIdx] = nueva;
        else this.inspecciones.unshift(nueva);

        const aprobada = nueva.resultado === "APROBADO" || nueva.resultado === "APROBADO_CON_OBSERVACIONES";
        const cita = this.findCita(nueva.citaId);
        if (cita) {
          cita.inspeccionPorteriaAprobada = aprobada;
          if (nueva.resultado === "RECHAZADO") {
            cita.estado = "RECHAZADA";
            cita.motivoRechazoOCancelacion = nueva.motivoRechazo ?? "Rechazado en inspección física de garita";
          } else if (cita.estado === "CONFIRMADA" || cita.estado === "SOLICITADA") {
            cita.estado = "EN_PORTERIA";
            cita.tiempos.horaLlegadaPorteria ??= nowIso;
          }
        }

        let turno = this.turnos.find((t) => t.citaId === nueva.citaId);
        if (!turno && cita && aprobada) {
          turno = this.buildTurno(cita, "EN_PATIO_ESPERA", { horaIngresoPatio: nowIso });
          this.turnos.unshift(turno);
        } else if (turno) {
          if (nueva.resultado === "RECHAZADO") {
            turno.estado = "ACCESO_RECHAZADO";
            turno.observaciones = `Acceso denegado: ${nueva.motivoRechazo}`;
          } else {
            turno.estado = "EN_PATIO_ESPERA";
            turno.horaIngresoPatio = nowIso;
          }
        }
        return nueva;
      },
      inspeccion
    );
  }

  getInspeccionByCitaId(citaId: string): Promise<ApiResponse<InspeccionPorteria | null>> {
    return executeMock(`/porteria/inspecciones/cita/${citaId}`, "GET", () =>
      this.inspecciones.find((i) => i.citaId === citaId || i.codigoCita === citaId) ?? null
    );
  }

  asignarTurnoPatio(
    citaId: string,
    codigoTurno?: string,
    prioridad: "ALTA" | "NORMAL" | "BAJA" = "NORMAL"
  ): Promise<ApiResponse<TurnoPatio>> {
    return executeMock(
      "/porteria/turnos/asignar",
      "POST",
      () => {
        const nowIso = new Date().toISOString();
        let turno = this.turnos.find((t) => t.citaId === citaId);
        if (!turno) {
          const cita = this.findCita(citaId);
          if (!cita) throw new Error(`Cita no encontrada: ${citaId}`);
          turno = this.buildTurno(cita, "EN_PATIO_ESPERA", {
            horaIngresoPatio: nowIso,
            prioridad,
            ...(codigoTurno ? { codigoTurno } : {}),
          });
          this.turnos.unshift(turno);
        } else {
          turno.estado = "EN_PATIO_ESPERA";
          turno.prioridad = prioridad;
          turno.horaIngresoPatio ??= nowIso;
        }
        return turno;
      },
      { citaId, codigoTurno, prioridad }
    );
  }

  cancelarTurnoPatio(turnoId: string): Promise<ApiResponse<boolean>> {
    return executeMock(`/porteria/turnos/${turnoId}/cancelar`, "DELETE", () => {
      const len = this.turnos.length;
      this.turnos = this.turnos.filter((t) => t.id !== turnoId);
      return this.turnos.length < len;
    });
  }

  llamarVehiculoAMuelle(turnoId: string, muelleId?: string): Promise<ApiResponse<TurnoPatio>> {
    return executeMock(
      `/porteria/turnos/${turnoId}/llamar`,
      "POST",
      () => {
        const turno = this.findTurno(turnoId);
        const nowIso = new Date().toISOString();
        turno.estado = "LLAMADO_A_MUELLE";
        turno.horaLlamadoMuelle = nowIso;
        turno.llamadasRealizadasCount = (turno.llamadasRealizadasCount || 0) + 1;
        turno.notificacionSmsEnviada = true;

        const muelle = muelleId ? MOCK_MUELLES.find((m) => m.id === muelleId) : undefined;
        if (muelle) {
          turno.muelleAsignadoId = muelle.id;
          turno.muelleAsignadoNombre = `${muelle.codigoMuelle} (${muelle.nombre})`;
        }
        const cita = this.findCita(turno.citaId);
        if (cita) {
          cita.estado = "EN_MUELLE";
          cita.tiempos.horaLlamadoMuelle = nowIso;
          if (muelle) cita.muelleId = muelle.id;
        }
        return turno;
      },
      { muelleId }
    );
  }

  posicionarEnMuelle(turnoId: string): Promise<ApiResponse<TurnoPatio>> {
    return executeMock(`/porteria/turnos/${turnoId}/posicionar`, "POST", () => {
      const turno = this.findTurno(turnoId);
      turno.estado = "EN_MUELLE";
      turno.horaPosicionadoEnMuelle = new Date().toISOString();
      const cita = this.findCita(turno.citaId);
      if (cita) cita.estado = "EN_MUELLE";
      return turno;
    });
  }

  iniciarDescargue(turnoId: string): Promise<ApiResponse<TurnoPatio>> {
    return executeMock(`/porteria/turnos/${turnoId}/iniciar-descargue`, "POST", () => {
      const turno = this.findTurno(turnoId);
      const nowIso = new Date().toISOString();
      turno.estado = "DESCARGANDO";
      turno.horaInicioDescargue = nowIso;
      const cita = this.findCita(turno.citaId);
      if (cita) {
        cita.estado = "DESCARGANDO";
        cita.tiempos.horaInicioDescargue = nowIso;
      }
      return turno;
    });
  }

  finalizarDescargue(turnoId: string): Promise<ApiResponse<TurnoPatio>> {
    return executeMock(`/porteria/turnos/${turnoId}/finalizar-descargue`, "POST", () => {
      const turno = this.findTurno(turnoId);
      const nowIso = new Date().toISOString();
      turno.estado = "DESCARGADO_LISTO_SALIDA";
      turno.horaFinDescargue = nowIso;
      const cita = this.findCita(turno.citaId);
      if (cita) {
        cita.estado = "COMPLETADA";
        cita.tiempos.horaFinDescargue = nowIso;
      }
      return turno;
    });
  }

  registrarSalidaPlanta(data: Partial<RegistroSalidaPorteria>): Promise<ApiResponse<RegistroSalidaPorteria>> {
    return executeMock(
      "/porteria/checkout",
      "POST",
      () => {
        const nowIso = new Date().toISOString();
        const cita = this.findCita(data.citaId) ?? this.findCita(data.codigoCita);

        let totalMins = 55;
        if (cita?.tiempos.horaLlegadaPorteria) {
          const llegada = new Date(cita.tiempos.horaLlegadaPorteria).getTime();
          totalMins = Math.max(10, Math.round((Date.now() - llegada) / 60000));
        }

        const salida: RegistroSalidaPorteria = {
          vehiculoPlaca: "PLACA",
          conductorNombre: "Conductor",
          guardaSalidaNombre: "Oficial de garita salida",
          remisionFirmadaYEntregada: true,
          inspeccionFurgonVacioOK: true,
          estibasRetornadasCount: 0,
          novedadesSalida: "Salida registrada conforme sin novedades.",
          ...data,
          id: `sal-${Date.now()}`,
          citaId: data.citaId ?? cita?.id ?? "cita-sal",
          codigoCita: data.codigoCita ?? cita?.codigoCita ?? "CTA-XXXX",
          sedeId: data.sedeId ?? cita?.sedeId ?? "sede-rio-01",
          horaSalida: nowIso,
          tiempoTotalEstadiaMinutos: totalMins,
          cumplioSlaEstadia: totalMins <= 90,
        };
        this.salidas.unshift(salida);

        const turno = this.turnos.find((t) => t.citaId === salida.citaId);
        if (turno) {
          turno.estado = "SALIDA_REGISTRADA";
          turno.horaSalidaPlanta = nowIso;
          turno.tiempoTotalEstadiaMinutos = totalMins;
        }
        if (cita) {
          cita.estado = "COMPLETADA";
          cita.tiempos.horaSalidaPlanta = nowIso;
          cita.tiempos.tiempoTotalEstadiaMinutos = totalMins;
        }
        return salida;
      },
      data
    );
  }

  getHistorialSalidas(sedeId?: string): Promise<ApiResponse<RegistroSalidaPorteria[]>> {
    return executeMock("/porteria/salidas", "GET", () =>
      sedeId ? this.salidas.filter((s) => s.sedeId === sedeId) : [...this.salidas]
    );
  }

  getDriverSession(query: {
    codigoCita?: string;
    placa?: string;
    cedula?: string;
  }): Promise<ApiResponse<DriverPortalSession | null>> {
    return executeMock(
      "/driver/session",
      "POST",
      () => {
        let cita: Cita | undefined;
        const codigo = query.codigoCita?.trim().toUpperCase();
        const placa = query.placa?.trim().toUpperCase();
        const cedula = query.cedula?.trim();

        if (codigo) cita = MOCK_CITAS.find((c) => c.codigoCita.toUpperCase() === codigo || c.id === query.codigoCita);
        if (!cita && placa) {
          const veh = MOCK_VEHICULOS.find((v) => v.placa.toUpperCase() === placa);
          if (veh) cita = MOCK_CITAS.find((c) => c.vehiculoId === veh.id);
        }
        if (!cita && cedula) {
          const cond = MOCK_CONDUCTORES.find((c) => c.numeroDocumento === cedula);
          if (cond) cita = MOCK_CITAS.find((c) => c.conductorId === cond.id);
        }
        if (!cita) return null;

        return {
          cita,
          conductor: MOCK_CONDUCTORES.find((c) => c.id === cita.conductorId) ?? MOCK_CONDUCTORES[0],
          vehiculo: MOCK_VEHICULOS.find((v) => v.id === cita.vehiculoId) ?? MOCK_VEHICULOS[0],
          muelle: MOCK_MUELLES.find((m) => m.id === cita.muelleId),
          sede: MOCK_SEDES.find((s) => s.id === cita.sedeId),
          turnoPatio: this.turnos.find((t) => t.citaId === cita.id),
          inspeccion: this.inspecciones.find((i) => i.citaId === cita.id),
        };
      },
      query
    );
  }
}
