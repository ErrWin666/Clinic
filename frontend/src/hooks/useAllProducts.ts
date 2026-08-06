import { useQuery } from "@tanstack/react-query";
import { ProductService } from "@/services/ProductService";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { flattenProductVariants, type ProductVariantOption } from "@/lib/productUtils";
import type { Product } from "@/types/models";

const PRODUCTS_ALL_KEY = "products";
const ALL_TAG = "all";

interface UseAllProductsOptions {
  search: string;
  enabled?: boolean;
  pageSize?: number;
}

/**
 * Hook for fetching products without pagination — used by dialogs and pickers
 * (e.g. DamageDialog, AdjustStockDialog, PurchaseOrderForm, InvoiceItemsFieldArray).
 * Returns both the raw products and a flattened list of variant options.
 */
export function useAllProducts({
  search,
  enabled = true,
  pageSize = 100,
}: UseAllProductsOptions) {
  const debouncedSearch = useDebouncedValue(search, 300);

  const query = useQuery({
    queryKey: [PRODUCTS_ALL_KEY, ALL_TAG, { pageSize, search: debouncedSearch }],
    queryFn: () =>
      ProductService.list({
        pageSize,
        search: debouncedSearch || undefined,
      }),
    enabled,
    staleTime: 2 * 60 * 1000,
  });

  const products: Product[] = query.data?.data ?? [];
  const variants: ProductVariantOption[] = flattenProductVariants(products);

  return {
    products,
    variants,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
  };
}
