import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PaymentService, type PaymentCreateData } from "@/services/PaymentService";

export function usePayments(invoiceId: number) {
  return useQuery({
    queryKey: ["payments", invoiceId],
    queryFn: () => PaymentService.list(invoiceId),
  });
}

export function useCreatePayment(invoiceId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PaymentCreateData) => PaymentService.create(invoiceId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments", invoiceId] });
      queryClient.invalidateQueries({ queryKey: ["invoices"], refetchType: "all" });
    },
  });
}

export function useDeletePayment(invoiceId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (paymentId: number) => PaymentService.delete(invoiceId, paymentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments", invoiceId] });
      queryClient.invalidateQueries({ queryKey: ["invoices"], refetchType: "all" });
    },
  });
}
