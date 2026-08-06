import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  ProductBundleService,
  type ProductBundleListParams,
  type ProductBundleCreateData,
  type ProductBundleUpdateData,
} from "@/services/ProductBundleService";
import type { Pagination } from "@/types/api";
import { useApiError } from "@/hooks/useApiError";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

const BUNDLES_KEY = "product-bundles";

interface UseProductBundlesOptions {
  search: string;
  productId?: number;
  page: number;
  pageSize?: number;
}

export function useProductBundles({ search, productId, page, pageSize = 20 }: UseProductBundlesOptions) {
  const debouncedSearch = useDebouncedValue(search, 300);

  const params: ProductBundleListParams = {
    page,
    pageSize,
    search: debouncedSearch || undefined,
    productId,
  };

  const query = useQuery({
    queryKey: [BUNDLES_KEY, params],
    queryFn: () => ProductBundleService.list(params),
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
  });

  return {
    bundles: query.data?.data ?? [],
    pagination: query.data?.pagination as Pagination | undefined,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useProductBundle(id: number) {
  const query = useQuery({
    queryKey: [BUNDLES_KEY, id],
    queryFn: () => ProductBundleService.getById(id),
    enabled: !!id,
  });

  return {
    bundle: query.data?.data,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export function useCreateProductBundle() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { handleApiError } = useApiError();

  const mutation = useMutation({
    mutationFn: (data: ProductBundleCreateData) => ProductBundleService.create(data),
    onSuccess: () => {
      toast.success(t("inventory.messages.bundleCreated"));
      queryClient.invalidateQueries({ queryKey: [BUNDLES_KEY] });
    },
    onError: (error) => handleApiError(error),
  });

  return {
    createBundle: mutation.mutateAsync,
    isCreating: mutation.isPending,
  };
}

export function useUpdateProductBundle() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { handleApiError } = useApiError();

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProductBundleUpdateData }) =>
      ProductBundleService.update(id, data),
    onSuccess: () => {
      toast.success(t("inventory.messages.bundleUpdated"));
      queryClient.invalidateQueries({ queryKey: [BUNDLES_KEY] });
    },
    onError: (error) => handleApiError(error),
  });

  return {
    updateBundle: mutation.mutateAsync,
    isUpdating: mutation.isPending,
  };
}

export function useDeleteProductBundle() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { handleApiError } = useApiError();

  const mutation = useMutation({
    mutationFn: (id: number) => ProductBundleService.delete(id),
    onSuccess: () => {
      toast.success(t("inventory.messages.bundleDeleted"));
      queryClient.invalidateQueries({ queryKey: [BUNDLES_KEY] });
    },
    onError: (error) => handleApiError(error),
  });

  return {
    deleteBundle: mutation.mutateAsync,
    isDeleting: mutation.isPending,
  };
}

export function useExpandBundle() {
  const { handleApiError } = useApiError();

  const mutation = useMutation({
    mutationFn: ({ id, quantity }: { id: number; quantity?: number }) =>
      ProductBundleService.expand(id, quantity),
    onError: (error) => handleApiError(error),
  });

  return {
    expandBundle: mutation.mutateAsync,
    isExpanding: mutation.isPending,
  };
}
