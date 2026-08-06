import {
  useQuery,
  keepPreviousData,
} from "@tanstack/react-query";
import {
  InvoiceService,
  type InvoiceListParams,
} from "@/services/InvoiceService";
import type { Pagination } from "@/types/api";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

const INVOICES_KEY = "invoices";

interface UseInvoicesOptions {
  search: string;
  status: string;
  startDate: string;
  endDate: string;
  minAmount: string;
  maxAmount: string;
  page: number;
  pageSize?: number;
  invoiceType?: "patient" | "customer";
}

export function useInvoices({
  search,
  status,
  startDate,
  endDate,
  minAmount,
  maxAmount,
  page,
  pageSize = 20,
  invoiceType,
}: UseInvoicesOptions) {
  const debouncedSearch = useDebouncedValue(search, 300);

  const params: InvoiceListParams = {
    page,
    pageSize,
    search: debouncedSearch || undefined,
    status: status || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    minAmount: minAmount ? Number(minAmount) : undefined,
    maxAmount: maxAmount ? Number(maxAmount) : undefined,
    invoiceType: invoiceType || undefined,
  };

  const query = useQuery({
    queryKey: [INVOICES_KEY, params],
    queryFn: () => InvoiceService.list(params),
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
  });

  const invoices = query.data?.data ?? [];
  const pagination: Pagination | undefined = query.data?.pagination;

  return {
    invoices,
    pagination,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

interface UseInvoiceStatsOptions {
  search: string;
  status: string;
  startDate: string;
  endDate: string;
  minAmount: string;
  maxAmount: string;
  invoiceType?: "patient" | "customer";
}

export function useInvoiceStats(params: UseInvoiceStatsOptions) {
  const debouncedSearch = useDebouncedValue(params.search, 300);

  const statsParams = {
    search: debouncedSearch || undefined,
    status: params.status || undefined,
    startDate: params.startDate || undefined,
    endDate: params.endDate || undefined,
    minAmount: params.minAmount ? Number(params.minAmount) : undefined,
    maxAmount: params.maxAmount ? Number(params.maxAmount) : undefined,
    invoiceType: params.invoiceType || undefined,
  };

  return useQuery({
    queryKey: [INVOICES_KEY, "stats", statsParams],
    queryFn: () => InvoiceService.getStats(statsParams),
    staleTime: 2 * 60 * 1000,
  });
}

export function useInvoiceDetail(invoiceId?: number, enabled = true) {
  return useQuery({
    queryKey: [INVOICES_KEY, "detail", invoiceId],
    queryFn: () => InvoiceService.getById(invoiceId!),
    enabled: enabled && !!invoiceId,
    staleTime: 60 * 1000,
  });
}
