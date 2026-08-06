import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  PurchaseOrderService,
  type PurchaseOrderListParams,
  type PurchaseOrderCreateData,
  type PurchaseOrderUpdateData,
  type ReceivePurchaseOrderData,
} from "@/services/PurchaseOrderService";
import type { Pagination } from "@/types/api";
import { useApiError } from "@/hooks/useApiError";

const PO_KEY = "purchase-orders";

interface UsePurchaseOrdersOptions {
  supplierId?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
  page: number;
  pageSize?: number;
}

export function usePurchaseOrders({
  supplierId,
  status,
  startDate,
  endDate,
  page,
  pageSize = 20,
}: UsePurchaseOrdersOptions) {
  const params: PurchaseOrderListParams = {
    page,
    pageSize,
    supplierId,
    status: status as PurchaseOrderListParams["status"],
    startDate,
    endDate,
  };

  const query = useQuery({
    queryKey: [PO_KEY, params],
    queryFn: () => PurchaseOrderService.list(params),
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
  });

  return {
    purchaseOrders: query.data?.data ?? [],
    pagination: query.data?.pagination as Pagination | undefined,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export function usePurchaseOrder(id: number) {
  const query = useQuery({
    queryKey: [PO_KEY, id],
    queryFn: () => PurchaseOrderService.getById(id),
    enabled: !!id,
  });

  return {
    purchaseOrder: query.data?.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useCreatePurchaseOrder() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { handleApiError } = useApiError();

  const mutation = useMutation({
    mutationFn: (data: PurchaseOrderCreateData) => PurchaseOrderService.create(data),
    onSuccess: () => {
      toast.success(t("purchaseOrders.created"));
      queryClient.invalidateQueries({ queryKey: [PO_KEY] });
    },
    onError: (error) => handleApiError(error),
  });

  return {
    createPurchaseOrder: mutation.mutateAsync,
    isCreating: mutation.isPending,
  };
}

export function useUpdatePurchaseOrder() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { handleApiError } = useApiError();

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: PurchaseOrderUpdateData }) =>
      PurchaseOrderService.update(id, data),
    onSuccess: () => {
      toast.success(t("purchaseOrders.updated"));
      queryClient.invalidateQueries({ queryKey: [PO_KEY] });
    },
    onError: (error) => handleApiError(error),
  });

  return {
    updatePurchaseOrder: mutation.mutateAsync,
    isUpdating: mutation.isPending,
  };
}

export function useReceivePurchaseOrder() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { handleApiError } = useApiError();

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ReceivePurchaseOrderData }) =>
      PurchaseOrderService.receive(id, data),
    onSuccess: () => {
      toast.success(t("purchaseOrders.received"));
      queryClient.invalidateQueries({ queryKey: [PO_KEY] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
    onError: (error) => handleApiError(error),
  });

  return {
    receivePurchaseOrder: mutation.mutateAsync,
    isReceiving: mutation.isPending,
  };
}

export function useCancelPurchaseOrder() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { handleApiError } = useApiError();

  const mutation = useMutation({
    mutationFn: (id: number) => PurchaseOrderService.cancel(id),
    onSuccess: () => {
      toast.success(t("purchaseOrders.cancelled"));
      queryClient.invalidateQueries({ queryKey: [PO_KEY] });
    },
    onError: (error) => handleApiError(error),
  });

  return {
    cancelPurchaseOrder: mutation.mutateAsync,
    isCancelling: mutation.isPending,
  };
}
