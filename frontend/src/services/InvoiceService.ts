import { api } from "@/lib/api";
import { getApiUrl } from "@/lib/config";
import type { ApiResponse } from "@/types/api";
import type { Invoice } from "@/types/models";
import type { InvoiceCreateData, InvoiceUpdateData } from "@/types/invoice";

export interface InvoiceListParams {
  page?: number;
  pageSize?: number;
  patientId?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  minAmount?: number;
  maxAmount?: number;
  invoiceType?: "patient" | "customer";
}

export interface InvoiceStats {
  unpaidCount: number;
  unpaidTotal: number;
  paidCount: number;
  paidTotal: number;
  partiallyPaidCount?: number;
  partiallyPaidTotal?: number;
  partiallyPaidPaidAmount?: number;
  overdueCount: number;
  overdueTotal?: number;
  totalCount: number;
  totalPaidAmount?: number;
  totalOutstanding?: number;
}

export const InvoiceService = {
  async list(
    params?: InvoiceListParams
  ): Promise<ApiResponse<Invoice[]>> {
    const { data } = await api.get<ApiResponse<Invoice[]>>(
      "/invoices",
      { params }
    );
    return data;
  },

  async getStats(
    params?: Omit<InvoiceListParams, "page" | "pageSize">
  ): Promise<ApiResponse<InvoiceStats>> {
    const { data } = await api.get<ApiResponse<InvoiceStats>>(
      "/invoices/stats",
      { params }
    );
    return data;
  },

  async getById(id: number): Promise<ApiResponse<Invoice>> {
    const { data } = await api.get<ApiResponse<Invoice>>(`/invoices/${id}`);
    return data;
  },

  async create(payload: InvoiceCreateData): Promise<ApiResponse<Invoice>> {
    const { data } = await api.post<ApiResponse<Invoice>>("/invoices", payload);
    return data;
  },

  async update(
    id: number,
    payload: InvoiceUpdateData
  ): Promise<ApiResponse<Invoice>> {
    const { data } = await api.put<ApiResponse<Invoice>>(
      `/invoices/${id}`,
      payload
    );
    return data;
  },

  async changeStatus(
    id: number,
    status: string
  ): Promise<ApiResponse<Invoice>> {
    const { data } = await api.patch<ApiResponse<Invoice>>(
      `/invoices/${id}/status`,
      { status }
    );
    return data;
  },

  async delete(id: number): Promise<ApiResponse<unknown>> {
    const { data } = await api.delete<ApiResponse<unknown>>(`/invoices/${id}`);
    return data;
  },

  getPDF(id: number): void {
    window.open(`${getApiUrl()}/invoices/${id}/pdf`, "_blank");
  },

  export(filters: InvoiceListParams): void {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.status) params.set("status", filters.status);
    if (filters.startDate) params.set("startDate", filters.startDate);
    if (filters.endDate) params.set("endDate", filters.endDate);
    if (filters.minAmount !== undefined)
      params.set("minAmount", String(filters.minAmount));
    if (filters.maxAmount !== undefined)
      params.set("maxAmount", String(filters.maxAmount));
    if (filters.patientId) params.set("patientId", String(filters.patientId));
    if (filters.invoiceType) params.set("invoiceType", filters.invoiceType);
    window.open(
      `${getApiUrl()}/invoices/export?${params.toString()}`,
      "_blank"
    );
  },
};
