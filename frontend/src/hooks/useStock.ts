import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  StockService,
  type StockMovementListParams,
  type OpeningStockData,
  type AdjustStockData,
  type DamageData,
  type ExpiryData,
} from "@/services/StockService";
import type { Pagination } from "@/types/api";
import { useApiError } from "@/hooks/useApiError";

const STOCK_KEY = "stock";
const STOCK_STATS_KEY = "stock-stats";

interface UseStockMovementsOptions {
  productVariantId?: number;
  type?: string;
  reason?: string;
  referenceType?: string;
  referenceId?: number;
  startDate?: string;
  endDate?: string;
  page: number;
  pageSize?: number;
}

export function useStockMovements({
  productVariantId,
  type,
  reason,
  referenceType,
  referenceId,
  startDate,
  endDate,
  page,
  pageSize = 20,
}: UseStockMovementsOptions) {
  const params: StockMovementListParams = {
    page,
    pageSize,
    productVariantId,
    type: type as StockMovementListParams["type"],
    reason: reason as StockMovementListParams["reason"],
    referenceType,
    referenceId,
    startDate,
    endDate,
  };

  const query = useQuery({
    queryKey: [STOCK_KEY, "movements", params],
    queryFn: () => StockService.listMovements(params),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });

  return {
    movements: query.data?.data ?? [],
    pagination: query.data?.pagination as Pagination | undefined,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useStockStats() {
  const query = useQuery({
    queryKey: [STOCK_STATS_KEY],
    queryFn: () => StockService.getStats(),
    staleTime: 60 * 1000,
  });

  return {
    stats: query.data?.data,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export function useOpeningStock() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { handleApiError } = useApiError();

  const mutation = useMutation({
    mutationFn: (data: OpeningStockData) => StockService.openingStock(data),
    onSuccess: () => {
      toast.success(t("inventory.messages.openingStockAdded"));
      queryClient.invalidateQueries({ queryKey: [STOCK_KEY] });
      queryClient.invalidateQueries({ queryKey: [STOCK_STATS_KEY] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error) => handleApiError(error),
  });

  return {
    addOpeningStock: mutation.mutateAsync,
    isAdding: mutation.isPending,
  };
}

export function useAdjustStock() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { handleApiError } = useApiError();

  const mutation = useMutation({
    mutationFn: (data: AdjustStockData) => StockService.adjustStock(data),
    onSuccess: () => {
      toast.success(t("inventory.messages.stockAdjusted"));
      queryClient.invalidateQueries({ queryKey: [STOCK_KEY] });
      queryClient.invalidateQueries({ queryKey: [STOCK_STATS_KEY] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error) => handleApiError(error),
  });

  return {
    adjustStock: mutation.mutateAsync,
    isAdjusting: mutation.isPending,
  };
}

export function useRecordDamage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { handleApiError } = useApiError();

  const mutation = useMutation({
    mutationFn: (data: DamageData) => StockService.recordDamage(data),
    onSuccess: () => {
      toast.success(t("inventory.messages.damageRecorded"));
      queryClient.invalidateQueries({ queryKey: [STOCK_KEY] });
      queryClient.invalidateQueries({ queryKey: [STOCK_STATS_KEY] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error) => handleApiError(error),
  });

  return {
    recordDamage: mutation.mutateAsync,
    isRecording: mutation.isPending,
  };
}

export function useRecordExpiry() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { handleApiError } = useApiError();

  const mutation = useMutation({
    mutationFn: (data: ExpiryData) => StockService.recordExpiry(data),
    onSuccess: () => {
      toast.success(t("inventory.messages.expiryRecorded"));
      queryClient.invalidateQueries({ queryKey: [STOCK_KEY] });
      queryClient.invalidateQueries({ queryKey: [STOCK_STATS_KEY] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error) => handleApiError(error),
  });

  return {
    recordExpiry: mutation.mutateAsync,
    isRecording: mutation.isPending,
  };
}
