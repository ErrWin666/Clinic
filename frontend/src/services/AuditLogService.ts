import { api } from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type { AuditLogEntry, AuditLogListParams } from "@/types/settings";

export const AuditLogService = {
  async list(
    params?: AuditLogListParams
  ): Promise<ApiResponse<AuditLogEntry[]>> {
    const { data } = await api.get<ApiResponse<AuditLogEntry[]>>(
      "/audit-logs",
      { params }
    );
    return data;
  },
};
