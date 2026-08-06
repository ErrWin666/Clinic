import { api } from "@/lib/api";
import type { ApiResponse } from "@/types/api";

export interface WhatsAppCloudSettings {
  enabled?: boolean;
  phoneNumberId?: string;
  accessToken?: string;
  apiVersion?: string;
  monthlyCount?: number;
  monthlyCountMonth?: string;
}

export interface SmsMobileApiSettings {
  enabled?: boolean;
  url?: string;
  apiKey?: string;
}

export interface DispatchStats {
  whatsapp: number;
  telegram: number;
  sms_mobile: number;
  sms: number;
  none: number;
  total: number;
}

export interface DispatchStatus {
  id: number;
  type: string;
  dispatchChannel: string | null;
  dispatchedAt: string | null;
  dispatchError: string | null;
}

export const MessagingService = {
  // WhatsApp Cloud API
  async getWhatsAppCloudSettings(): Promise<ApiResponse<WhatsAppCloudSettings>> {
    const { data } = await api.get<ApiResponse<WhatsAppCloudSettings>>("/whatsapp/cloud-settings");
    return data;
  },

  async updateWhatsAppCloudSettings(payload: WhatsAppCloudSettings): Promise<ApiResponse<WhatsAppCloudSettings>> {
    const { data } = await api.put<ApiResponse<WhatsAppCloudSettings>>("/whatsapp/cloud-settings", payload);
    return data;
  },

  // SMSMobileAPI
  async getSmsMobileApiSettings(): Promise<ApiResponse<SmsMobileApiSettings>> {
    const { data } = await api.get<ApiResponse<SmsMobileApiSettings>>("/whatsapp/sms-mobile-settings");
    return data;
  },

  async updateSmsMobileApiSettings(payload: SmsMobileApiSettings): Promise<ApiResponse<SmsMobileApiSettings>> {
    const { data } = await api.put<ApiResponse<SmsMobileApiSettings>>("/whatsapp/sms-mobile-settings", payload);
    return data;
  },

  async testSmsMobileApi(): Promise<ApiResponse<unknown>> {
    const { data } = await api.post<ApiResponse<unknown>>("/whatsapp/sms-mobile-test");
    return data;
  },

  // Message dispatch
  async dispatchNotification(notificationId: number): Promise<ApiResponse<unknown>> {
    const { data } = await api.post<ApiResponse<unknown>>(`/messages/dispatch/${notificationId}`);
    return data;
  },

  async getDispatchStatus(notificationId: number): Promise<ApiResponse<DispatchStatus>> {
    const { data } = await api.get<ApiResponse<DispatchStatus>>(`/messages/status/${notificationId}`);
    return data;
  },

  async getDispatchStats(): Promise<ApiResponse<DispatchStats>> {
    const { data } = await api.get<ApiResponse<DispatchStats>>("/messages/stats");
    return data;
  },
};
