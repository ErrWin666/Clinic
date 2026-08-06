import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  SupplierService,
  type SupplierListParams,
  type SupplierCreateData,
  type SupplierUpdateData,
  type SupplierPaymentCreateData,
  type StatementParams,
} from "@/services/SupplierService";
import type { Pagination } from "@/types/api";
import { useApiError } from "@/hooks/useApiError";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

const SUPPLIERS_KEY = "suppliers";

interface UseSuppliersOptions {
  search: string;
  page: number;
  pageSize?: number;
}

export function useSuppliers({ search, page, pageSize = 20 }: UseSuppliersOptions) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { handleApiError } = useApiError();

  const debouncedSearch = useDebouncedValue(search, 300);

  const params: SupplierListParams = {
    page,
    pageSize,
    search: debouncedSearch || undefined,
  };

  const query = useQuery({
    queryKey: [SUPPLIERS_KEY, params],
    queryFn: () => SupplierService.list(params),
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
  });

  const suppliers = query.data?.data ?? [];
  const pagination: Pagination | undefined = query.data?.pagination;

  const createMutation = useMutation({
    mutationFn: (data: SupplierCreateData) => SupplierService.create(data),
    onSuccess: () => {
      toast.success(t("suppliers.created"));
      queryClient.invalidateQueries({ queryKey: [SUPPLIERS_KEY] });
    },
    onError: (error) => handleApiError(error),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: SupplierUpdateData }) => SupplierService.update(id, data),
    onSuccess: () => {
      toast.success(t("suppliers.updated"));
      queryClient.invalidateQueries({ queryKey: [SUPPLIERS_KEY] });
    },
    onError: (error) => handleApiError(error),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => SupplierService.delete(id),
    onSuccess: () => {
      toast.success(t("suppliers.deleted"));
      queryClient.invalidateQueries({ queryKey: [SUPPLIERS_KEY] });
    },
    onError: (error) => handleApiError(error),
  });

  return {
    suppliers,
    pagination,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    createSupplier: createMutation.mutateAsync,
    updateSupplier: updateMutation.mutateAsync,
    deleteSupplier: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export function useSupplier(id: number) {
  const query = useQuery({
    queryKey: [SUPPLIERS_KEY, id],
    queryFn: () => SupplierService.getById(id),
    enabled: !!id,
  });

  return {
    supplier: query.data?.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useSupplierStatement(id: number, params?: StatementParams) {
  const query = useQuery({
    queryKey: [SUPPLIERS_KEY, id, "statement", params],
    queryFn: () => SupplierService.getStatement(id, params),
    enabled: !!id,
  });

  return {
    statement: query.data?.data,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export function useSupplierPayments(supplierId: number) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { handleApiError } = useApiError();

  const query = useQuery({
    queryKey: [SUPPLIERS_KEY, supplierId, "payments"],
    queryFn: () => SupplierService.listPayments(supplierId),
    enabled: !!supplierId,
  });

  const createPaymentMutation = useMutation({
    mutationFn: (data: SupplierPaymentCreateData) => SupplierService.createPayment(supplierId, data),
    onSuccess: () => {
      toast.success(t("suppliers.paymentCreated"));
      queryClient.invalidateQueries({ queryKey: [SUPPLIERS_KEY, supplierId] });
      queryClient.invalidateQueries({ queryKey: [SUPPLIERS_KEY, supplierId, "payments"] });
      queryClient.invalidateQueries({ queryKey: [SUPPLIERS_KEY, supplierId, "statement"] });
    },
    onError: (error) => handleApiError(error),
  });

  return {
    payments: query.data?.data ?? [],
    isLoading: query.isLoading,
    createPayment: createPaymentMutation.mutateAsync,
    isCreatingPayment: createPaymentMutation.isPending,
  };
}
