import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CalendarClockIcon, FileTextIcon, StethoscopeIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field";
import { FormSection } from "@/components/common/FormSection";
import { NotificationService } from "@/services/NotificationService";
import { useApiError } from "@/hooks/useApiError";
import { toast } from "sonner";

export function ReminderSettingsPanel() {
  const { t } = useTranslation();
  const { handleApiError } = useApiError();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    appointmentReminderDays: 2,
    invoiceReminderDays: 3,
    followUpDays: 30,
  });

  useEffect(() => {
    NotificationService.getReminderSettings()
      .then((res) => {
        if (res.data) setSettings(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await NotificationService.updateReminderSettings(settings);
      toast.success(t("settings.reminder.saved"));
    } catch (error) {
      handleApiError(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="shadow-card border-border/60">
        <CardContent className="flex h-32 items-center justify-center">
          <Spinner className="size-5" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card border-border/60">
      <CardContent>
        <FieldGroup className="gap-5">
          <FormSection
            icon={CalendarClockIcon}
            title={t("settings.reminder.appointmentTitle")}
            accentClass="bg-primary/10 text-primary"
          >
            <Field>
              <FieldLabel htmlFor="appointmentReminderDays">
                {t("settings.reminder.appointmentReminderDays")}
              </FieldLabel>
              <Input
                id="appointmentReminderDays"
                type="number"
                min={0}
                max={30}
                value={settings.appointmentReminderDays}
                onChange={(e) =>
                  setSettings({ ...settings, appointmentReminderDays: Number(e.target.value) })
                }
              />
              <FieldDescription>
                {t("settings.reminder.appointmentReminderDaysHint")}
              </FieldDescription>
            </Field>
          </FormSection>

          <FormSection
            icon={FileTextIcon}
            title={t("settings.reminder.invoiceTitle")}
            accentClass="bg-blue-500/10 text-blue-600 dark:text-blue-400"
          >
            <Field>
              <FieldLabel htmlFor="invoiceReminderDays">
                {t("settings.reminder.invoiceReminderDays")}
              </FieldLabel>
              <Input
                id="invoiceReminderDays"
                type="number"
                min={0}
                max={30}
                value={settings.invoiceReminderDays}
                onChange={(e) =>
                  setSettings({ ...settings, invoiceReminderDays: Number(e.target.value) })
                }
              />
              <FieldDescription>
                {t("settings.reminder.invoiceReminderDaysHint")}
              </FieldDescription>
            </Field>
          </FormSection>

          <FormSection
            icon={StethoscopeIcon}
            title={t("settings.reminder.followUpTitle")}
            accentClass="bg-teal-500/10 text-teal-600 dark:text-teal-400"
          >
            <Field>
              <FieldLabel htmlFor="followUpDays">
                {t("settings.reminder.followUpDays")}
              </FieldLabel>
              <Input
                id="followUpDays"
                type="number"
                min={1}
                max={365}
                value={settings.followUpDays}
                onChange={(e) =>
                  setSettings({ ...settings, followUpDays: Number(e.target.value) })
                }
              />
              <FieldDescription>
                {t("settings.reminder.followUpDaysHint")}
              </FieldDescription>
            </Field>
          </FormSection>

          <Button onClick={handleSave} disabled={saving} className="w-fit">
            {saving && <Spinner className="size-4" />}
            {t("common.save")}
          </Button>
        </FieldGroup>
      </CardContent>
    </Card>
  );
}
