import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  PatientService,
  type PatientListParams,
  type PatientCreateData,
  type PatientUpdateData,
} from "@/services/PatientService";
import type { Patient } from "@/types/models";
import type { Pagination } from "@/types/api";
import { useApiError } from "@/hooks/useApiError";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

const PATIENTS_KEY = "patients";

interface UsePatientsOptions {
  search: string;
  patientType: string;
  gender: string;
  page: number;
  pageSize?: number;
}

export function usePatients({
  search,
  patientType,
  gender,
  page,
  pageSize = 20,
}: UsePatientsOptions) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { handleApiError } = useApiError();

  const debouncedSearch = useDebouncedValue(search, 300);

  const params: PatientListParams = {
    page,
    pageSize,
    search: debouncedSearch || undefined,
    patientType: patientType || undefined,
    gender: gender || undefined,
  };

  const query = useQuery({
    queryKey: [PATIENTS_KEY, params],
    queryFn: () => PatientService.list(params),
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
  });

  const patients = query.data?.data ?? [];
  const pagination: Pagination | undefined = query.data?.pagination;

  const createMutation = useMutation({
    mutationFn: (data: PatientCreateData) => PatientService.create(data),
    onSuccess: () => {
      toast.success(t("patients.created"));
      queryClient.invalidateQueries({ queryKey: [PATIENTS_KEY] });
    },
    onError: (error) => handleApiError(error),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: PatientUpdateData }) =>
      PatientService.update(id, data),
    onSuccess: () => {
      toast.success(t("patients.updated"));
      queryClient.invalidateQueries({ queryKey: [PATIENTS_KEY] });
    },
    onError: (error) => handleApiError(error),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => PatientService.delete(id),
    onSuccess: () => {
      toast.success(t("patients.deleted"));
      queryClient.invalidateQueries({ queryKey: [PATIENTS_KEY] });
    },
    onError: (error) => handleApiError(error),
  });

  return {
    patients,
    pagination,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    createPatient: createMutation.mutateAsync,
    updatePatient: updateMutation.mutateAsync,
    deletePatient: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export type { Patient };

export function usePatient(patientId?: number | null, enabled = true) {
  return useQuery({
    queryKey: [PATIENTS_KEY, patientId],
    queryFn: () => PatientService.getById(patientId!),
    enabled: enabled && !!patientId,
    staleTime: 5 * 60 * 1000,
  });
}
