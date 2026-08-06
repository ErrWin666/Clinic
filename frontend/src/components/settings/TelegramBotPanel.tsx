import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { TelegramService, type TelegramSettings } from "@/services/TelegramService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import { SendIcon, CopyIcon } from "lucide-react";
import { toast } from "sonner";
import { useApiError } from "@/hooks/useApiError";

export function TelegramBotPanel() {
  const { t } = useTranslation();
  const { handleApiError } = useApiError();
  const [settings, setSettings] = useState<TelegramSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testChatId, setTestChatId] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const res = await TelegramService.getSettings();
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
      await TelegramService.updateSettings(settings);
      toast.success(t("telegram.saved"));
    } catch (error) {
      handleApiError(error);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!testChatId) {
      toast.error(t("telegram.enterChatId"));
      return;
    }
    setTesting(true);
    try {
      await TelegramService.testConnection(testChatId);
      toast.success(t("telegram.testSent"));
    } catch (error) {
      handleApiError(error);
    } finally {
      setTesting(false);
    }
  };

  const handleCopyLink = () => {
    const botUsername = settings.botUsername || "ClinicEyeBot";
    const link = `https://t.me/${botUsername}`;
    navigator.clipboard.writeText(link);
    toast.success(t("telegram.linkCopied"));
  };

  if (loading) {
    return <p className="text-muted-foreground py-4 text-center">{t("common.loading")}</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SendIcon className="size-5" />
          {t("telegram.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-3 text-sm text-muted-foreground">
          {t("telegram.description")}
        </div>

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="space-y-0.5">
            <Label>{t("telegram.enabled")}</Label>
            <p className="text-xs text-muted-foreground">{t("telegram.enabledHint")}</p>
          </div>
          <Switch
            checked={settings.enabled || false}
            onCheckedChange={(v) => setSettings({ ...settings, enabled: v })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="botToken">{t("telegram.botToken")}</Label>
          <Input
            id="botToken"
            type="password"
            value={settings.botToken || ""}
            onChange={(e) => setSettings({ ...settings, botToken: e.target.value })}
            placeholder="123456789:ABCdef..."
          />
          <p className="text-xs text-muted-foreground">{t("telegram.botTokenHint")}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="botUsername">{t("telegram.botUsername")}</Label>
          <Input
            id="botUsername"
            value={settings.botUsername || ""}
            onChange={(e) => setSettings({ ...settings, botUsername: e.target.value })}
            placeholder="ClinicEyeBot"
          />
        </div>

        <div className="rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t("telegram.botLink")}</span>
            <Button variant="ghost" size="sm" onClick={handleCopyLink}>
              <CopyIcon className="size-4" />
              {t("telegram.copyLink")}
            </Button>
          </div>
          <code className="mt-2 block rounded bg-muted px-2 py-1 text-sm">
            https://t.me/{settings.botUsername || "ClinicEyeBot"}
          </code>
        </div>

        <div className="space-y-2">
          <Label htmlFor="testChatId">{t("telegram.testChatId")}</Label>
          <div className="flex gap-2">
            <Input
              id="testChatId"
              value={testChatId}
              onChange={(e) => setTestChatId(e.target.value)}
              placeholder="123456789"
            />
            <Button variant="outline" onClick={handleTest} disabled={testing}>
              {testing && <Spinner className="size-4" />}
              {t("telegram.testConnection")}
            </Button>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving && <Spinner className="size-4" />}
          {t("common.save")}
        </Button>
      </CardContent>
    </Card>
  );
}
