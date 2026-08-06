import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangleIcon,
  PackageXIcon,
  CalendarClockIcon,
  CalendarXIcon,
  TrendingDownIcon,
} from "lucide-react";
import { useStockAlerts } from "@/hooks/useStockAlerts";
import { cn } from "@/lib/utils";

export function StockAlertsWidget() {
  const { t } = useTranslation();
  const { alerts, isLoading } = useStockAlerts(30);

  const summary = alerts?.summary;
  const total = summary?.total ?? 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangleIcon className="size-4 text-amber-500" />
            {t("inventory.alerts.title")}
          </CardTitle>
          <CardDescription>{t("inventory.alerts.description")}</CardDescription>
        </div>
        {total > 0 && (
          <Badge variant="destructive" className="gap-1">
            {total}
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : total === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            {t("inventory.alerts.allClear")}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <AlertTile
              icon={TrendingDownIcon}
              label={t("inventory.alerts.lowStock")}
              count={summary?.lowStockCount ?? 0}
              accent="amber"
              items={alerts?.lowStock}
            />
            <AlertTile
              icon={PackageXIcon}
              label={t("inventory.alerts.outOfStock")}
              count={summary?.outOfStockCount ?? 0}
              accent="red"
              items={alerts?.outOfStock}
            />
            <AlertTile
              icon={CalendarClockIcon}
              label={t("inventory.alerts.expiring")}
              count={summary?.expiringCount ?? 0}
              accent="orange"
              items={alerts?.expiring}
            />
            <AlertTile
              icon={CalendarXIcon}
              label={t("inventory.alerts.expired")}
              count={summary?.expiredCount ?? 0}
              accent="rose"
              items={alerts?.expired}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AlertTile({
  icon: Icon,
  label,
  count,
  accent,
  items,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count: number;
  accent: "amber" | "red" | "orange" | "rose";
  items?: { variantName?: string; productName?: string; quantity?: number; daysUntilExpiry?: number }[];
}) {
  const accentClasses = {
    amber: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    red: "bg-red-500/10 text-red-600 border-red-500/20",
    orange: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    rose: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  };

  return (
    <div className={cn("rounded-xl border p-3", accentClasses[accent])}>
      <div className="flex items-center gap-2">
        <Icon className="size-4" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="mt-1 text-2xl font-bold">{count}</div>
      {items && items.length > 0 && (
        <div className="mt-2 flex flex-col gap-0.5">
          {items.slice(0, 3).map((item, i) => (
            <div key={i} className="truncate text-xs text-muted-foreground">
              {item.productName || item.variantName}
              {item.daysUntilExpiry != null && ` · ${item.daysUntilExpiry}d`}
            </div>
          ))}
          {items.length > 3 && (
            <div className="text-xs text-muted-foreground">+{items.length - 3} more</div>
          )}
        </div>
      )}
    </div>
  );
}
