import { useQuery } from "@tanstack/react-query";
import { DashboardService } from "@/services/DashboardService";

const DASHBOARD_KEY = "dashboard";

export function useDashboard(startDate?: string, endDate?: string) {
  const query = useQuery({
    queryKey: [DASHBOARD_KEY, startDate, endDate],
    queryFn: () => DashboardService.getStats(startDate, endDate),
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });

  return {
    stats: query.data?.data,
    isLoading: query.isLoading,
    isError: query.isError,
    isFetching: query.isFetching,
    refetch: query.refetch,
  };
}
