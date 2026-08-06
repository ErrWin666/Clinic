import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  StocktakingService,
  type StocktakingCountUpdate,
} from "@/services/StocktakingService";
import { useApiError } from "@/hooks/useApiError";

const STOCKTAKINGS_KEY = "stocktakings";
const STOCKTAKING_KEY = "stocktaking";

interface UseStocktakingListOptions {
  pageSize?: number;
  status?: string;
}

export function useStocktakingList({ pageSize = 50, status }: UseStocktakingListOptions = {}) {
  const query = useQuery({
    queryKey: [STOCKTAKINGS_KEY, { pageSize, status }],
    queryFn: () => StocktakingService.list({ pageSize, status }),
  });

  return {
    stocktakings: query.data?.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export function useStocktakingDetail(id: number | null, enabled: boolean) {
  const query = useQuery({
    queryKey: [STOCKTAKING_KEY, id],
    queryFn: () => StocktakingService.getById(id as number),
    enabled: enabled && id != null,
  });

  return {
    stocktaking: query.data?.data,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

export function useStartStocktaking() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { handleApiError } = useApiError();

  const mutation = useMutation({
    mutationFn: (note?: string) => StocktakingService.start(note),
    onSuccess: () => {
      toast.success(t("inventory.stocktaking.started"));
      queryClient.invalidateQueries({ queryKey: [STOCKTAKINGS_KEY] });
    },
    onError: (error) => handleApiError(error),
  });

  return {
    startStocktaking: mutation.mutateAsync,
    isStarting: mutation.isPending,
  };
}

export function useCancelStocktaking() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { handleApiError } = useApiError();

  const mutation = useMutation({
    mutationFn: (id: number) => StocktakingService.cancel(id),
    onSuccess: () => {
      toast.success(t("inventory.stocktaking.cancelled"));
      queryClient.invalidateQueries({ queryKey: [STOCKTAKINGS_KEY] });
    },
    onError: (error) => handleApiError(error),
  });

  return {
    cancelStocktaking: mutation.mutateAsync,
    isCancelling: mutation.isPending,
  };
}

export function useUpdateCounts(stocktakingId: number | null) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { handleApiError } = useApiError();

  const mutation = useMutation({
    mutationFn: ({ id, items }: { id: number; items: StocktakingCountUpdate[] }) =>
      StocktakingService.updateCounts(id, items),
    onSuccess: () => {
      toast.success(t("inventory.stocktaking.saved"));
      queryClient.invalidateQueries({ queryKey: [STOCKTAKING_KEY, stocktakingId] });
    },
    onError: (error) => handleApiError(error),
  });

  return {
    updateCounts: mutation.mutateAsync,
    isUpdating: mutation.isPending,
  };
}

export function useCompleteStocktaking(stocktakingId: number | null) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { handleApiError } = useApiError();

  const mutation = useMutation({
    mutationFn: (id: number) => StocktakingService.complete(id),
    onSuccess: () => {
      toast.success(t("inventory.stocktaking.completed"));
      queryClient.invalidateQueries({ queryKey: [STOCKTAKING_KEY, stocktakingId] });
      queryClient.invalidateQueries({ queryKey: [STOCKTAKINGS_KEY] });
    },
    onError: (error) => handleApiError(error),
  });

  return {
    completeStocktaking: mutation.mutateAsync,
    isCompleting: mutation.isPending,
  };
}
