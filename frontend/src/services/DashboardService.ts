import { api } from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type { DashboardStats } from "@/types/models";

export const DashboardService = {
  async getStats(startDate?: string, endDate?: string): Promise<ApiResponse<DashboardStats>> {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    const query = params.toString() ? `?${params.toString()}` : "";
    const { data } = await api.get<ApiResponse<DashboardStats>>(
      `/dashboard/stats${query}`
    );
    return data;
  },
};
