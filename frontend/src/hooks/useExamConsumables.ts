import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  ExamConsumableService,
  type ExamConsumableListParams,
  type ExamConsumableCreateData,
  type ExamConsumableUpdateData,
} from "@/services/ExamConsumableService";
import type { Pagination } from "@/types/api";
import { useApiError } from "@/hooks/useApiError";

const EXAM_CONSUMABLES_KEY = "exam-consumables";

interface UseExamConsumablesOptions {
  examType?: string;
  isActive?: boolean;
  page: number;
  pageSize?: number;
}

export function useExamConsumables({
  examType,
  isActive,
  page,
  pageSize = 20,
}: UseExamConsumablesOptions) {
  const params: ExamConsumableListParams = {
    page,
    pageSize,
    examType,
    isActive,
  };

  const query = useQuery({
    queryKey: [EXAM_CONSUMABLES_KEY, params],
    queryFn: () => ExamConsumableService.list(params),
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
  });

  return {
    rules: query.data?.data ?? [],
    pagination: query.data?.pagination as Pagination | undefined,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useCreateExamConsumable() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { handleApiError } = useApiError();

  const mutation = useMutation({
    mutationFn: (data: ExamConsumableCreateData) => ExamConsumableService.create(data),
    onSuccess: () => {
      toast.success(t("inventory.messages.consumableRuleCreated"));
      queryClient.invalidateQueries({ queryKey: [EXAM_CONSUMABLES_KEY] });
    },
    onError: (error) => handleApiError(error),
  });

  return {
    createRule: mutation.mutateAsync,
    isCreating: mutation.isPending,
  };
}

export function useUpdateExamConsumable() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { handleApiError } = useApiError();

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ExamConsumableUpdateData }) =>
      ExamConsumableService.update(id, data),
    onSuccess: () => {
      toast.success(t("inventory.messages.consumableRuleUpdated"));
      queryClient.invalidateQueries({ queryKey: [EXAM_CONSUMABLES_KEY] });
    },
    onError: (error) => handleApiError(error),
  });

  return {
    updateRule: mutation.mutateAsync,
    isUpdating: mutation.isPending,
  };
}

export function useDeleteExamConsumable() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { handleApiError } = useApiError();

  const mutation = useMutation({
    mutationFn: (id: number) => ExamConsumableService.delete(id),
    onSuccess: () => {
      toast.success(t("inventory.messages.consumableRuleDeleted"));
      queryClient.invalidateQueries({ queryKey: [EXAM_CONSUMABLES_KEY] });
    },
    onError: (error) => handleApiError(error),
  });

  return {
    deleteRule: mutation.mutateAsync,
    isDeleting: mutation.isPending,
  };
}
