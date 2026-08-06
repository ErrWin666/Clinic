import { api } from "@/lib/api";
import { getApiUrl } from "@/lib/config";
import type { ApiResponse } from "@/types/api";
import type { BackupRecord, BackupSchedule } from "@/types/settings";

export const BackupService = {
  async create(): Promise<ApiResponse<BackupRecord>> {
    const { data } = await api.post<ApiResponse<BackupRecord>>(
      "/backup/create"
    );
    return data;
  },

  async restore(filename: string): Promise<ApiResponse<BackupRecord>> {
    const { data } = await api.post<ApiResponse<BackupRecord>>(
      "/backup/restore",
      { filename }
    );
    return data;
  },

  async history(): Promise<ApiResponse<BackupRecord[]>> {
    const { data } = await api.get<ApiResponse<BackupRecord[]>>(
      "/backup/history"
    );
    return data;
  },

  async getSchedule(): Promise<ApiResponse<BackupSchedule>> {
    const { data } = await api.get<ApiResponse<BackupSchedule>>(
      "/backup/schedule"
    );
    return data;
  },

  async updateSchedule(
    payload: BackupSchedule
  ): Promise<ApiResponse<BackupSchedule>> {
    const { data } = await api.put<ApiResponse<BackupSchedule>>(
      "/backup/schedule",
      payload
    );
    return data;
  },

  getDownloadUrl(filename: string): string {
    return `${getApiUrl()}/backup/download/${filename}`;
  },
};
