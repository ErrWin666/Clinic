import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { MessagingService, type SmsMobileApiSettings } from "@/services/MessagingService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import { SmartphoneIcon, WifiIcon } from "lucide-react";
import { toast } from "sonner";
import { useApiError } from "@/hooks/useApiError";

export function SmsMobileApiPanel() {
  const { t } = useTranslation();
  const { handleApiError } = useApiError();
  const [settings, setSettings] = useState<SmsMobileApiSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<null | { connected?: boolean; battery?: number; signal?: string }>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await MessagingService.getSmsMobileApiSettings();
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
      await MessagingService.updateSmsMobileApiSettings(settings);
      toast.success(t("smsMobile.saved"));
    } catch (error) {
      handleApiError(error);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      // Save first, then test
      await MessagingService.updateSmsMobileApiSettings(settings);
      const res = await MessagingService.testSmsMobileApi();
      const data = res.data as { connected?: boolean; battery?: number; signal?: string };
      setStatus(data);
      if (data.connected) {
        toast.success(t("smsMobile.connected"));
      } else {
        toast.error(t("smsMobile.notConnected"));
      }
    } catch (error) {
      handleApiError(error);
      setStatus({ connected: false });
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
          <SmartphoneIcon className="size-5" />
          {t("smsMobile.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-muted-foreground">
          {t("smsMobile.description")}
        </div>

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="space-y-0.5">
            <Label>{t("smsMobile.enabled")}</Label>
            <p className="text-xs text-muted-foreground">{t("smsMobile.enabledHint")}</p>
          </div>
          <Switch
            checked={settings.enabled || false}
            onCheckedChange={(v) => setSettings({ ...settings, enabled: v })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="smsUrl">{t("smsMobile.url")}</Label>
          <Input
            id="smsUrl"
            value={settings.url || ""}
            onChange={(e) => setSettings({ ...settings, url: e.target.value })}
            placeholder="http://192.168.1.100:8080"
          />
          <p className="text-xs text-muted-foreground">{t("smsMobile.urlHint")}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="smsApiKey">{t("smsMobile.apiKey")}</Label>
          <Input
            id="smsApiKey"
            type="password"
            value={settings.apiKey || ""}
            onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
            placeholder="optional"
          />
        </div>

        {status && (
          <div className="rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <WifiIcon className={`size-4 ${status.connected ? "text-green-500" : "text-red-500"}`} />
              <span className="text-sm font-medium">
                {status.connected ? t("smsMobile.connected") : t("smsMobile.notConnected")}
              </span>
            </div>
            {status.battery !== undefined && (
              <p className="mt-1 text-xs text-muted-foreground">
                {t("smsMobile.battery")}: {status.battery}%
              </p>
            )}
            {status.signal && (
              <p className="text-xs text-muted-foreground">
                {t("smsMobile.signal")}: {status.signal}
              </p>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Spinner className="size-4" />}
            {t("common.save")}
          </Button>
          <Button variant="outline" onClick={handleTest} disabled={testing}>
            {testing && <Spinner className="size-4" />}
            {t("smsMobile.testConnection")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
