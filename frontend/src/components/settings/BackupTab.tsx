import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BackupScheduleCard } from "@/components/settings/BackupScheduleCard";
import { BackupHistoryCard } from "@/components/settings/BackupHistoryCard";
import { useBackupHistory, useCreateBackup, useRestoreBackup, useBackupSchedule, useUpdateBackupSchedule } from "@/hooks/useBackup";
import { useDiskSpace } from "@/hooks/useSystem";
import { formatFileSize } from "@/lib/fileUtils";
import { RotateCcwIcon } from "lucide-react";

export function BackupTab() {
  const { t } = useTranslation();
  const { data: historyData, isLoading, isError, refetch } = useBackupHistory();
  const { createBackup, isCreating } = useCreateBackup();
  const { restoreBackup, isRestoring } = useRestoreBackup();
  const { diskSpace: diskData } = useDiskSpace();
  const { data: scheduleData } = useBackupSchedule();
  const { updateSchedule, isUpdating: isScheduleUpdating } = useUpdateBackupSchedule();

  const [restoreFilename, setRestoreFilename] = useState<string | null>(null);
  const [scheduleEnabled, setScheduleEnabled] = useState(true);
  const [scheduleHour, setScheduleHour] = useState(2);
  const [scheduleMinute, setScheduleMinute] = useState(0);
  const scheduleRef = useRef(scheduleData);

  useEffect(() => {
    if (scheduleRef.current === scheduleData) return;
    scheduleRef.current = scheduleData;
    const schedule = scheduleData?.data;
    if (schedule) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setScheduleEnabled(schedule.enabled);
      setScheduleHour(schedule.hour);
      setScheduleMinute(schedule.minute);
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [scheduleData]);

  const handleSaveSchedule = async () => {
    await updateSchedule({
      enabled: scheduleEnabled,
      hour: scheduleHour,
      minute: scheduleMinute,
    });
  };

  const backups = historyData?.data ?? [];
  const disk = diskData;

  const diskColor =
    disk?.status === "critical"
      ? "text-red-600"
      : disk?.status === "warning"
        ? "text-yellow-600"
        : "text-green-600";

  const handleRestore = async () => {
    if (!restoreFilename) return;
    await restoreBackup(restoreFilename);
    setRestoreFilename(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <BackupScheduleCard
        scheduleEnabled={scheduleEnabled}
        scheduleHour={scheduleHour}
        scheduleMinute={scheduleMinute}
        isScheduleUpdating={isScheduleUpdating}
        onEnabledChange={setScheduleEnabled}
        onHourChange={setScheduleHour}
        onMinuteChange={setScheduleMinute}
        onSave={handleSaveSchedule}
      />

      {disk && (
        <Card className="shadow-card border-border/60">
          <CardHeader>
            <CardTitle className="text-lg">{t("backup.diskSpace")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Progress value={disk.usedPercentage} />
            <div className="flex items-center justify-between text-sm">
              <span className={diskColor}>
                {disk.usedPercentage}% {t("backup.diskSpace")}
              </span>
              <span className="text-muted-foreground">
                {formatFileSize(disk.used)} / {formatFileSize(disk.total)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <BackupHistoryCard
        backups={backups}
        isLoading={isLoading}
        isError={isError}
        isCreating={isCreating}
        isRestoring={isRestoring}
        onCreate={() => createBackup()}
        onRetry={() => refetch()}
        onRestore={setRestoreFilename}
      />

      <AlertDialog
        open={!!restoreFilename}
        onOpenChange={(v) => !v && setRestoreFilename(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive ring-1 ring-destructive/20">
              <RotateCcwIcon className="size-6" />
            </AlertDialogMedia>
            <AlertDialogTitle>{t("backup.restore")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("backup.restoreConfirm")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRestoring}>
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleRestore}
              disabled={isRestoring}
            >
              {isRestoring && <Spinner className="size-4" />}
              {t("backup.restore")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
