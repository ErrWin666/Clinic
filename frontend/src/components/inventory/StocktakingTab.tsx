import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  ClipboardCheckIcon,
  PlusIcon,
  EyeIcon,
  XCircleIcon,
} from "lucide-react";
import {
  useStocktakingList,
  useStartStocktaking,
  useCancelStocktaking,
} from "@/hooks/useStocktaking";
import { StocktakingDialog } from "@/components/inventory/StocktakingDialog";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

export function StocktakingTab() {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [cancelId, setCancelId] = useState<number | null>(null);

  const { stocktakings, isLoading } = useStocktakingList({ pageSize: 50 });
  const { startStocktaking, isStarting } = useStartStocktaking();
  const { cancelStocktaking, isCancelling } = useCancelStocktaking();

  const handleStart = async () => {
    await startStocktaking(undefined);
  };

  const handleOpen = (id: number) => {
    setSelectedId(id);
    setDialogOpen(true);
  };

  const handleCancel = (id: number) => {
    setCancelId(id);
  };

  const handleCancelConfirm = async () => {
    if (cancelId == null) return;
    await cancelStocktaking(cancelId);
    setCancelId(null);
  };

  const statusVariant = (status: string): "default" | "secondary" | "outline" => {
    switch (status) {
      case "completed": return "default";
      case "cancelled": return "secondary";
      case "in_progress": return "outline";
      default: return "secondary";
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardCheckIcon className="size-4 text-primary" />
            {t("inventory.stocktaking.title")}
          </CardTitle>
          <CardDescription>{t("inventory.stocktaking.description")}</CardDescription>
        </div>
        <Button size="sm" onClick={handleStart} disabled={isStarting} className="gap-1.5">
          <PlusIcon className="size-4" />
          {isStarting ? t("common.saving") : t("inventory.stocktaking.start")}
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </div>
        ) : stocktakings.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            {t("inventory.stocktaking.empty")}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {stocktakings.map((stk) => (
              <div
                key={stk.id}
                className="flex items-center gap-3 rounded-xl border border-border/40 p-3"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ClipboardCheckIcon className="size-4" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium font-mono">{stk.displayId}</span>
                    <Badge variant={statusVariant(stk.status)}>
                      {t(`inventory.stocktaking.status.${stk.status}`)}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {stk.startedAt ? new Date(stk.startedAt).toLocaleString() : ""}
                    {stk.completedAt ? ` → ${new Date(stk.completedAt).toLocaleString()}` : ""}
                  </span>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    aria-label={t("common.view")}
                    onClick={() => handleOpen(stk.id)}
                  >
                    <EyeIcon className="size-3.5" />
                  </Button>
                  {stk.status === "in_progress" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive hover:text-destructive"
                      aria-label={t("common.cancel")}
                      onClick={() => handleCancel(stk.id)}
                    >
                      <XCircleIcon className="size-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <StocktakingDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        stocktakingId={selectedId}
      />

      <ConfirmDialog
        open={cancelId != null}
        onConfirm={handleCancelConfirm}
        onCancel={() => setCancelId(null)}
        title={t("inventory.stocktaking.confirmCancelTitle")}
        description={t("inventory.stocktaking.confirmCancel")}
        confirmLabel={t("common.confirm")}
        variant="destructive"
        isPending={isCancelling}
      />
    </Card>
  );
}
