import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { CalendarClockIcon, HardDriveIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
  FieldDescription,
} from "@/components/ui/field";
import { FormSection } from "@/components/common/FormSection";
import { useSettings, useUpdateSettings } from "@/hooks/useSettings";
import type { SettingsUpdateItem } from "@/types/settings";
import { translateZodError } from "@/lib/zodError";
import { ReminderSettingsPanel } from "./ReminderSettingsPanel";
import { MessageTemplatesPanel } from "./MessageTemplatesPanel";

const notificationsSchema = z.object({
  appointmentReminder: z.number().int().min(1),
  diskWarningThreshold: z.number().int().min(1).max(100),
  diskCriticalThreshold: z.number().int().min(1).max(100),
});

type NotificationsFormValues = z.infer<typeof notificationsSchema>;

export function NotificationsTab() {
  const { t } = useTranslation();
  const { data: settingsData, isLoading } = useSettings();
  const { updateSettings, isUpdating } = useUpdateSettings();

  const notification = useMemo(() => settingsData?.data?.notification ?? {}, [settingsData?.data?.notification]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<NotificationsFormValues>({
    resolver: zodResolver(notificationsSchema),
    mode: "onBlur",
    defaultValues: {
      appointmentReminder: 30,
      diskWarningThreshold: 70,
      diskCriticalThreshold: 90,
    },
  });

  useEffect(() => {
    if (notification.appointmentReminder !== undefined) {
      reset({
        appointmentReminder: Number(notification.appointmentReminder) || 30,
        diskWarningThreshold: Number(notification.diskWarningThreshold) || 70,
        diskCriticalThreshold: Number(notification.diskCriticalThreshold) || 90,
      });
    }
  }, [notification, reset]);

  const onSubmit = async (data: NotificationsFormValues) => {
    const items: SettingsUpdateItem[] = [
      { key: "appointmentReminder", value: String(data.appointmentReminder), category: "notification" },
      { key: "diskWarningThreshold", value: String(data.diskWarningThreshold), category: "notification" },
      { key: "diskCriticalThreshold", value: String(data.diskCriticalThreshold), category: "notification" },
    ];
    await updateSettings(items);
  };

  if (isLoading) {
    return (
      <Card className="shadow-card border-border/60">
        <CardContent className="flex h-40 items-center justify-center">
          <Spinner className="size-6" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
    <Card className="shadow-card border-border/60">
      <CardHeader>
        <CardTitle className="text-lg">{t("settings.tabs.notifications")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup className="gap-5">
            <FormSection
              icon={CalendarClockIcon}
              title={t("settings.notifications.appointmentReminder")}
              accentClass="bg-primary/10 text-primary"
            >
              <Field data-invalid={!!errors.appointmentReminder}>
                <FieldLabel htmlFor="appointmentReminder">
                  {t("settings.notifications.appointmentReminder")}
                </FieldLabel>
                <Input
                  id="appointmentReminder"
                  type="number"
                  min={1}
                  aria-invalid={!!errors.appointmentReminder}
                  {...register("appointmentReminder", { valueAsNumber: true })}
                />
                <FieldDescription>
                  {t("settings.notifications.appointmentReminderHint")}
                </FieldDescription>
                {errors.appointmentReminder && (
                  <FieldError>{translateZodError(errors.appointmentReminder.message)}</FieldError>
                )}
              </Field>
            </FormSection>

            <FormSection
              icon={HardDriveIcon}
              title={t("settings.notifications.diskWarningThreshold")}
              accentClass="bg-amber-500/10 text-amber-600 dark:text-amber-400"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field data-invalid={!!errors.diskWarningThreshold}>
                  <FieldLabel htmlFor="diskWarningThreshold">
                    {t("settings.notifications.diskWarningThreshold")}
                  </FieldLabel>
                  <Input
                    id="diskWarningThreshold"
                    type="number"
                    min={1}
                    max={100}
                    aria-invalid={!!errors.diskWarningThreshold}
                    {...register("diskWarningThreshold", { valueAsNumber: true })}
                  />
                  {errors.diskWarningThreshold && (
                    <FieldError>{translateZodError(errors.diskWarningThreshold.message)}</FieldError>
                  )}
                </Field>
                <Field data-invalid={!!errors.diskCriticalThreshold}>
                  <FieldLabel htmlFor="diskCriticalThreshold">
                    {t("settings.notifications.diskCriticalThreshold")}
                  </FieldLabel>
                  <Input
                    id="diskCriticalThreshold"
                    type="number"
                    min={1}
                    max={100}
                    aria-invalid={!!errors.diskCriticalThreshold}
                    {...register("diskCriticalThreshold", { valueAsNumber: true })}
                  />
                  {errors.diskCriticalThreshold && (
                    <FieldError>{translateZodError(errors.diskCriticalThreshold.message)}</FieldError>
                  )}
                </Field>
              </div>
            </FormSection>

            <Button type="submit" disabled={isUpdating || !isDirty} className="w-fit">
              {isUpdating && <Spinner className="size-4" />}
              {t("settings.notifications.save")}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>

    <ReminderSettingsPanel />
    <MessageTemplatesPanel />
    </div>
  );
}
