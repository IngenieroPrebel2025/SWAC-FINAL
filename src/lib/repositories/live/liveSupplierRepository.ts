import { executeLive } from "@/lib/api/http";
import type { ApiResponse, Material, Proveedor, TipoMaterial } from "@/types";
import type { ISupplierRepository } from "../types";

export class LiveSupplierRepository implements ISupplierRepository {
  getProveedores(): Promise<ApiResponse<Proveedor[]>> {
    return executeLive("/proveedores", "GET");
  }

  getProveedorById(id: string): Promise<ApiResponse<Proveedor | null>> {
    return executeLive(`/proveedores/${id}`, "GET");
  }

  getTiposMaterial(): Promise<ApiResponse<TipoMaterial[]>> {
    return executeLive("/materiales/tipos", "GET");
  }

  getMateriales(): Promise<ApiResponse<Material[]>> {
    return executeLive("/materiales", "GET");
  }

  createMaterial(material: Partial<Material>): Promise<ApiResponse<Material>> {
    return executeLive("/materiales", "POST", material);
  }

  updateMaterial(id: string, material: Partial<Material>): Promise<ApiResponse<Material>> {
    return executeLive(`/materiales/${id}`, "PUT", material);
  }
}
