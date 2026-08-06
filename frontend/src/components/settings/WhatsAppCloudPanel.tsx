import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { MessagingService, type WhatsAppCloudSettings } from "@/services/MessagingService";
import { useNotificationTemplates } from "@/hooks/useNotificationTemplates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { CloudIcon, SendIcon } from "lucide-react";
import { toast } from "sonner";
import { useApiError } from "@/hooks/useApiError";

export function WhatsAppCloudPanel() {
  const { t } = useTranslation();
  const { handleApiError } = useApiError();
  const { whatsappCloudDefinitions } = useNotificationTemplates();
  const [settings, setSettings] = useState<WhatsAppCloudSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await MessagingService.getWhatsAppCloudSettings();
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
      await MessagingService.updateWhatsAppCloudSettings(settings);
      toast.success(t("whatsappCloud.saved"));
    } catch (error) {
      handleApiError(error);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      await MessagingService.updateWhatsAppCloudSettings(settings);
      toast.success(t("whatsappCloud.configSaved"));
    } catch (error) {
      handleApiError(error);
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return <p className="text-muted-foreground py-4 text-center">{t("common.loading")}</p>;
  }

  const monthlyCount = settings.monthlyCount || 0;
  const monthlyLimit = 1000;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CloudIcon className="size-5" />
          {t("whatsappCloud.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-3 text-sm text-muted-foreground">
          {t("whatsappCloud.description")}
        </div>

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="space-y-0.5">
            <Label>{t("whatsappCloud.enabled")}</Label>
            <p className="text-xs text-muted-foreground">{t("whatsappCloud.enabledHint")}</p>
          </div>
          <Switch
            checked={settings.enabled || false}
            onCheckedChange={(v) => setSettings({ ...settings, enabled: v })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phoneNumberId">{t("whatsappCloud.phoneNumberId")}</Label>
          <Input
            id="phoneNumberId"
            value={settings.phoneNumberId || ""}
            onChange={(e) => setSettings({ ...settings, phoneNumberId: e.target.value })}
            placeholder="123456789012345"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="accessToken">{t("whatsappCloud.accessToken")}</Label>
          <Input
            id="accessToken"
            type="password"
            value={settings.accessToken || ""}
            onChange={(e) => setSettings({ ...settings, accessToken: e.target.value })}
            placeholder="EAAG..."
          />
          <p className="text-xs text-muted-foreground">{t("whatsappCloud.accessTokenHint")}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="apiVersion">{t("whatsappCloud.apiVersion")}</Label>
          <Input
            id="apiVersion"
            value={settings.apiVersion || "v18.0"}
            onChange={(e) => setSettings({ ...settings, apiVersion: e.target.value })}
            placeholder="v18.0"
          />
        </div>

        <div className="rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t("whatsappCloud.monthlyUsage")}</span>
            <span className="text-sm text-muted-foreground">
              {monthlyCount} / {monthlyLimit}
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${Math.min((monthlyCount / monthlyLimit) * 100, 100)}%` }}
            />
          </div>
        </div>

        <div className="rounded-lg border p-3">
          <p className="mb-2 text-sm font-medium">{t("whatsappCloud.templates")}</p>
          {whatsappCloudDefinitions.length > 0 ? (
            <div className="space-y-2">
              {whatsappCloudDefinitions.map((def) => (
                <div key={`${def.name}-${def.language}`} className="rounded-md border p-2 text-xs">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="font-mono font-medium">{def.name}</span>
                    <Badge variant="secondary" className="text-xs">{def.language}</Badge>
                  </div>
                  <p className="font-mono text-muted-foreground">{def.body}</p>
                </div>
              ))}
            </div>
          ) : (
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>• appointment_reminder</li>
              <li>• invoice_notification</li>
              <li>• follow_up_reminder</li>
            </ul>
          )}
          <p className="mt-2 text-xs text-muted-foreground">{t("whatsappCloud.templatesHint")}</p>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Spinner className="size-4" />}
            {t("common.save")}
          </Button>
          <Button variant="outline" onClick={handleTest} disabled={testing}>
            {testing && <Spinner className="size-4" />}
            <SendIcon className="size-4" />
            {t("whatsappCloud.testConnection")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
