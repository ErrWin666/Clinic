import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import {
  Field,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClockIcon, CalendarClockIcon, CheckCircle2Icon, XCircleIcon } from "lucide-react";

interface BackupScheduleCardProps {
  scheduleEnabled: boolean;
  scheduleHour: number;
  scheduleMinute: number;
  isScheduleUpdating: boolean;
  onEnabledChange: (v: boolean) => void;
  onHourChange: (v: number) => void;
  onMinuteChange: (v: number) => void;
  onSave: () => void;
}

export function BackupScheduleCard({
  scheduleEnabled,
  scheduleHour,
  scheduleMinute,
  isScheduleUpdating,
  onEnabledChange,
  onHourChange,
  onMinuteChange,
  onSave,
}: BackupScheduleCardProps) {
  const { t } = useTranslation();

  const formattedTime = useMemo(() => {
    return `${String(scheduleHour).padStart(2, "0")}:${String(scheduleMinute).padStart(2, "0")}`;
  }, [scheduleHour, scheduleMinute]);

  const nextBackupDate = useMemo(() => {
    if (!scheduleEnabled) return null;
    const now = dayjs();
    let next = now.hour(scheduleHour).minute(scheduleMinute).second(0);
    if (next.isBefore(now) || next.isSame(now)) {
      next = next.add(1, "day");
    }
    return next;
  }, [scheduleEnabled, scheduleHour, scheduleMinute]);

  const hourOptions = Array.from({ length: 24 }, (_, h) => h);
  const minuteOptions = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  return (
    <Card className="shadow-card border-border/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ClockIcon className="size-5" />
          {t("backup.schedule.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <div className="flex items-center gap-3">
            {scheduleEnabled ? (
              <CheckCircle2Icon className="size-5 text-green-500" />
            ) : (
              <XCircleIcon className="size-5 text-muted-foreground" />
            )}
            <div className="flex flex-col">
              <FieldLabel htmlFor="backup-enabled" className="text-sm font-medium">
                {t("backup.schedule.enabled")}
              </FieldLabel>
              <FieldDescription className="text-xs">
                {scheduleEnabled
                  ? t("backup.schedule.statusEnabled")
                  : t("backup.schedule.statusDisabled")}
              </FieldDescription>
            </div>
          </div>
          <Switch
            id="backup-enabled"
            checked={scheduleEnabled}
            onCheckedChange={onEnabledChange}
          />
        </div>

        <Field>
          <FieldLabel className="text-sm font-medium">
            {t("backup.schedule.time")}
          </FieldLabel>
          <div className="flex items-center gap-2">
            <Select
              value={String(scheduleHour)}
              onValueChange={(v) => onHourChange(Number(v))}
              disabled={!scheduleEnabled}
            >
              <SelectTrigger className="w-20" size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {hourOptions.map((h) => (
                  <SelectItem key={h} value={String(h)}>
                    {String(h).padStart(2, "0")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-lg font-bold text-muted-foreground">:</span>
            <Select
              value={String(scheduleMinute)}
              onValueChange={(v) => onMinuteChange(Number(v))}
              disabled={!scheduleEnabled}
            >
              <SelectTrigger className="w-20" size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {minuteOptions.map((m) => (
                  <SelectItem key={m} value={String(m)}>
                    {String(m).padStart(2, "0")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="ms-2 text-2xl font-bold tabular-nums tracking-tight">
              {formattedTime}
            </span>
          </div>
        </Field>

        {scheduleEnabled && nextBackupDate && (
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3 text-sm">
            <CalendarClockIcon className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {t("backup.schedule.nextBackup")}:
            </span>
            <span className="font-medium">
              {nextBackupDate.format("YYYY-MM-DD HH:mm")}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{t("backup.schedule.applyNote")}</p>
          <Button onClick={onSave} disabled={isScheduleUpdating} size="sm">
            {isScheduleUpdating && <Spinner className="size-4" />}
            {t("backup.schedule.save")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
