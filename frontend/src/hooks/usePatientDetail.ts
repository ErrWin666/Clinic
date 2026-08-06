import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { PatientService } from "@/services/PatientService";
import { useApiError } from "@/hooks/useApiError";

export function usePatientDetail(id: number) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { handleApiError } = useApiError();

  const query = useQuery({
    queryKey: ["patient", id],
    queryFn: () => PatientService.getById(id),
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
  });

  const patient = query.data?.data;

  const uploadImageMutation = useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) =>
      PatientService.uploadProfileImage(id, file),
    onSuccess: () => {
      toast.success(t("patientProfile.imageUploaded"));
      queryClient.invalidateQueries({ queryKey: ["patient", id] });
    },
    onError: (error) => handleApiError(error),
  });

  const deleteImageMutation = useMutation({
    mutationFn: (id: number) => PatientService.deleteProfileImage(id),
    onSuccess: () => {
      toast.success(t("patientProfile.imageRemoved"));
      queryClient.invalidateQueries({ queryKey: ["patient", id] });
    },
    onError: (error) => handleApiError(error),
  });

  return {
    patient,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    uploadImage: uploadImageMutation.mutateAsync,
    deleteImage: deleteImageMutation.mutateAsync,
    isUploadingImage: uploadImageMutation.isPending,
  };
}
