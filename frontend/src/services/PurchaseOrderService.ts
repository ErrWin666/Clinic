import { api } from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type { PurchaseOrder } from "@/types/models";
import type { PurchaseOrderStatus } from "@/types/enums";

export interface PurchaseOrderListParams {
  page?: number;
  pageSize?: number;
  supplierId?: number;
  status?: PurchaseOrderStatus;
  startDate?: string;
  endDate?: string;
}

export interface POItemData {
  productVariantId: number;
  quantity: number;
  unitCost: number;
  batchNumber?: string;
  expiryDate?: string;
}

export interface PurchaseOrderCreateData {
  supplierId: number;
  orderDate: string;
  note?: string;
  items: POItemData[];
}

export interface PurchaseOrderUpdateData {
  orderDate?: string;
  note?: string;
  items?: POItemData[];
}

export interface ReceiveItemData {
  id: number;
  receivedQuantity: number;
  batchNumber?: string;
  expiryDate?: string;
}

export interface ReceivePurchaseOrderData {
  items: ReceiveItemData[];
}

export const PurchaseOrderService = {
  async list(params?: PurchaseOrderListParams): Promise<ApiResponse<PurchaseOrder[]>> {
    const { data } = await api.get<ApiResponse<PurchaseOrder[]>>("/purchase-orders", { params });
    return data;
  },

  async getById(id: number): Promise<ApiResponse<PurchaseOrder>> {
    const { data } = await api.get<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}`);
    return data;
  },

  async create(payload: PurchaseOrderCreateData): Promise<ApiResponse<PurchaseOrder>> {
    const { data } = await api.post<ApiResponse<PurchaseOrder>>("/purchase-orders", payload);
    return data;
  },

  async update(id: number, payload: PurchaseOrderUpdateData): Promise<ApiResponse<PurchaseOrder>> {
    const { data } = await api.put<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}`, payload);
    return data;
  },

  async receive(id: number, payload: ReceivePurchaseOrderData): Promise<ApiResponse<PurchaseOrder>> {
    const { data } = await api.post<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}/receive`, payload);
    return data;
  },

  async cancel(id: number): Promise<ApiResponse<PurchaseOrder>> {
    const { data } = await api.post<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}/cancel`);
    return data;
  },
};
