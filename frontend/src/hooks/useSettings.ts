import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { SettingsService } from "@/services/SettingsService";
import { useApiError } from "@/hooks/useApiError";
import { useAuth } from "@/hooks/useAuth";
import type {
  SettingsUpdateItem,
  AdminUpdateData,
} from "@/types/settings";

const SETTINGS_KEY = "settings";

export function useSettings() {
  return useQuery({
    queryKey: [SETTINGS_KEY],
    queryFn: () => SettingsService.getAll(),
    staleTime: 10 * 60 * 1000,
  });
}

export function useUpdateSettings() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { handleApiError } = useApiError();

  const mutation = useMutation({
    mutationFn: (settings: SettingsUpdateItem[]) =>
      SettingsService.update(settings),
    onSuccess: () => {
      toast.success(t("settings.saved"));
      queryClient.invalidateQueries({ queryKey: [SETTINGS_KEY] });
    },
    onError: (error) => handleApiError(error),
  });

  return {
    updateSettings: mutation.mutateAsync,
    isUpdating: mutation.isPending,
  };
}

export function useUpdateAdmin() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { handleApiError } = useApiError();
  const { user, setUser } = useAuth();

  const mutation = useMutation({
    mutationFn: (data: AdminUpdateData) => SettingsService.updateAdmin(data),
    onSuccess: (response) => {
      toast.success(t("settings.saved"));
      if (user) {
        setUser({ ...user, username: response.data.username });
      }
      queryClient.invalidateQueries({ queryKey: [SETTINGS_KEY] });
    },
    onError: (error) => handleApiError(error),
  });

  return {
    updateAdmin: mutation.mutateAsync,
    isUpdating: mutation.isPending,
  };
}

export function useUploadAdminImage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { handleApiError } = useApiError();
  const { user, setUser } = useAuth();

  const mutation = useMutation({
    mutationFn: (file: File) => SettingsService.uploadAdminImage(file),
    onSuccess: (response) => {
      toast.success(t("settings.saved"));
      if (user) {
        setUser({ ...user, profileImage: response.data.profileImageUrl });
      }
      queryClient.invalidateQueries({ queryKey: [SETTINGS_KEY] });
    },
    onError: (error) => handleApiError(error),
  });

  return {
    uploadAdminImage: mutation.mutateAsync,
    isUploading: mutation.isPending,
  };
}

export function useDeleteAdminImage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { handleApiError } = useApiError();
  const { user, setUser } = useAuth();

  const mutation = useMutation({
    mutationFn: () => SettingsService.deleteAdminImage(),
    onSuccess: () => {
      toast.success(t("settings.saved"));
      if (user) {
        setUser({ ...user, profileImage: null });
      }
      queryClient.invalidateQueries({ queryKey: [SETTINGS_KEY] });
    },
    onError: (error) => handleApiError(error),
  });

  return {
    deleteAdminImage: mutation.mutateAsync,
    isDeleting: mutation.isPending,
  };
}

export function useUploadClinicLogo() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { handleApiError } = useApiError();

  const mutation = useMutation({
    mutationFn: (file: File) => SettingsService.uploadClinicLogo(file),
    onSuccess: () => {
      toast.success(t("settings.saved"));
      queryClient.invalidateQueries({ queryKey: [SETTINGS_KEY] });
    },
    onError: (error) => handleApiError(error),
  });

  return {
    uploadClinicLogo: mutation.mutateAsync,
    isUploading: mutation.isPending,
  };
}

export function useDeleteClinicLogo() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { handleApiError } = useApiError();

  const mutation = useMutation({
    mutationFn: () => SettingsService.deleteClinicLogo(),
    onSuccess: () => {
      toast.success(t("settings.saved"));
      queryClient.invalidateQueries({ queryKey: [SETTINGS_KEY] });
    },
    onError: (error) => handleApiError(error),
  });

  return {
    deleteClinicLogo: mutation.mutateAsync,
    isDeleting: mutation.isPending,
  };
}
