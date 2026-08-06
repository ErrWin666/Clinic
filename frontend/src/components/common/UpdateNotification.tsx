import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { DownloadIcon, RefreshCwIcon, XIcon, AlertCircleIcon } from "lucide-react";
import type {
  UpdateAvailableInfo,
  UpdateProgressInfo,
  UpdateReadyInfo,
  UpdateErrorInfo,
} from "@/types/electron";

type UpdateState = "idle" | "available" | "downloading" | "ready" | "error";

export function UpdateNotification() {
  const { t } = useTranslation();
  const [state, setState] = useState<UpdateState>("idle");
  const [progress, setProgress] = useState(0);
  const [version, setVersion] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const electronAPI = window.electronAPI;

  useEffect(() => {
    if (!electronAPI) return;

    electronAPI.onUpdateAvailable((info: UpdateAvailableInfo) => {
      setVersion(info.version);
      setState("available");
      setDismissed(false);
    });

    electronAPI.onUpdateProgress((info: UpdateProgressInfo) => {
      setProgress(info.percent);
      setState("downloading");
    });

    electronAPI.onUpdateReady((info: UpdateReadyInfo) => {
      setVersion(info.version);
      setState("ready");
      setDismissed(false);
    });

    electronAPI.onUpdateError((info: UpdateErrorInfo) => {
      setErrorMessage(info.message);
      setState("error");
      setDismissed(false);
    });
  }, [electronAPI]);

  const handleInstall = useCallback(() => {
    if (electronAPI) {
      electronAPI.installUpdate();
    }
  }, [electronAPI]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
  }, []);

  if (!electronAPI || dismissed || state === "idle") {
    return null;
  }

  if (state === "error") {
    return (
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4 shadow-lg max-w-sm">
        <AlertCircleIcon className="size-5 text-destructive shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-destructive">
            {t("update.error")}
          </p>
          {errorMessage && (
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {errorMessage}
            </p>
          )}
        </div>
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground transition-colors"
          onClick={handleDismiss}
        >
          <XIcon className="size-4" />
        </button>
      </div>
    );
  }

  if (state === "downloading") {
    return (
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg border border-border bg-background p-4 shadow-lg min-w-[280px]">
        <DownloadIcon className="size-5 text-primary shrink-0 animate-pulse" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">
            {t("update.downloading")}
            {version && ` v${version}`}
          </p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {Math.round(progress)}%
          </p>
        </div>
      </div>
    );
  }

  if (state === "available" || state === "ready") {
    return (
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg border border-border bg-background p-4 shadow-lg max-w-sm">
        <RefreshCwIcon className="size-5 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">
            {state === "ready"
              ? t("update.ready")
              : t("update.available")}
            {version && ` v${version}`}
          </p>
        </div>
        {state === "ready" && (
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            onClick={handleInstall}
          >
            <RefreshCwIcon className="size-3.5" />
            {t("update.installNow")}
          </button>
        )}
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground transition-colors"
          onClick={handleDismiss}
        >
          <XIcon className="size-4" />
        </button>
      </div>
    );
  }

  return null;
}
