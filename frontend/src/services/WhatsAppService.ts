import { api } from "@/lib/api";
import type { ApiResponse } from "@/types/api";

export interface WhatsAppSettings {
  enabled?: boolean;
  accountSid?: string;
  authToken?: string;
  fromNumber?: string;
  appointmentTemplate?: string;
  invoiceTemplate?: string;
  followUpTemplate?: string;
}

export const WhatsAppService = {
  async getSettings(): Promise<ApiResponse<WhatsAppSettings>> {
    const { data } = await api.get<ApiResponse<WhatsAppSettings>>("/whatsapp/settings");
    return data;
  },

  async updateSettings(payload: WhatsAppSettings): Promise<ApiResponse<WhatsAppSettings>> {
    const { data } = await api.put<ApiResponse<WhatsAppSettings>>("/whatsapp/settings", payload);
    return data;
  },

  async testMessage(to: string): Promise<ApiResponse<unknown>> {
    const { data } = await api.post<ApiResponse<unknown>>("/whatsapp/test", { to });
    return data;
  },

  async sendAppointmentReminder(id: number): Promise<ApiResponse<unknown>> {
    const { data } = await api.post<ApiResponse<unknown>>(`/whatsapp/appointment/${id}`);
    return data;
  },

  async sendInvoiceNotification(id: number): Promise<ApiResponse<unknown>> {
    const { data } = await api.post<ApiResponse<unknown>>(`/whatsapp/invoice/${id}`);
    return data;
  },

  async sendFollowUpReminder(patientId: number, lastVisitDate?: string): Promise<ApiResponse<unknown>> {
    const { data } = await api.post<ApiResponse<unknown>>(`/whatsapp/follow-up/${patientId}`, { lastVisitDate });
    return data;
  },
};
