import { api } from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type {
  SettingsGroup,
  SettingsUpdateItem,
  AdminUpdateData,
  AdminUpdateResponse,
} from "@/types/settings";

export const SettingsService = {
  async getAll(): Promise<ApiResponse<SettingsGroup>> {
    const { data } = await api.get<ApiResponse<SettingsGroup>>("/settings");
    return data;
  },

  async update(
    settings: SettingsUpdateItem[]
  ): Promise<ApiResponse<SettingsGroup>> {
    const { data } = await api.put<ApiResponse<SettingsGroup>>("/settings", {
      settings,
    });
    return data;
  },

  async updateAdmin(
    payload: AdminUpdateData
  ): Promise<ApiResponse<AdminUpdateResponse>> {
    const { data } = await api.put<ApiResponse<AdminUpdateResponse>>(
      "/settings/admin",
      payload
    );
    return data;
  },

  async uploadAdminImage(
    file: File
  ): Promise<ApiResponse<{ profileImageUrl: string }>> {
    const formData = new FormData();
    formData.append("image", file);
    const { data } = await api.post<
      ApiResponse<{ profileImageUrl: string }>
    >("/settings/admin/profile-image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  async deleteAdminImage(): Promise<ApiResponse<unknown>> {
    const { data } = await api.delete<ApiResponse<unknown>>(
      "/settings/admin/profile-image"
    );
    return data;
  },

  async uploadClinicLogo(
    file: File
  ): Promise<ApiResponse<{ logoUrl: string }>> {
    const formData = new FormData();
    formData.append("image", file);
    const { data } = await api.post<
      ApiResponse<{ logoUrl: string }>
    >("/settings/clinic/logo", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  async deleteClinicLogo(): Promise<ApiResponse<unknown>> {
    const { data } = await api.delete<ApiResponse<unknown>>(
      "/settings/clinic/logo"
    );
    return data;
  },
};
