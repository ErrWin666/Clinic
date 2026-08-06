import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { InvoiceService } from "@/services/InvoiceService";
import type { Invoice } from "@/types/models";
import type { InvoiceCreateData, InvoiceUpdateData } from "@/types/invoice";
import { useApiError } from "@/hooks/useApiError";

const INVOICES_KEY = "invoices";

export function useCreateInvoice() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { handleApiError } = useApiError();

  const mutation = useMutation({
    mutationFn: (data: InvoiceCreateData) => InvoiceService.create(data),
    onSuccess: () => {
      toast.success(t("invoices.created"));
      queryClient.invalidateQueries({ queryKey: [INVOICES_KEY] });
    },
    onError: (error) => handleApiError(error),
  });

  return {
    createInvoice: mutation.mutateAsync,
    isCreating: mutation.isPending,
  };
}

export function useUpdateInvoice() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { handleApiError } = useApiError();

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: InvoiceUpdateData }) =>
      InvoiceService.update(id, data),
    onSuccess: () => {
      toast.success(t("invoices.updated"));
      queryClient.invalidateQueries({ queryKey: [INVOICES_KEY] });
    },
    onError: (error) => handleApiError(error),
  });

  return {
    updateInvoice: mutation.mutateAsync,
    isUpdating: mutation.isPending,
  };
}

export function useChangeInvoiceStatus() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { handleApiError } = useApiError();

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      InvoiceService.changeStatus(id, status),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: [INVOICES_KEY] });
      const previous = queryClient.getQueryData([INVOICES_KEY]);
      queryClient.setQueriesData<{ data: Invoice[] }>(
        { queryKey: [INVOICES_KEY] },
        (old) => {
          if (!old || !Array.isArray(old.data)) return old;
          return {
            ...old,
            data: old.data.map((inv) =>
              inv.id === id ? { ...inv, invoiceStatus: status as Invoice["invoiceStatus"] } : inv
            ),
          };
        }
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData([INVOICES_KEY], context.previous);
      }
      handleApiError(_err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [INVOICES_KEY] });
    },
    onSuccess: () => {
      toast.success(t("invoices.statusChanged"));
    },
  });

  return {
    changeStatus: mutation.mutateAsync,
    isChangingStatus: mutation.isPending,
  };
}

export function useDeleteInvoice() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { handleApiError } = useApiError();

  const mutation = useMutation({
    mutationFn: (id: number) => InvoiceService.delete(id),
    onSuccess: () => {
      toast.success(t("invoices.deleted"));
      queryClient.invalidateQueries({ queryKey: [INVOICES_KEY] });
    },
    onError: (error) => handleApiError(error),
  });

  return {
    deleteInvoice: mutation.mutateAsync,
    isDeleting: mutation.isPending,
  };
}
