import { api } from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type { DiskSpace } from "@/types/settings";

export const SystemService = {
  async getDiskSpace(): Promise<ApiResponse<DiskSpace>> {
    const { data } = await api.get<ApiResponse<DiskSpace>>(
      "/system/disk-space"
    );
    return data;
  },
};
