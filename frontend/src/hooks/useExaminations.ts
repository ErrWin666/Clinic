import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  ExaminationService,
  type ExaminationListParams,
  type ExaminationCreateData,
  type ExaminationUpdateData,
} from "@/services/ExaminationService";
import type { Pagination } from "@/types/api";
import { useApiError } from "@/hooks/useApiError";

interface UseExaminationsOptions {
  patientId: number;
  page?: number;
  pageSize?: number;
  examStatus?: string;
}

export function useExaminations({
  patientId,
  page = 1,
  pageSize = 20,
  examStatus,
}: UseExaminationsOptions) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { handleApiError } = useApiError();

  const params: ExaminationListParams = {
    page,
    pageSize,
    examStatus: examStatus || undefined,
  };

  const query = useQuery({
    queryKey: ["examinations", patientId, params],
    queryFn: () => ExaminationService.listByPatient(patientId, params),
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
    enabled: !!patientId,
  });

  const examinations = query.data?.data ?? [];
  const pagination: Pagination | undefined = query.data?.pagination;

  const createMutation = useMutation({
    mutationFn: ({ patientId, data }: { patientId: number; data: ExaminationCreateData }) =>
      ExaminationService.create(patientId, data),
    onSuccess: () => {
      toast.success(t("examinations.created"));
      queryClient.invalidateQueries({ queryKey: ["examinations", patientId] });
    },
    onError: (error) => handleApiError(error),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ExaminationUpdateData }) =>
      ExaminationService.update(id, data),
    onSuccess: () => {
      toast.success(t("examinations.updated"));
      queryClient.invalidateQueries({ queryKey: ["examinations", patientId] });
    },
    onError: (error) => handleApiError(error),
  });

  const followUpMutation = useMutation({
    mutationFn: (id: number) => ExaminationService.createFollowUp(id),
    onSuccess: () => {
      toast.success(t("examinations.followUpCreated"));
      queryClient.invalidateQueries({ queryKey: ["examinations", patientId] });
    },
    onError: (error) => handleApiError(error),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => ExaminationService.delete(id),
    onSuccess: () => {
      toast.success(t("examinations.deleted"));
      queryClient.invalidateQueries({ queryKey: ["examinations", patientId] });
    },
    onError: (error) => handleApiError(error),
  });

  return {
    examinations,
    pagination,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    refetch: query.refetch,
    createExam: createMutation.mutateAsync,
    updateExam: updateMutation.mutateAsync,
    followUp: followUpMutation.mutateAsync,
    deleteExam: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isFollowingUp: followUpMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export function useExaminationsSimple(patientId: number | null) {
  return useQuery({
    queryKey: ["examinations-simple", patientId],
    queryFn: () => ExaminationService.listByPatientSimple(patientId!),
    staleTime: 2 * 60 * 1000,
    enabled: !!patientId,
  });
}
