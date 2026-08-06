import { useTranslation } from "react-i18next";
import { config } from "@/lib/config";
import { Card, CardContent } from "@/components/ui/card";
import { ReceiptIcon, CheckCircleIcon, AlertCircleIcon, ClockIcon } from "lucide-react";
import type { InvoiceStats } from "@/services/InvoiceService";

interface InvoiceSummaryProps {
  stats: InvoiceStats;
}

export function InvoiceSummary({ stats }: InvoiceSummaryProps) {
  const { t } = useTranslation();
  const currency = config.defaultCurrency;

  const totalOutstanding = stats.totalOutstanding ?? stats.unpaidTotal;
  const totalPaidAmount = stats.totalPaidAmount ?? stats.paidTotal;
  const overdueTotal = stats.overdueTotal ?? 0;

  const cards = [
    {
      label: t("invoices.summary.totalOutstanding"),
      value: `${currency} ${Number(totalOutstanding).toFixed(2)}`,
      sublabel: `${stats.unpaidCount + (stats.partiallyPaidCount || 0)} ${t("invoices.summary.unpaidCount")}`,
      icon: ReceiptIcon,
      color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      accent: "bg-amber-500/30",
    },
    {
      label: t("invoices.summary.totalPaid"),
      value: `${currency} ${Number(totalPaidAmount).toFixed(2)}`,
      sublabel: `${stats.paidCount + (stats.partiallyPaidCount || 0)} ${t("invoices.summary.paidCount")}`,
      icon: CheckCircleIcon,
      color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      accent: "bg-emerald-500/30",
    },
    {
      label: t("invoices.summary.overdueCount"),
      value: stats.overdueCount,
      sublabel: `${currency} ${Number(overdueTotal).toFixed(2)}`,
      icon: AlertCircleIcon,
      color: "bg-red-500/10 text-red-600 dark:text-red-400",
      accent: "bg-red-500/30",
    },
    {
      label: t("invoices.summary.title"),
      value: stats.totalCount,
      sublabel: `${stats.partiallyPaidCount || 0} ${t("invoices.statuses.partially-paid")}`,
      icon: ClockIcon,
      color: "bg-primary/10 text-primary",
      accent: "bg-primary/30",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label} className="group relative overflow-hidden shadow-card ring-1 ring-foreground/5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-hover">
          <div className={`absolute inset-x-0 top-0 h-1 ${card.accent}`} />
          <CardContent className="flex items-center gap-4 p-5">
            <div className={`flex size-12 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-105 ${card.color}`}>
              <card.icon className="size-6" />
            </div>
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="truncate text-sm font-medium text-muted-foreground">
                {card.label}
              </p>
              <p className="text-2xl font-heading font-bold tracking-tight text-foreground">
                {card.value}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {card.sublabel}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
