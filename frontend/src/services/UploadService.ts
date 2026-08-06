import { api } from "@/lib/api";
import type { ApiResponse } from "@/types/api";

export interface UploadImageResponse {
  src: string;
}

export const UploadService = {
  async uploadImage(patientId: number, file: File): Promise<ApiResponse<UploadImageResponse>> {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await api.post<ApiResponse<UploadImageResponse>>(
      `/patients/${patientId}/upload/image`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return data;
  },
};
