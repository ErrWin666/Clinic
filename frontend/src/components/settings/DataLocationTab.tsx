import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  HardDriveIcon,
  FolderOpenIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  LoaderIcon,
  RefreshCwIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import type { DataPathValidation, MigrationProgress } from "@/types/electron";

type MigrationMode = "move" | "point";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export function DataLocationTab() {
  const { t } = useTranslation();
  const electronAPI = window.electronAPI;

  const [currentPath, setCurrentPath] = useState<string>("");
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [validation, setValidation] = useState<DataPathValidation | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [migrationMode, setMigrationMode] = useState<MigrationMode>("move");
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationProgress, setMigrationProgress] = useState<MigrationProgress | null>(null);
  const [migrationResult, setMigrationResult] = useState<{ success: boolean; error?: string } | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    if (!electronAPI) return;
    electronAPI.getDataPath().then(setCurrentPath);
  }, [electronAPI]);

  useEffect(() => {
    if (!electronAPI) return;
    electronAPI.onMigrationProgress((info) => {
      setMigrationProgress(info);
    });
  }, [electronAPI]);

  const handleSelectFolder = useCallback(async () => {
    if (!electronAPI) return;
    const folder = await electronAPI.selectFolder();
    if (!folder) return;
    setSelectedPath(folder);
    setValidation(null);
    setMigrationResult(null);
    setIsValidating(true);
    try {
      const result = await electronAPI.validateDataPath(folder);
      setValidation(result);
    } catch {
      setValidation({ valid: false, error: "Validation failed" });
    } finally {
      setIsValidating(false);
    }
  }, [electronAPI]);

  const handleChangePath = useCallback(async () => {
    if (!electronAPI || !selectedPath || !validation?.valid) return;
    setShowConfirmDialog(false);
    setIsMigrating(true);
    setMigrationResult(null);
    setMigrationProgress({ percent: 0, message: "" });
    try {
      const result = await electronAPI.changeDataPath(selectedPath, migrationMode === "move");
      setMigrationResult(result);
      if (result.success) {
        setCurrentPath(selectedPath);
        setSelectedPath(null);
        setValidation(null);
      }
    } catch (err) {
      setMigrationResult({ success: false, error: String(err) });
    } finally {
      setIsMigrating(false);
    }
  }, [electronAPI, selectedPath, validation, migrationMode]);

  const handleResetToDefault = useCallback(async () => {
    if (!electronAPI) return;
    setIsResetting(true);
    electronAPI.resetDataPathAndRestart();
  }, [electronAPI]);

  if (!electronAPI) return null;

  const isExternalDrive = selectedPath && /^[A-Z]:/i.test(selectedPath) && currentPath && !currentPath.toLowerCase().startsWith(selectedPath.substring(0, 2).toLowerCase());

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <HardDriveIcon className="size-4" />
            {t("dataLocation.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">
              {t("dataLocation.currentPath")}
            </Label>
            <div className="rounded-lg bg-muted p-3 text-sm font-mono break-all">
              {currentPath || "..."}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectFolder}
              disabled={isMigrating}
            >
              <FolderOpenIcon className="size-4" />
              {t("dataLocation.changePath")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetToDefault}
              disabled={isResetting || isMigrating}
            >
              <RefreshCwIcon className="size-4" />
              {t("dataLocation.resetToDefault")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {selectedPath && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("dataLocation.changePath")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-3 text-sm font-mono break-all">
              {selectedPath}
            </div>

            {isValidating && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <LoaderIcon className="size-4 animate-spin" />
                {t("dataLocation.validating")}
              </div>
            )}

            {validation && !isValidating && (
              <div className="space-y-2">
                {validation.valid ? (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircleIcon className="size-4" />
                    {t("dataLocation.pathValid")}
                    {validation.freeSpace !== undefined && validation.freeSpace > 0 && (
                      <span className="text-muted-foreground">
                        ({t("dataLocation.freeSpace")}: {formatBytes(validation.freeSpace)})
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <AlertTriangleIcon className="size-4" />
                    {validation.error || t("dataLocation.pathNotWritable")}
                  </div>
                )}
              </div>
            )}

            {isExternalDrive && validation?.valid && (
              <div className="flex items-start gap-2 rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-800">
                <AlertTriangleIcon className="size-4 mt-0.5 shrink-0" />
                {t("dataLocation.externalDriveWarning")}
              </div>
            )}

            {validation?.valid && !isMigrating && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  {t("dataLocation.migrationOptions")}
                </Label>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setMigrationMode("move")}
                    className={`flex items-start gap-2 w-full rounded-lg border p-3 text-start transition-colors ${migrationMode === "move" ? "border-primary bg-primary/5" : "border-border hover:bg-muted"}`}
                  >
                    <div className={`mt-0.5 size-4 shrink-0 rounded-full border-2 ${migrationMode === "move" ? "border-primary bg-primary" : "border-muted-foreground/40"}`} />
                    <div className="space-y-1">
                      <span className="text-sm font-medium">
                        {t("dataLocation.moveData")}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        {t("dataLocation.moveDataDesc")}
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMigrationMode("point")}
                    className={`flex items-start gap-2 w-full rounded-lg border p-3 text-start transition-colors ${migrationMode === "point" ? "border-primary bg-primary/5" : "border-border hover:bg-muted"}`}
                  >
                    <div className={`mt-0.5 size-4 shrink-0 rounded-full border-2 ${migrationMode === "point" ? "border-primary bg-primary" : "border-muted-foreground/40"}`} />
                    <div className="space-y-1">
                      <span className="text-sm font-medium">
                        {t("dataLocation.pointOnly")}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        {t("dataLocation.pointOnlyDesc")}
                      </p>
                    </div>
                  </button>
                </div>

                <Button
                  size="sm"
                  onClick={() => setShowConfirmDialog(true)}
                >
                  {t("dataLocation.apply")}
                </Button>
              </div>
            )}

            {isMigrating && migrationProgress && (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  {migrationProgress.message || t("dataLocation.migrationInProgress")}
                </div>
                <Progress value={migrationProgress.percent} />
                <div className="text-xs text-muted-foreground text-end">
                  {migrationProgress.percent}%
                </div>
              </div>
            )}

            {migrationResult && !isMigrating && (
              <div className={`flex items-start gap-2 rounded-lg p-3 text-sm ${migrationResult.success ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
                {migrationResult.success ? (
                  <>
                    <CheckCircleIcon className="size-4 mt-0.5 shrink-0" />
                    {t("dataLocation.migrationSuccess")}
                  </>
                ) : (
                  <>
                    <AlertTriangleIcon className="size-4 mt-0.5 shrink-0" />
                    {t("dataLocation.migrationFailed", { error: migrationResult.error })}
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dataLocation.confirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {migrationMode === "move"
                ? t("dataLocation.confirmMoveDesc")
                : t("dataLocation.confirmPointDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleChangePath}>
              {t("common.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
