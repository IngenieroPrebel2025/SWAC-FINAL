import { executeMock } from "@/lib/api/http";
import { MOCK_SEDES } from "@/mocks/sites.mock";
import type { ApiResponse, Sede } from "@/types";
import type { ISiteRepository } from "../types";

export class MockSiteRepository implements ISiteRepository {
  private sedes: Sede[] = [...MOCK_SEDES];

  getSedes(): Promise<ApiResponse<Sede[]>> {
    return executeMock("/sedes", "GET", () => [...this.sedes]);
  }

  getSedeById(id: string): Promise<ApiResponse<Sede | null>> {
    return executeMock(`/sedes/${id}`, "GET", () => this.sedes.find((s) => s.id === id) ?? null);
  }

  createSede(sedeData: Partial<Sede>): Promise<ApiResponse<Sede>> {
    return executeMock(
      "/sedes",
      "POST",
      () => {
        const now = new Date().toISOString();
        const nueva: Sede = {
          codigo: "CD-NUEVO",
          nombre: "Nuevo Centro de Distribución",
          direccion: "",
          ciudad: "Medellín",
          departamentoOEstado: "Antioquia",
          pais: "Colombia",
          zonaHoraria: "America/Bogota",
          telefonoContacto: "",
          emailContacto: "",
          activo: true,
          diasNoLaborables: [],
          horarioApertura: "06:00",
          horarioCierre: "22:00",
          tiempoSlotMinutosDefecto: 30,
          toleranciaImpuntualidadMinutos: 15,
          capacidadSimultaneaMuelles: 8,
          ...sedeData,
          id: `sede-${Date.now()}`,
          creadoEn: now,
          actualizadoEn: now,
        };
        this.sedes.push(nueva);
        return nueva;
      },
      sedeData
    );
  }

  updateSede(id: string, sedeData: Partial<Sede>): Promise<ApiResponse<Sede>> {
    return executeMock(
      `/sedes/${id}`,
      "PUT",
      () => {
        const index = this.sedes.findIndex((s) => s.id === id);
        if (index === -1) throw new Error(`Sede ${id} no encontrada`);
        this.sedes[index] = { ...this.sedes[index], ...sedeData, id, actualizadoEn: new Date().toISOString() };
        return this.sedes[index];
      },
      sedeData
    );
  }

  deleteSede(id: string): Promise<ApiResponse<boolean>> {
    return executeMock(`/sedes/${id}`, "DELETE", () => {
      const len = this.sedes.length;
      this.sedes = this.sedes.filter((s) => s.id !== id);
      return this.sedes.length < len;
    });
  }
}
