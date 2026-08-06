import { api } from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type { PackagingUnit, BarcodeLookupResult } from "@/types/models";

export interface PackagingUnitCreateData {
  name: string;
  shortName: string;
  factor: number;
  isBaseUnit?: boolean;
  barcode?: string | null;
  sellPrice?: number | null;
  isActive?: boolean;
}

export interface PackagingUnitUpdateData extends Partial<PackagingUnitCreateData> {
  isActive?: boolean;
}

export const PackagingUnitService = {
  async listByVariant(variantId: number): Promise<ApiResponse<PackagingUnit[]>> {
    const { data } = await api.get<ApiResponse<PackagingUnit[]>>(`/packaging-units/variant/${variantId}`);
    return data;
  },

  async create(variantId: number, payload: PackagingUnitCreateData): Promise<ApiResponse<PackagingUnit>> {
    const { data } = await api.post<ApiResponse<PackagingUnit>>(`/packaging-units/variant/${variantId}`, payload);
    return data;
  },

  async update(_variantId: number, id: number, payload: PackagingUnitUpdateData): Promise<ApiResponse<PackagingUnit>> {
    const { data } = await api.put<ApiResponse<PackagingUnit>>(`/packaging-units/${id}`, payload);
    return data;
  },

  async delete(_variantId: number, id: number): Promise<ApiResponse<unknown>> {
    const { data } = await api.delete<ApiResponse<unknown>>(`/packaging-units/${id}`);
    return data;
  },

  /**
   * Lookup by barcode — searches packaging_units first, falls back to variant barcode.
   * Returns { variant, unit, factor }.
   */
  async findByBarcode(barcode: string): Promise<ApiResponse<BarcodeLookupResult>> {
    const { data } = await api.get<ApiResponse<BarcodeLookupResult>>(`/products/barcode/${barcode}`);
    return data;
  },
};
