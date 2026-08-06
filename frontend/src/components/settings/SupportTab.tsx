import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { FileTextIcon, InfoIcon, FolderOpenIcon, DownloadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { SystemInfo, LogEntry } from "@/types/electron";

export function SupportTab() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);

  const electronAPI = window.electronAPI;

  const handleCollectLogs = useCallback(async () => {
    if (!electronAPI) return;
    setIsLoadingLogs(true);
    try {
      const collected = await electronAPI.collectLogs();
      setLogs(collected);
    } catch {
      // ignore
    } finally {
      setIsLoadingLogs(false);
    }
  }, [electronAPI]);

  const handleSystemInfo = useCallback(async () => {
    if (!electronAPI) return;
    setIsLoadingInfo(true);
    try {
      const info = await electronAPI.getSystemInfo();
      setSystemInfo(info);
    } catch {
      // ignore
    } finally {
      setIsLoadingInfo(false);
    }
  }, [electronAPI]);

  const handleOpenDataFolder = useCallback(async () => {
    if (!electronAPI) return;
    await electronAPI.openFolder();
  }, [electronAPI]);

  const handleDownloadLogs = useCallback(() => {
    const logText = logs
      .map((log) => `=== ${log.filename} ===\n${log.content}`)
      .join("\n\n");
    const blob = new Blob([logText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clinic-eye-logs-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [logs]);

  if (!electronAPI) return null;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileTextIcon className="size-4" />
            {t("support.collectLogs")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCollectLogs}
              disabled={isLoadingLogs}
            >
              <FileTextIcon className="size-4" />
              {isLoadingLogs ? "..." : t("support.collectLogs")}
            </Button>
            {logs.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadLogs}
              >
                <DownloadIcon className="size-4" />
                {t("support.downloadLogs")}
              </Button>
            )}
          </div>
          {logs.length > 0 && (
            <Textarea
              readOnly
              className="h-48 text-xs font-mono"
              value={logs
                .map((log) => `=== ${log.filename} ===\n${log.content.slice(-2000)}`)
                .join("\n\n")}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <InfoIcon className="size-4" />
            {t("support.systemInfo")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSystemInfo}
            disabled={isLoadingInfo}
          >
            <InfoIcon className="size-4" />
            {isLoadingInfo ? "..." : t("support.systemInfo")}
          </Button>
          {systemInfo && (
            <pre className="rounded-lg bg-muted p-3 text-xs overflow-auto max-h-48">
              {JSON.stringify(systemInfo, null, 2)}
            </pre>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FolderOpenIcon className="size-4" />
            {t("support.openDataFolder")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenDataFolder}
          >
            <FolderOpenIcon className="size-4" />
            {t("support.openDataFolder")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
