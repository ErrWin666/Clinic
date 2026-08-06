import { api } from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type { Supplier, SupplierPayment, SupplierStatement } from "@/types/models";
import type { SupplierPaymentMethod } from "@/types/enums";

export interface SupplierListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean;
}

export interface SupplierCreateData {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  contactPerson?: string;
  taxNumber?: string;
  openingBalance?: number;
  notes?: string;
}

export interface SupplierUpdateData extends Partial<SupplierCreateData> {
  isActive?: boolean;
}

export interface SupplierPaymentCreateData {
  amount: number;
  paymentDate: string;
  paymentMethod: SupplierPaymentMethod;
  reference?: string;
  purchaseOrderId?: number;
  note?: string;
}

export interface StatementParams {
  startDate?: string;
  endDate?: string;
}

export const SupplierService = {
  async list(params?: SupplierListParams): Promise<ApiResponse<Supplier[]>> {
    const { data } = await api.get<ApiResponse<Supplier[]>>("/suppliers", { params });
    return data;
  },

  async getById(id: number): Promise<ApiResponse<Supplier>> {
    const { data } = await api.get<ApiResponse<Supplier>>(`/suppliers/${id}`);
    return data;
  },

  async create(payload: SupplierCreateData): Promise<ApiResponse<Supplier>> {
    const { data } = await api.post<ApiResponse<Supplier>>("/suppliers", payload);
    return data;
  },

  async update(id: number, payload: SupplierUpdateData): Promise<ApiResponse<Supplier>> {
    const { data } = await api.put<ApiResponse<Supplier>>(`/suppliers/${id}`, payload);
    return data;
  },

  async delete(id: number): Promise<ApiResponse<unknown>> {
    const { data } = await api.delete<ApiResponse<unknown>>(`/suppliers/${id}`);
    return data;
  },

  async getStatement(id: number, params?: StatementParams): Promise<ApiResponse<SupplierStatement>> {
    const { data } = await api.get<ApiResponse<SupplierStatement>>(`/suppliers/${id}/statement`, { params });
    return data;
  },

  async listPayments(supplierId: number): Promise<ApiResponse<SupplierPayment[]>> {
    const { data } = await api.get<ApiResponse<SupplierPayment[]>>(`/suppliers/${supplierId}/payments`);
    return data;
  },

  async createPayment(supplierId: number, payload: SupplierPaymentCreateData): Promise<ApiResponse<SupplierPayment>> {
    const { data } = await api.post<ApiResponse<SupplierPayment>>(`/suppliers/${supplierId}/payments`, payload);
    return data;
  },
};
