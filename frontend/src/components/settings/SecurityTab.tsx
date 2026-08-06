import { useState } from "react";
import { useTranslation } from "react-i18next";
import { KeyRoundIcon, CopyIcon, CheckIcon, RefreshCwIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AuthService } from "@/services/AuthService";
import { useApiError } from "@/hooks/useApiError";
import { toast } from "sonner";

export function SecurityTab() {
  const { t } = useTranslation();
  const { handleApiError } = useApiError();
  const [regenerating, setRegenerating] = useState(false);
  const [newCode, setNewCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleRegenerate = async () => {
    setNewCode(null);
    setRegenerating(true);
    try {
      const res = await AuthService.regenerateRecoveryCode();
      setNewCode(res.data.recoveryCode);
      toast.success(t("auth.recover.regenerateSuccess"));
    } catch (error) {
      handleApiError(error);
    } finally {
      setRegenerating(false);
    }
  };

  const copyCode = () => {
    if (newCode) {
      navigator.clipboard.writeText(newCode);
      setCopied(true);
      toast.success(t("auth.recover.newCodeCopied"));
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card className="shadow-card border-border/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <KeyRoundIcon className="size-5" />
          {t("auth.recover.regenerateCode")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {t("auth.recover.showCurrentCode")}
        </p>

        {newCode && (
          <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
            <p className="text-sm font-medium text-warning mb-2">
              {t("auth.recover.regenerateWarning")}
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-md bg-muted px-3 py-2 font-mono text-sm break-all">
                {newCode}
              </code>
              <Button variant="outline" size="icon" aria-label={copied ? t("common.copied") : t("common.copy")} onClick={copyCode}>
                {copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
              </Button>
            </div>
          </div>
        )}

        <Button onClick={handleRegenerate} disabled={regenerating} variant="outline">
          {regenerating ? (
            <RefreshCwIcon className="size-4 animate-spin" />
          ) : (
            <KeyRoundIcon className="size-4" />
          )}
          {t("auth.recover.regenerateCode")}
        </Button>
      </CardContent>
    </Card>
  );
}
