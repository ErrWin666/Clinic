import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { BackupService } from "@/services/BackupService";
import { useApiError } from "@/hooks/useApiError";
import type { BackupSchedule } from "@/types/settings";

const BACKUP_KEY = "backup-history";
const BACKUP_SCHEDULE_KEY = "backup-schedule";

export function useBackupHistory() {
  return useQuery({
    queryKey: [BACKUP_KEY],
    queryFn: () => BackupService.history(),
  });
}

export function useCreateBackup() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { handleApiError } = useApiError();

  const mutation = useMutation({
    mutationFn: () => BackupService.create(),
    onSuccess: () => {
      toast.success(t("backup.created"));
      queryClient.invalidateQueries({ queryKey: [BACKUP_KEY] });
    },
    onError: (error) => handleApiError(error),
  });

  return {
    createBackup: mutation.mutateAsync,
    isCreating: mutation.isPending,
  };
}

export function useRestoreBackup() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { handleApiError } = useApiError();

  const mutation = useMutation({
    mutationFn: (filename: string) => BackupService.restore(filename),
    onSuccess: () => {
      toast.success(t("backup.restored"));
      queryClient.invalidateQueries({ queryKey: [BACKUP_KEY] });
    },
    onError: (error) => handleApiError(error),
  });

  return {
    restoreBackup: mutation.mutateAsync,
    isRestoring: mutation.isPending,
  };
}

export function useBackupSchedule() {
  return useQuery({
    queryKey: [BACKUP_SCHEDULE_KEY],
    queryFn: () => BackupService.getSchedule(),
  });
}

export function useUpdateBackupSchedule() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { handleApiError } = useApiError();

  const mutation = useMutation({
    mutationFn: (payload: BackupSchedule) => BackupService.updateSchedule(payload),
    onSuccess: () => {
      toast.success(t("backup.schedule.saved"));
      queryClient.invalidateQueries({ queryKey: [BACKUP_SCHEDULE_KEY] });
    },
    onError: (error) => handleApiError(error),
  });

  return {
    updateSchedule: mutation.mutateAsync,
    isUpdating: mutation.isPending,
  };
}
