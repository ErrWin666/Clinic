import { api } from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type { Notification } from "@/types/models";

export interface NotificationListParams {
  page?: number;
  pageSize?: number;
  isRead?: boolean;
  type?: string;
}

export const NotificationService = {
  async list(
    params?: NotificationListParams
  ): Promise<ApiResponse<Notification[]>> {
    const { data } = await api.get<ApiResponse<Notification[]>>(
      "/notifications",
      { params }
    );
    return data;
  },

  async markRead(id: number): Promise<ApiResponse<unknown>> {
    const { data } = await api.patch<ApiResponse<unknown>>(
      `/notifications/${id}/read`
    );
    return data;
  },

  async markAllRead(): Promise<ApiResponse<unknown>> {
    const { data } = await api.patch<ApiResponse<unknown>>(
      "/notifications/read-all"
    );
    return data;
  },

  async delete(id: number): Promise<ApiResponse<unknown>> {
    const { data } = await api.delete<ApiResponse<unknown>>(
      `/notifications/${id}`
    );
    return data;
  },

  async getReminderSettings(): Promise<ApiResponse<{ appointmentReminderDays: number; invoiceReminderDays: number; followUpDays: number }>> {
    const { data } = await api.get<ApiResponse<{ appointmentReminderDays: number; invoiceReminderDays: number; followUpDays: number }>>(
      "/notifications/reminder-settings"
    );
    return data;
  },

  async updateReminderSettings(payload: { appointmentReminderDays: number; invoiceReminderDays: number; followUpDays: number }): Promise<ApiResponse<unknown>> {
    const { data } = await api.put<ApiResponse<unknown>>("/notifications/reminder-settings", payload);
    return data;
  },

  async getTemplates(): Promise<ApiResponse<{ templates: Record<string, { text: string; html: string; whatsappParams: string[] }>; types: string[]; whatsappCloudDefinitions: Array<{ name: string; language: string; body: string; params: string[] }>; language: string }>> {
    const { data } = await api.get<ApiResponse<{ templates: Record<string, { text: string; html: string; whatsappParams: string[] }>; types: string[]; whatsappCloudDefinitions: Array<{ name: string; language: string; body: string; params: string[] }>; language: string }>>("/notifications/templates");
    return data;
  },

  async updateTemplate(type: string, payload: { text: string; html: string }): Promise<ApiResponse<unknown>> {
    const { data } = await api.put<ApiResponse<unknown>>(`/notifications/templates/${type}`, payload);
    return data;
  },

  async resetTemplate(type: string): Promise<ApiResponse<unknown>> {
    const { data } = await api.delete<ApiResponse<unknown>>(`/notifications/templates/${type}`);
    return data;
  },
};
