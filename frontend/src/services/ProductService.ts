import { api } from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type { Product, ProductVariant } from "@/types/models";
import type { ProductCategory, CostingMethod } from "@/types/enums";

export interface ProductListParams {
  page?: number;
  pageSize?: number;
  category?: ProductCategory;
  search?: string;
  isActive?: boolean;
}

export interface ProductCreateData {
  name: string;
  category: ProductCategory;
  costingMethod: CostingMethod;
  description?: string;
}

export interface ProductUpdateData {
  name?: string;
  category?: ProductCategory;
  costingMethod?: CostingMethod;
  description?: string;
  isActive?: boolean;
}

export interface VariantCreateData {
  name: string;
  sku: string;
  barcode?: string;
  sellPrice: number;
  costPrice?: number;
  minQuantity?: number;
  maxQuantity?: number;
  location?: string;
  serialNumber?: string;
  discountPercentage?: number;
  discountValidUntil?: string;
}

export interface VariantUpdateData extends Partial<VariantCreateData> {
  isActive?: boolean;
}

export const ProductService = {
  async list(params?: ProductListParams): Promise<ApiResponse<Product[]>> {
    const { data } = await api.get<ApiResponse<Product[]>>("/products", { params });
    return data;
  },

  async getById(id: number): Promise<ApiResponse<Product>> {
    const { data } = await api.get<ApiResponse<Product>>(`/products/${id}`);
    return data;
  },

  async create(payload: ProductCreateData): Promise<ApiResponse<Product>> {
    const { data } = await api.post<ApiResponse<Product>>("/products", payload);
    return data;
  },

  async update(id: number, payload: ProductUpdateData): Promise<ApiResponse<Product>> {
    const { data } = await api.put<ApiResponse<Product>>(`/products/${id}`, payload);
    return data;
  },

  async delete(id: number): Promise<ApiResponse<unknown>> {
    const { data } = await api.delete<ApiResponse<unknown>>(`/products/${id}`);
    return data;
  },

  async listVariants(productId: number): Promise<ApiResponse<ProductVariant[]>> {
    const { data } = await api.get<ApiResponse<ProductVariant[]>>(`/products/${productId}/variants`);
    return data;
  },

  async createVariant(productId: number, payload: VariantCreateData): Promise<ApiResponse<ProductVariant>> {
    const { data } = await api.post<ApiResponse<ProductVariant>>(`/products/${productId}/variants`, payload);
    return data;
  },

  async updateVariant(productId: number, variantId: number, payload: VariantUpdateData): Promise<ApiResponse<ProductVariant>> {
    const { data } = await api.put<ApiResponse<ProductVariant>>(`/products/${productId}/variants/${variantId}`, payload);
    return data;
  },

  async deleteVariant(productId: number, variantId: number): Promise<ApiResponse<unknown>> {
    const { data } = await api.delete<ApiResponse<unknown>>(`/products/${productId}/variants/${variantId}`);
    return data;
  },

  async getByBarcode(barcode: string): Promise<ApiResponse<ProductVariant>> {
    const { data } = await api.get<ApiResponse<ProductVariant>>(`/products/barcode/${barcode}`);
    return data;
  },
};
