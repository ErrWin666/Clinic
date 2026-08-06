import { useQuery } from "@tanstack/react-query";
import { SupplierService } from "@/services/SupplierService";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { Supplier } from "@/types/models";

const SUPPLIERS_KEY = "suppliers";

export interface SupplierOption {
  id: number;
  displayId: string;
  name: string;
  phone: string;
}

export function useSupplierAutocomplete(search: string, enabled = true) {
  const debouncedSearch = useDebouncedValue(search, 300);

  const query = useQuery({
    queryKey: [SUPPLIERS_KEY, "autocomplete", debouncedSearch],
    queryFn: () => SupplierService.list({ pageSize: 50, search: debouncedSearch || undefined }),
    enabled,
    staleTime: 30 * 1000,
  });

  const suppliers: Supplier[] = query.data?.data ?? [];
  const results: SupplierOption[] = suppliers.map((s) => ({
    id: s.id,
    displayId: s.displayId,
    name: s.name,
    phone: s.phone ?? "",
  }));

  return {
    results,
    suppliers,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
  };
}

export function useSupplierById(id: number | null | undefined, enabled = true) {
  const query = useQuery({
    queryKey: [SUPPLIERS_KEY, id],
    queryFn: () => SupplierService.list({ pageSize: 100 }),
    enabled: enabled && id != null,
    staleTime: 5 * 60 * 1000,
    select: (data) => {
      const suppliers = data.data ?? [];
      return suppliers.find((s) => s.id === id) ?? null;
    },
  });

  return {
    supplier: query.data,
    isLoading: query.isLoading,
  };
}
