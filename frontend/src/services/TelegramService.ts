import { api } from "@/lib/api";
import type { ApiResponse } from "@/types/api";

export interface TelegramSettings {
  enabled?: boolean;
  botUsername?: string;
  botToken?: string;
}

export interface TelegramInviteResult {
  inviteLink: string;
  smsSent: boolean;
  smsChannel: string;
}

export const TelegramService = {
  async getSettings(): Promise<ApiResponse<TelegramSettings>> {
    const { data } = await api.get<ApiResponse<TelegramSettings>>("/telegram/settings");
    return data;
  },

  async updateSettings(payload: TelegramSettings): Promise<ApiResponse<TelegramSettings>> {
    const { data } = await api.put<ApiResponse<TelegramSettings>>("/telegram/settings", payload);
    return data;
  },

  async testConnection(chatId: string): Promise<ApiResponse<unknown>> {
    const { data } = await api.post<ApiResponse<unknown>>("/telegram/test", { chatId });
    return data;
  },

  async sendInvite(patientId: number): Promise<ApiResponse<TelegramInviteResult>> {
    const { data } = await api.post<ApiResponse<TelegramInviteResult>>(`/telegram/invite/${patientId}`);
    return data;
  },
};
