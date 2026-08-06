import { api } from "@/lib/api";
import type { ApiResponse } from "@/types/api";

export interface CheckAdminResponse {
  adminExists: boolean;
}

export interface CreateAdminData {
  username: string;
  password: string;
  confirmPassword: string;
  clinicName: string;
  currency: string;
  language: string;
}

export const SetupService = {
  async checkAdmin(): Promise<ApiResponse<CheckAdminResponse>> {
    const { data } = await api.get<ApiResponse<CheckAdminResponse>>(
      "/setup/check-admin"
    );
    return data;
  },

  async createAdmin(
    payload: CreateAdminData
  ): Promise<ApiResponse<{ id: number; username: string; role: string }>> {
    const { data } = await api.post<ApiResponse<{ id: number; username: string; role: string }>>(
      "/setup/create-admin",
      payload
    );
    return data;
  },
};
