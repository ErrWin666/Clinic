import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { SetupService, type CreateAdminData } from "@/services/SetupService";
import { useApiError } from "@/hooks/useApiError";

export function useCreateAdmin() {
  const { t } = useTranslation();
  const { handleApiError } = useApiError();

  const mutation = useMutation({
    mutationFn: (data: CreateAdminData) => SetupService.createAdmin(data),
    onSuccess: () => {
      toast.success(t("setup.created"));
    },
    onError: (error) => handleApiError(error),
  });

  return {
    createAdmin: mutation.mutateAsync,
    isCreating: mutation.isPending,
    error: mutation.error,
  };
}
