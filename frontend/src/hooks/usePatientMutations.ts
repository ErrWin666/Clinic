import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  PatientService,
  type PatientUpdateData,
} from "@/services/PatientService";
import { useApiError } from "@/hooks/useApiError";

const PATIENTS_KEY = "patients";
const PATIENT_KEY = "patient";

/**
 * Standalone mutation hook for updating a patient (without the list query).
 * Used by components like NotesTab and OverviewTab that only need the mutation.
 */
export function useUpdatePatient() {
  const queryClient = useQueryClient();
  const { handleApiError } = useApiError();

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: PatientUpdateData }) =>
      PatientService.update(id, data),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: [PATIENTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [PATIENT_KEY, id] });
    },
    onError: (error) => handleApiError(error),
  });

  return {
    updatePatient: mutation.mutateAsync,
    isUpdating: mutation.isPending,
  };
}

export function useDeletePatient() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { handleApiError } = useApiError();

  const mutation = useMutation({
    mutationFn: (id: number) => PatientService.delete(id),
    onSuccess: () => {
      toast.success(t("patients.deleted"));
      queryClient.invalidateQueries({ queryKey: [PATIENTS_KEY] });
    },
    onError: (error) => handleApiError(error),
  });

  return {
    deletePatient: mutation.mutateAsync,
    isDeleting: mutation.isPending,
  };
}

export function useSendTelegramInvite() {
  const { handleApiError } = useApiError();

  const mutation = useMutation({
    mutationFn: (id: number) => PatientService.sendTelegramInvite(id),
    onSuccess: (res) => {
      const inviteLink = res.data?.inviteLink;
      if (inviteLink) {
        toast.success(inviteLink);
      }
    },
    onError: (error) => handleApiError(error),
  });

  return {
    sendTelegramInvite: mutation.mutateAsync,
    isSending: mutation.isPending,
  };
}
