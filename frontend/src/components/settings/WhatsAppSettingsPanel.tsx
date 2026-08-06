import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { WhatsAppService, type WhatsAppSettings } from "@/services/WhatsAppService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { MessageCircleIcon, SendIcon } from "lucide-react";
import { toast } from "sonner";
import { useApiError } from "@/hooks/useApiError";

export function WhatsAppSettingsPanel() {
  const { t } = useTranslation();
  const { handleApiError } = useApiError();
  const [settings, setSettings] = useState<WhatsAppSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await WhatsAppService.getSettings();
        setSettings(res.data || {});
      } catch {
        // Settings not configured yet
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await WhatsAppService.updateSettings(settings);
      toast.success(t("whatsapp.saved"));
    } catch (error) {
      handleApiError(error);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!testPhone) {
      toast.error(t("whatsapp.enterPhone"));
      return;
    }
    setTesting(true);
    try {
      const res = await WhatsAppService.testMessage(testPhone);
      if ((res.data as { success?: boolean })?.success) {
        toast.success(t("whatsapp.testSent"));
      } else {
        toast.error(t("whatsapp.testFailed"));
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return <p className="text-muted-foreground py-4 text-center">{t("common.loading")}</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircleIcon className="size-5" />
          {t("whatsapp.title")}
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">{t("whatsapp.fallbackHint")}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="space-y-0.5">
            <Label>{t("whatsapp.enable")}</Label>
            <p className="text-sm text-muted-foreground">{t("whatsapp.enableDescription")}</p>
          </div>
          <Switch
            checked={settings.enabled || false}
            onCheckedChange={(v) => setSettings({ ...settings, enabled: v })}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="wa-sid">{t("whatsapp.accountSid")}</Label>
            <Input
              id="wa-sid"
              value={settings.accountSid || ""}
              onChange={(e) => setSettings({ ...settings, accountSid: e.target.value })}
              placeholder="AC..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wa-token">{t("whatsapp.authToken")}</Label>
            <Input
              id="wa-token"
              type="password"
              value={settings.authToken || ""}
              onChange={(e) => setSettings({ ...settings, authToken: e.target.value })}
              placeholder="••••••••"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="wa-from">{t("whatsapp.fromNumber")}</Label>
          <Input
            id="wa-from"
            value={settings.fromNumber || ""}
            onChange={(e) => setSettings({ ...settings, fromNumber: e.target.value })}
            placeholder="+1234567890 or whatsapp:+1234567890"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="wa-appt-tmpl">{t("whatsapp.appointmentTemplate")}</Label>
          <Textarea
            id="wa-appt-tmpl"
            value={settings.appointmentTemplate || ""}
            onChange={(e) => setSettings({ ...settings, appointmentTemplate: e.target.value })}
            placeholder="Dear {{patientName}}, this is a reminder for your appointment at {{clinicName}} on {{date}} at {{time}}."
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            {t("whatsapp.variables")}: {"{{patientName}}, {{clinicName}}, {{date}}, {{time}}"}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="wa-invoice-tmpl">{t("whatsapp.invoiceTemplate")}</Label>
          <Textarea
            id="wa-invoice-tmpl"
            value={settings.invoiceTemplate || ""}
            onChange={(e) => setSettings({ ...settings, invoiceTemplate: e.target.value })}
            placeholder="Dear {{patientName}}, your invoice {{invoiceId}} for {{amount}} {{currency}} is ready at {{clinicName}}."
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="wa-followup-tmpl">{t("whatsapp.followUpTemplate")}</Label>
          <Textarea
            id="wa-followup-tmpl"
            value={settings.followUpTemplate || ""}
            onChange={(e) => setSettings({ ...settings, followUpTemplate: e.target.value })}
            placeholder="Dear {{patientName}}, this is a follow-up reminder from {{clinicName}}. Your last visit was on {{lastVisitDate}}."
            rows={3}
          />
        </div>

        <div className="flex items-end gap-2 rounded-lg border p-3">
          <div className="flex-1 space-y-2">
            <Label htmlFor="wa-test-phone">{t("whatsapp.testPhone")}</Label>
            <Input
              id="wa-test-phone"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              placeholder="+1234567890"
            />
          </div>
          <Button variant="outline" onClick={handleTest} disabled={testing}>
            <SendIcon className="size-4" />
            {t("whatsapp.sendTest")}
          </Button>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? t("common.saving") : t("common.save")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
