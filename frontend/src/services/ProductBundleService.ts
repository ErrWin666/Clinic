import { api } from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type { ProductBundle } from "@/types/models";

export interface ProductBundleListParams {
  page?: number;
  pageSize?: number;
  productId?: number;
  search?: string;
}

export interface BundleItemData {
  productVariantId: number;
  quantity: number;
}

export interface ProductBundleCreateData {
  productId: number;
  description?: string;
  items: BundleItemData[];
}

export interface ProductBundleUpdateData {
  description?: string;
  items?: BundleItemData[];
}

export interface ExpandedBundleItem {
  description: string;
  quantity: number;
  unitPrice: number;
  productVariantId: number;
}

export const ProductBundleService = {
  async list(params?: ProductBundleListParams): Promise<ApiResponse<ProductBundle[]>> {
    const { data } = await api.get<ApiResponse<ProductBundle[]>>("/product-bundles", { params });
    return data;
  },

  async getById(id: number): Promise<ApiResponse<ProductBundle>> {
    const { data } = await api.get<ApiResponse<ProductBundle>>(`/product-bundles/${id}`);
    return data;
  },

  async create(payload: ProductBundleCreateData): Promise<ApiResponse<ProductBundle>> {
    const { data } = await api.post<ApiResponse<ProductBundle>>("/product-bundles", payload);
    return data;
  },

  async update(id: number, payload: ProductBundleUpdateData): Promise<ApiResponse<ProductBundle>> {
    const { data } = await api.put<ApiResponse<ProductBundle>>(`/product-bundles/${id}`, payload);
    return data;
  },

  async delete(id: number): Promise<ApiResponse<unknown>> {
    const { data } = await api.delete<ApiResponse<unknown>>(`/product-bundles/${id}`);
    return data;
  },

  async expand(id: number, quantity?: number): Promise<ApiResponse<ExpandedBundleItem[]>> {
    const { data } = await api.post<ApiResponse<ExpandedBundleItem[]>>(`/product-bundles/${id}/expand`, { quantity: quantity || 1 });
    return data;
  },
};
