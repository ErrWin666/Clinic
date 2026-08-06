import { useState } from "react";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { ScrollTextIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useAuditLogs } from "@/hooks/useAuditLogs";
import { ENUMS } from "@/types/enums";
import type { AuditLogEntry } from "@/types/settings";

const ACTION_VARIANT: Record<string, string> = {
  CREATE: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  UPDATE: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  DELETE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  LOGIN: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  LOGOUT: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
};

function ChangesCell({ changes }: { changes: string | null }) {
  const [expanded, setExpanded] = useState(false);
  if (!changes) return <span className="text-muted-foreground">—</span>;
  return (
    <div className="flex flex-col gap-1">
      <Button
        variant="ghost"
        size="icon-sm"
        className="w-fit"
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? <ChevronUpIcon className="size-4" /> : <ChevronDownIcon className="size-4" />}
      </Button>
      {expanded && (
        <pre className="max-w-md overflow-x-auto rounded-lg bg-muted p-2 text-xs font-mono">
          {JSON.stringify(JSON.parse(changes), null, 2)}
        </pre>
      )}
    </div>
  );
}

export function AuditLogTab() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [action, setAction] = useState<string>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { logs: data, pagination, isLoading, isError, refetch, isFetching } = useAuditLogs({
    page,
    pageSize: 10,
    action: action || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const logs = data;


  return (
    <div className="flex flex-col gap-4">
      <Card className="shadow-card border-border/60">
        <CardHeader>
          <CardTitle className="text-lg">{t("auditLog.title")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex flex-col gap-1">
              <Label className="text-xs">{t("auditLog.filters.action")}</Label>
              <Select value={action} onValueChange={(v) => { setAction(!v || v === "all" ? "" : v); setPage(1); }}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("auditLog.filters.all")}</SelectItem>
                  {ENUMS.AUDIT_ACTION.map((a) => (
                    <SelectItem key={a} value={a}>
                      {t(`auditLog.actions.${a}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">{t("auditLog.filters.startDate")}</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                className="w-40"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">{t("auditLog.filters.endDate")}</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                className="w-40"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card border-border/60">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col gap-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : logs.length === 0 ? (
            <EmptyState
              icon={<ScrollTextIcon className="size-7" />}
              title="auditLog.noLogs"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("auditLog.columns.user")}</TableHead>
                  <TableHead>{t("auditLog.columns.action")}</TableHead>
                  <TableHead>{t("auditLog.columns.entity")}</TableHead>
                  <TableHead>{t("auditLog.columns.changes")}</TableHead>
                  <TableHead>{t("auditLog.columns.timestamp")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log: AuditLogEntry) => (
                  <TableRow
                    key={log.id}
                    className={isFetching ? "opacity-60" : ""}
                  >
                    <TableCell className="text-sm">
                      {log.userId ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={ACTION_VARIANT[log.action] ?? ""}
                      >
                        {t(`auditLog.actions.${log.action}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{log.entity}</TableCell>
                    <TableCell>
                      <ChangesCell changes={log.changes} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {dayjs(log.createdAt).format("YYYY-MM-DD HH:mm")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-muted-foreground">
            {t("common.pagination.page", {
              current: pagination.currentPage,
              total: pagination.totalPages,
            })}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.currentPage <= 1 || isFetching}
              onClick={() => setPage(pagination.currentPage - 1)}
            >
              {t("common.previous")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.currentPage >= pagination.totalPages || isFetching}
              onClick={() => setPage(pagination.currentPage + 1)}
            >
              {t("common.next")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
