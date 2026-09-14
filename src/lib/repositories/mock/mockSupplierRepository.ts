import { executeMock } from "@/lib/api/http";
import { MOCK_MATERIALES, MOCK_PROVEEDORES, MOCK_TIPOS_MATERIAL } from "@/mocks/suppliers.mock";
import type { ApiResponse, Material, Proveedor, TipoMaterial } from "@/types";
import type { ISupplierRepository } from "../types";

export class MockSupplierRepository implements ISupplierRepository {
  private proveedores: Proveedor[] = [...MOCK_PROVEEDORES];
  private tiposMaterial: TipoMaterial[] = [...MOCK_TIPOS_MATERIAL];
  private materiales: Material[] = [...MOCK_MATERIALES];

  getProveedores(): Promise<ApiResponse<Proveedor[]>> {
    return executeMock("/proveedores", "GET", () => [...this.proveedores]);
  }

  getProveedorById(id: string): Promise<ApiResponse<Proveedor | null>> {
    return executeMock(`/proveedores/${id}`, "GET", () => this.proveedores.find((p) => p.id === id) ?? null);
  }

  getTiposMaterial(): Promise<ApiResponse<TipoMaterial[]>> {
    return executeMock("/materiales/tipos", "GET", () => [...this.tiposMaterial]);
  }

  getMateriales(): Promise<ApiResponse<Material[]>> {
    return executeMock("/materiales", "GET", () => [...this.materiales]);
  }

  createMaterial(material: Partial<Material>): Promise<ApiResponse<Material>> {
    return executeMock("/materiales", "POST", () => {
      const nuevo: Material = {
        id: `mat-${Date.now()}`,
        sku: material.sku ?? "",
        descripcion: material.descripcion ?? "",
        tipoMaterialId: material.tipoMaterialId ?? this.tiposMaterial[0]?.id ?? "",
        unidadMedida: material.unidadMedida ?? "ESTIBA",
        pesoPromedioKg: material.pesoPromedioKg ?? 0,
        volumenM3: material.volumenM3 ?? 0,
        codRefSap: material.codRefSap,
        activo: material.activo ?? true,
      };
      this.materiales.push(nuevo);
      return nuevo;
    });
  }

  updateMaterial(id: string, material: Partial<Material>): Promise<ApiResponse<Material>> {
    return executeMock(`/materiales/${id}`, "PUT", () => {
      const index = this.materiales.findIndex((item) => item.id === id);
      if (index < 0) throw new Error("Material no encontrado");
      this.materiales[index] = { ...this.materiales[index], ...material, id };
      return this.materiales[index];
    });
  }
}
