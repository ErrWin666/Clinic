import { useQuery } from "@tanstack/react-query";
import { StockService } from "@/services/StockService";

const STOCK_ALERTS_KEY = "stock-alerts";

export function useStockAlerts(days = 30) {
  const query = useQuery({
    queryKey: [STOCK_ALERTS_KEY, days],
    queryFn: () => StockService.checkAlerts(days),
    refetchInterval: 60 * 1000,
  });

  return {
    alerts: query.data?.data,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
