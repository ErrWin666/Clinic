import { useQuery } from "@tanstack/react-query";
import { AuditLogService } from "@/services/AuditLogService";
import type { AuditLogListParams } from "@/types/settings";
import type { Pagination } from "@/types/api";
import type { AuditLog } from "@/types/models";

const AUDIT_KEY = "audit-logs";

export function useAuditLogs(params: AuditLogListParams) {
  const query = useQuery({
    queryKey: [AUDIT_KEY, params],
    queryFn: () => AuditLogService.list(params),
    placeholderData: (prev) => prev,
    staleTime: 5 * 60 * 1000,
  });

  return {
    logs: query.data?.data ?? [],
    pagination: query.data?.pagination as Pagination | undefined,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export type { AuditLog };
