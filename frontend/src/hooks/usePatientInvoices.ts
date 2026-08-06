import {
  useQuery,
  keepPreviousData,
} from "@tanstack/react-query";
import {
  InvoiceService,
  type InvoiceListParams,
} from "@/services/InvoiceService";
import type { Pagination } from "@/types/api";

interface UsePatientInvoicesOptions {
  patientId: number;
  page?: number;
  pageSize?: number;
}

export function usePatientInvoices({
  patientId,
  page = 1,
  pageSize = 10,
}: UsePatientInvoicesOptions) {
  const params: InvoiceListParams = {
    page,
    pageSize,
    patientId,
  };

  const query = useQuery({
    queryKey: ["invoices", "patient", patientId, params],
    queryFn: () => InvoiceService.list(params),
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
    enabled: !!patientId,
  });

  const invoices = query.data?.data ?? [];
  const pagination: Pagination | undefined = query.data?.pagination;

  return {
    invoices,
    pagination,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    refetch: query.refetch,
  };
}
