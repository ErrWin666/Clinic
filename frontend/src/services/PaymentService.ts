import { api } from "@/lib/api";
import type { ApiResponse } from "@/types/api";

export interface Payment {
  id: number;
  invoiceId: number;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  note?: string;
  createdAt: string;
}

export interface PaymentCreateData {
  amount: number;
  paymentDate?: string;
  paymentMethod?: string;
  note?: string;
}

export const PaymentService = {
  async list(invoiceId: number): Promise<ApiResponse<Payment[]>> {
    const { data } = await api.get<ApiResponse<Payment[]>>(`/invoices/${invoiceId}/payments`);
    return data;
  },

  async create(invoiceId: number, payload: PaymentCreateData): Promise<ApiResponse<Payment>> {
    const { data } = await api.post<ApiResponse<Payment>>(`/invoices/${invoiceId}/payments`, payload);
    return data;
  },

  async delete(invoiceId: number, paymentId: number): Promise<ApiResponse<unknown>> {
    const { data } = await api.delete<ApiResponse<unknown>>(`/invoices/${invoiceId}/payments/${paymentId}`);
    return data;
  },
};
