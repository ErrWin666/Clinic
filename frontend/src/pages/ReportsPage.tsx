import { useState } from "react";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { ReportService } from "@/services/ReportService";
import { useDashboard } from "@/hooks/useDashboard";
import { PageHeader } from "@/components/common/PageHeader";
import { ErrorState } from "@/components/common/ErrorState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  UsersIcon,
  ReceiptIcon,
  CalendarIcon,
  DownloadIcon,
  TrendingUpIcon,
  BarChart3Icon,
  FileTextIcon,
  PackageIcon,
  AlertTriangleIcon,
  ClockIcon,
  ArchiveIcon,
  ArrowLeftRightIcon,
  TrendingDownIcon,
} from "lucide-react";

export function ReportsPage() {
  const { t } = useTranslation();
  const { stats: response, isLoading, isError, refetch } = useDashboard();
  const stats = response;
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleExport = (type: "patients" | "invoices" | "appointments") => {
    const params = { startDate, endDate };
    if (type === "patients") ReportService.exportPatients(params);
    if (type === "invoices") ReportService.exportInvoices(params);
    if (type === "appointments") ReportService.exportAppointments(params);
  };

  if (isError) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title={t("reports.title")}
          description={t("reports.description")}
          icon={BarChart3Icon}
        />
        <ErrorState onRetry={() => refetch()} />
      </div>
    );
  }

  const summaryCards = stats
    ? [
        {
          label: t("reports.totalRevenue"),
          value: `$${stats.monthlyRevenue.toFixed(2)}`,
          icon: TrendingUpIcon,
          color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        },
        {
          label: t("reports.totalOutstanding"),
          value: `$${stats.unpaidInvoices.totalAmount.toFixed(2)}`,
          icon: ReceiptIcon,
          color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
        },
        {
          label: t("reports.totalPatients"),
          value: String(stats.totalPatients),
          icon: UsersIcon,
          color: "bg-primary/10 text-primary",
        },
        {
          label: t("reports.totalAppointments"),
          value: String(stats.todayAppointments),
          icon: CalendarIcon,
          color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
        },
      ]
    : [];

  const exportCards = [
    {
      title: t("reports.patientReports"),
      icon: UsersIcon,
      color: "bg-primary/10 text-primary",
      description: t("reports.exportPatients"),
      onClick: () => handleExport("patients"),
    },
    {
      title: t("reports.financialReports"),
      icon: ReceiptIcon,
      color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      description: t("reports.exportInvoices"),
      onClick: () => handleExport("invoices"),
    },
    {
      title: t("reports.appointmentReports"),
      icon: CalendarIcon,
      color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      description: t("reports.exportAppointments"),
      onClick: () => handleExport("appointments"),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader icon={BarChart3Icon} title={t("reports.title")} description={t("reports.description")} />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="shadow-sm">
                <CardContent className="p-4">
                  <div className="h-16 animate-pulse rounded-lg bg-muted/40" />
                </CardContent>
              </Card>
            ))
          : summaryCards.map((card) => {
              const Icon = card.icon;
              return (
                <Card key={card.label} className="shadow-sm border-border/40">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex size-10 items-center justify-center rounded-xl ${card.color}`}>
                        <Icon className="size-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xl font-heading font-bold text-foreground">
                          {card.value}
                        </span>
                        <span className="text-xs text-muted-foreground">{card.label}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
      </div>

      {/* Date Range Filter */}
      <Card className="shadow-sm border-border/40">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">{t("reports.dateRange")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">{t("reports.startDate")}</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-44"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">{t("reports.endDate")}</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-44"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setStartDate(dayjs().subtract(30, "day").format("YYYY-MM-DD"));
                setEndDate(dayjs().format("YYYY-MM-DD"));
              }}
            >
              {t("common.date")}: 30d
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setStartDate(dayjs().subtract(90, "day").format("YYYY-MM-DD"));
                setEndDate(dayjs().format("YYYY-MM-DD"));
              }}
            >
              {t("common.date")}: 90d
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Export Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {exportCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="shadow-sm border-border/40">
              <CardContent className="flex flex-col gap-4 p-5">
                <div className="flex items-center gap-3">
                  <div className={`flex size-10 items-center justify-center rounded-xl ${card.color}`}>
                    <Icon className="size-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">{card.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{card.description}</p>
                <Button size="sm" variant="outline" onClick={card.onClick} className="w-fit">
                  <DownloadIcon className="size-4" />
                  {t("reports.export")}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* PDF Reports Section */}
      <Card className="shadow-sm border-border/40">
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <FileTextIcon className="size-4 text-primary" />
            {t("reports.pdfReports")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" size="sm" className="justify-start" onClick={() => ReportService.downloadInventoryValuationPDF()}>
              <PackageIcon className="size-4" />
              {t("reports.inventoryValuation")}
            </Button>
            <Button variant="outline" size="sm" className="justify-start" onClick={() => ReportService.downloadLowStockPDF()}>
              <AlertTriangleIcon className="size-4" />
              {t("reports.lowStock")}
            </Button>
            <Button variant="outline" size="sm" className="justify-start" onClick={() => ReportService.downloadExpiryPDF(30)}>
              <ClockIcon className="size-4" />
              {t("reports.expiry")}
            </Button>
            <Button variant="outline" size="sm" className="justify-start" onClick={() => ReportService.downloadDeadStockPDF(3)}>
              <ArchiveIcon className="size-4" />
              {t("reports.deadStock")}
            </Button>
            <Button variant="outline" size="sm" className="justify-start" onClick={() => ReportService.downloadStockAgingPDF()}>
              <ClockIcon className="size-4" />
              {t("reports.stockAging")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="justify-start"
              onClick={() => ReportService.downloadMovementsSummaryPDF(startDate || undefined, endDate || undefined)}
            >
              <ArrowLeftRightIcon className="size-4" />
              {t("reports.movementsSummary")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="justify-start"
              disabled={!startDate || !endDate}
              onClick={() => ReportService.downloadProfitLossPDF(startDate, endDate)}
            >
              <TrendingDownIcon className="size-4" />
              {t("reports.profitLoss")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
