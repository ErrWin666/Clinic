import { useTranslation } from "react-i18next";
import { useStockMovementsTabLogic } from "@/hooks/useStockMovementsTabLogic";
import { OpeningStockDialog } from "@/components/inventory/OpeningStockDialog";
import { AdjustStockDialog } from "@/components/inventory/AdjustStockDialog";
import { DamageDialog } from "@/components/inventory/DamageDialog";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PaginationBar } from "@/components/common/PaginationBar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { BoxesIcon, WrenchIcon, TrendingDownIcon, ArrowLeftRightIcon } from "lucide-react";
import { ENUMS } from "@/types/enums";

function movementBadgeClass(type: string): string {
  if (type === "in") return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
  if (type === "out") return "bg-red-500/10 text-red-600 border-red-500/20";
  if (type === "adjust") return "bg-amber-500/10 text-amber-600 border-amber-500/20";
  return "";
}

export function StockMovementsTab() {
  const { t } = useTranslation();
  const logic = useStockMovementsTabLogic();

  return (
    <div className="flex flex-col gap-4">
      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatCard label={t("inventory.stats.totalValue")} value={logic.stats ? Number(logic.stats.totalValue).toFixed(2) : "—"} />
        <StatCard label={t("inventory.stats.lowStockCount")} value={logic.stats?.lowStockCount ?? "—"} accent="warning" />
        <StatCard label={t("inventory.stats.outOfStockCount")} value={logic.stats?.outOfStockCount ?? "—"} accent="destructive" />
        <StatCard label={t("inventory.stats.expiringCount")} value={logic.stats?.expiringCount ?? "—"} accent="warning" />
        <StatCard label={t("inventory.stats.expiredCount")} value={logic.stats?.expiredCount ?? "—"} accent="destructive" />
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger render={<Button size="sm" variant="outline" onClick={() => logic.setOpeningOpen(true)} />}>
              <BoxesIcon className="size-4" />
              {t("inventory.actions.openingStock")}
            </TooltipTrigger>
            <TooltipContent>{t("inventory.actions.openingStock")}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger render={<Button size="sm" variant="outline" onClick={() => logic.setAdjustOpen(true)} />}>
              <WrenchIcon className="size-4" />
              {t("inventory.actions.adjustStock")}
            </TooltipTrigger>
            <TooltipContent>{t("inventory.actions.adjustStock")}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger render={<Button size="sm" variant="outline" onClick={() => logic.setDamageOpen(true)} />}>
              <TrendingDownIcon className="size-4" />
              {t("inventory.actions.recordDamage")}
            </TooltipTrigger>
            <TooltipContent>{t("inventory.actions.recordDamage")}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Filters */}
      <Card className="shadow-card border-border/60">
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <Select value={logic.type || "all"} onValueChange={(v) => { logic.setType(v === "all" ? "" : v ?? ""); logic.setPage(1); }}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder={t("inventory.fields.movementType")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all")}</SelectItem>
              {ENUMS.STOCK_MOVEMENT_TYPE.map((tp) => (
                <SelectItem key={tp} value={tp}>{t(`inventory.movementTypes.${tp}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={logic.reason || "all"} onValueChange={(v) => { logic.setReason(v === "all" ? "" : v ?? ""); logic.setPage(1); }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t("inventory.fields.reason")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all")}</SelectItem>
              {ENUMS.STOCK_MOVEMENT_REASON.map((r) => (
                <SelectItem key={r} value={r}>{t(`inventory.reasons.${r}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Movements table */}
      <Card className="shadow-card border-border/60">
        <CardContent className="p-0">
          {logic.isError ? (
            <ErrorState onRetry={() => logic.refetch()} />
          ) : logic.isLoading ? (
            <div className="flex flex-col gap-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : logic.movements.length === 0 ? (
            <EmptyState
              icon={<ArrowLeftRightIcon className="size-7" />}
              title="inventory.empty"
              description="inventory.emptyDescription"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("inventory.fields.movementType")}</TableHead>
                  <TableHead>{t("inventory.fields.sku")}</TableHead>
                  <TableHead>{t("inventory.fields.quantity")}</TableHead>
                  <TableHead>{t("inventory.fields.reason")}</TableHead>
                  <TableHead className="hidden md:table-cell">{t("inventory.fields.unitCost")}</TableHead>
                  <TableHead className="hidden lg:table-cell">{t("inventory.fields.batchNumber")}</TableHead>
                  <TableHead className="hidden md:table-cell">{t("inventory.fields.receivedDate")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logic.movements.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <Badge variant="outline" className={movementBadgeClass(m.type)}>
                        {t(`inventory.movementTypes.${m.type}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{m.variant?.sku || "—"}</TableCell>
                    <TableCell className="font-mono text-sm">
                      <span className={m.type === "in" ? "text-emerald-600" : m.type === "out" ? "text-destructive" : ""}>
                        {m.type === "in" ? "+" : m.type === "out" ? "-" : ""}{m.quantity}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{t(`inventory.reasons.${m.reason}`)}</TableCell>
                    <TableCell className="hidden md:table-cell font-mono text-sm">{Number(m.unitCost).toFixed(2)}</TableCell>
                    <TableCell className="hidden lg:table-cell font-mono text-xs">{m.batch?.batchNumber || "—"}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{new Date(m.movementDate).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {logic.pagination && logic.pagination.totalPages > 1 && (
            <PaginationBar pagination={logic.pagination} onPageChange={logic.setPage} />
          )}
        </CardContent>
      </Card>

      <OpeningStockDialog open={logic.openingOpen} onOpenChange={logic.setOpeningOpen} />
      <AdjustStockDialog open={logic.adjustOpen} onOpenChange={logic.setAdjustOpen} />
      <DamageDialog open={logic.damageOpen} onOpenChange={logic.setDamageOpen} />
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string | number; accent?: "warning" | "destructive" }) {
  const colorClass = accent === "warning" ? "text-amber-600" : accent === "destructive" ? "text-destructive" : "text-foreground";
  return (
    <Card className="border-border/60">
      <CardContent className="p-3">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={`text-lg font-bold ${colorClass}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
