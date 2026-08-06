import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { BackupService } from "@/services/BackupService";
import { formatFileSize } from "@/lib/fileUtils";
import { ArchiveIcon, DownloadIcon, RotateCcwIcon } from "lucide-react";
import type { BackupRecord } from "@/types/settings";

const TYPE_VARIANT: Record<string, string> = {
  manual: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  auto: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  restore: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
};

const STATUS_VARIANT: Record<string, string> = {
  success: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

interface BackupHistoryCardProps {
  backups: BackupRecord[];
  isLoading: boolean;
  isError: boolean;
  isCreating: boolean;
  isRestoring: boolean;
  onCreate: () => void;
  onRetry: () => void;
  onRestore: (filename: string) => void;
}

export function BackupHistoryCard({
  backups,
  isLoading,
  isError,
  isCreating,
  isRestoring,
  onCreate,
  onRetry,
  onRestore,
}: BackupHistoryCardProps) {
  const { t } = useTranslation();

  return (
    <Card className="shadow-card border-border/60">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">{t("backup.history")}</CardTitle>
        <Button size="sm" onClick={onCreate} disabled={isCreating}>
          {isCreating ? <Spinner className="size-4" /> : <ArchiveIcon className="size-4" />}
          {t("backup.create")}
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex flex-col gap-2 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState onRetry={onRetry} />
        ) : backups.length === 0 ? (
          <EmptyState icon={<ArchiveIcon className="size-7" />} title="backup.noBackups" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("backup.columns.filename")}</TableHead>
                <TableHead>{t("backup.columns.type")}</TableHead>
                <TableHead>{t("backup.columns.status")}</TableHead>
                <TableHead>{t("backup.columns.size")}</TableHead>
                <TableHead>{t("backup.columns.date")}</TableHead>
                <TableHead className="text-end">{t("backup.columns.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {backups.map((backup) => (
                <TableRow key={backup.id}>
                  <TableCell className="font-mono text-xs">{backup.filename}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={TYPE_VARIANT[backup.type] ?? ""}>
                      {t(`backup.types.${backup.type}`)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={STATUS_VARIANT[backup.status] ?? ""}>
                      {backup.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatFileSize(backup.fileSize)}</TableCell>
                  <TableCell>{dayjs(backup.createdAt).format("YYYY-MM-DD HH:mm")}</TableCell>
                  <TableCell className="text-end">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => window.open(BackupService.getDownloadUrl(backup.filename), "_blank")}
                      >
                        <DownloadIcon className="size-4" />
                      </Button>
                      {backup.status === "success" && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => onRestore(backup.filename)}
                          disabled={isRestoring}
                        >
                          <RotateCcwIcon className="size-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
