import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  ProductService,
  type ProductListParams,
  type ProductCreateData,
  type ProductUpdateData,
  type VariantCreateData,
  type VariantUpdateData,
} from "@/services/ProductService";
import type { ProductCategory } from "@/types/enums";
import type { Pagination } from "@/types/api";
import { useApiError } from "@/hooks/useApiError";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

const PRODUCTS_KEY = "products";

interface UseProductsOptions {
  search: string;
  category: string;
  page: number;
  pageSize?: number;
}

export function useProducts({ search, category, page, pageSize = 20 }: UseProductsOptions) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { handleApiError } = useApiError();

  const debouncedSearch = useDebouncedValue(search, 300);

  const params: ProductListParams = {
    page,
    pageSize,
    search: debouncedSearch || undefined,
    category: (category || undefined) as ProductCategory | undefined,
  };

  const query = useQuery({
    queryKey: [PRODUCTS_KEY, params],
    queryFn: () => ProductService.list(params),
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
  });

  const products = query.data?.data ?? [];
  const pagination: Pagination | undefined = query.data?.pagination;

  const createMutation = useMutation({
    mutationFn: (data: ProductCreateData) => ProductService.create(data),
    onSuccess: () => {
      toast.success(t("inventory.messages.created"));
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY] });
    },
    onError: (error) => handleApiError(error),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProductUpdateData }) => ProductService.update(id, data),
    onSuccess: () => {
      toast.success(t("inventory.messages.updated"));
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY] });
    },
    onError: (error) => handleApiError(error),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => ProductService.delete(id),
    onSuccess: () => {
      toast.success(t("inventory.messages.deleted"));
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY] });
    },
    onError: (error) => handleApiError(error),
  });

  return {
    products,
    pagination,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    createProduct: createMutation.mutateAsync,
    updateProduct: updateMutation.mutateAsync,
    deleteProduct: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export function useProduct(id: number) {
  const query = useQuery({
    queryKey: [PRODUCTS_KEY, id],
    queryFn: () => ProductService.getById(id),
    enabled: !!id,
  });

  return {
    product: query.data?.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useProductVariants(productId: number) {
  const { handleApiError } = useApiError();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const query = useQuery({
    queryKey: [PRODUCTS_KEY, productId, "variants"],
    queryFn: () => ProductService.listVariants(productId),
    enabled: !!productId,
  });

  const createVariantMutation = useMutation({
    mutationFn: (data: VariantCreateData) => ProductService.createVariant(productId, data),
    onSuccess: () => {
      toast.success(t("inventory.messages.variantCreated"));
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY, productId, "variants"] });
    },
    onError: (error) => handleApiError(error),
  });

  const updateVariantMutation = useMutation({
    mutationFn: ({ variantId, data }: { variantId: number; data: VariantUpdateData }) =>
      ProductService.updateVariant(productId, variantId, data),
    onSuccess: () => {
      toast.success(t("inventory.messages.variantUpdated"));
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY, productId, "variants"] });
    },
    onError: (error) => handleApiError(error),
  });

  const deleteVariantMutation = useMutation({
    mutationFn: (variantId: number) => ProductService.deleteVariant(productId, variantId),
    onSuccess: () => {
      toast.success(t("inventory.messages.variantDeleted"));
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY, productId, "variants"] });
    },
    onError: (error) => handleApiError(error),
  });

  return {
    variants: query.data?.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    createVariant: createVariantMutation.mutateAsync,
    updateVariant: updateVariantMutation.mutateAsync,
    deleteVariant: deleteVariantMutation.mutateAsync,
    isCreatingVariant: createVariantMutation.isPending,
    isUpdatingVariant: updateVariantMutation.isPending,
    isDeletingVariant: deleteVariantMutation.isPending,
  };
}
