import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { DialogHeaderWithIcon } from "@/components/common/DialogHeaderWithIcon";
import {
  ClipboardCheckIcon,
  CheckCircle2Icon,
} from "lucide-react";
import {
  useStocktakingDetail,
  useUpdateCounts,
  useCompleteStocktaking,
} from "@/hooks/useStocktaking";
import type { StocktakingCountUpdate } from "@/services/StocktakingService";
import { cn } from "@/lib/utils";

interface StocktakingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stocktakingId: number | null;
}

interface CountRow {
  id: number;
  countedQuantity: string;
  note: string;
}

export function StocktakingDialog({ open, onOpenChange, stocktakingId }: StocktakingDialogProps) {
  const { t } = useTranslation();
  const [counts, setCounts] = useState<Record<number, CountRow>>({});
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);

  const { stocktaking, isLoading } = useStocktakingDetail(stocktakingId, open);
  const { updateCounts, isUpdating } = useUpdateCounts(stocktakingId);
  const { completeStocktaking, isCompleting } = useCompleteStocktaking(stocktakingId);

  useEffect(() => {
    if (stocktaking?.items) {
      const initial: Record<number, CountRow> = {};
      for (const item of stocktaking.items) {
        initial[item.id] = {
          id: item.id,
          countedQuantity: item.countedQuantity != null ? String(item.countedQuantity) : "",
          note: item.note || "",
        };
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync server data to mutable form state on query load
      setCounts(initial);
    }
  }, [stocktaking]);

  const handleSave = async () => {
    if (!stocktakingId) return;
    const rows: StocktakingCountUpdate[] = Object.values(counts).map((r) => {
      const parsed = r.countedQuantity === "" ? null : parseInt(r.countedQuantity, 10);
      return {
        id: r.id,
        countedQuantity: parsed != null && !Number.isNaN(parsed) ? parsed : null,
        note: r.note || null,
      };
    });
    await updateCounts({ id: stocktakingId, items: rows });
  };

  const handleCompleteClick = () => {
    setShowCompleteConfirm(true);
  };

  const handleCompleteConfirm = async () => {
    if (!stocktakingId) return;
    setShowCompleteConfirm(false);
    const rows: StocktakingCountUpdate[] = Object.values(counts).map((r) => {
      const parsed = r.countedQuantity === "" ? null : parseInt(r.countedQuantity, 10);
      return {
        id: r.id,
        countedQuantity: parsed != null && !Number.isNaN(parsed) ? parsed : null,
        note: r.note || null,
      };
    });
    await updateCounts({ id: stocktakingId, items: rows });
    await completeStocktaking(stocktakingId);
    onOpenChange(false);
  };

  const isCompleted = stocktaking?.status === "completed";
  const isCancelled = stocktaking?.status === "cancelled";
  const isReadOnly = isCompleted || isCancelled;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-hidden flex flex-col sm:max-w-4xl">
        <DialogHeaderWithIcon
          icon={ClipboardCheckIcon}
          title={`${t("inventory.stocktaking.title")} — ${stocktaking?.displayId || "..."}`}
          description={t("inventory.stocktaking.description")}
          titleExtra={
            stocktaking ? (
              <Badge
                variant={stocktaking.status === "completed" ? "default" : "secondary"}
                className="ml-1"
              >
                {t(`inventory.stocktaking.status.${stocktaking.status}`)}
              </Badge>
            ) : undefined
          }
        />

        {isLoading ? (
          <div className="flex flex-col gap-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="flex flex-1 flex-col overflow-hidden">
            <ScrollArea className="flex-1 min-h-0">
              <div className="flex flex-col gap-2 p-4">
                {/* Header */}
                <div className="hidden grid-cols-[1fr_100px_100px_100px_1fr] gap-2 px-1 text-xs font-medium text-muted-foreground sm:grid">
                  <span>{t("inventory.products")}</span>
                  <span className="text-center">{t("inventory.stocktaking.systemQuantity")}</span>
                  <span className="text-center">{t("inventory.stocktaking.countedQuantity")}</span>
                  <span className="text-center">{t("inventory.stocktaking.difference")}</span>
                  <span>{t("inventory.stocktaking.note")}</span>
                </div>

                {stocktaking?.items?.map((item) => {
                  const row = counts[item.id] || { id: item.id, countedQuantity: "", note: "" };
                  const counted = row.countedQuantity === "" ? null : Number(row.countedQuantity);
                  const diff = counted != null ? counted - item.systemQuantity : null;
                  return (
                    <div
                      key={item.id}
                      className="grid grid-cols-[1fr_100px_100px_100px_1fr] items-center gap-2 rounded-lg border border-border/40 p-2"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">
                          {item.variant?.name || `#${item.productVariantId}`}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.variant?.sku} {item.batch?.batchNumber ? `· ${item.batch.batchNumber}` : ""}
                        </div>
                      </div>
                      <div className="text-center text-sm font-mono">{item.systemQuantity}</div>
                      <Input
                        type="number"
                        step="1"
                        min="0"
                        value={row.countedQuantity}
                        disabled={isReadOnly}
                        onChange={(e) =>
                          setCounts({
                            ...counts,
                            [item.id]: { ...row, countedQuantity: e.target.value },
                          })
                        }
                        className="text-center"
                      />
                      <div
                        className={cn(
                          "text-center text-sm font-mono font-medium",
                          diff == null && "text-muted-foreground",
                          diff != null && diff === 0 && "text-emerald-600",
                          diff != null && diff > 0 && "text-blue-600",
                          diff != null && diff < 0 && "text-destructive"
                        )}
                      >
                        {diff != null ? (diff > 0 ? `+${diff}` : diff) : "—"}
                      </div>
                      <Input
                        value={row.note}
                        disabled={isReadOnly}
                        onChange={(e) =>
                          setCounts({
                            ...counts,
                            [item.id]: { ...row, note: e.target.value },
                          })
                        }
                        placeholder={t("inventory.stocktaking.note")}
                        className="text-sm"
                      />
                    </div>
                  );
                })}
                {stocktaking?.items?.length === 0 && (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    {t("common.noData")}
                  </div>
                )}
              </div>
            </ScrollArea>

            {!isReadOnly && (
              <div className="flex items-center justify-end gap-2 border-t border-border/40 p-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSave}
                  disabled={isUpdating}
                >
                  {isUpdating ? t("common.saving") : t("common.save")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCompleteClick}
                  disabled={isCompleting}
                  className="gap-1.5"
                >
                  <CheckCircle2Icon className="size-4" />
                  {isCompleting ? t("common.saving") : t("inventory.stocktaking.complete")}
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>

      <ConfirmDialog
        open={showCompleteConfirm}
        onConfirm={handleCompleteConfirm}
        onCancel={() => setShowCompleteConfirm(false)}
        title={t("inventory.stocktaking.confirmCompleteTitle")}
        description={t("inventory.stocktaking.confirmComplete")}
        confirmLabel={t("inventory.stocktaking.complete")}
        isPending={isCompleting || isUpdating}
      />
    </Dialog>
  );
}
