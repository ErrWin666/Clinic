import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  UsersIcon,
  CalendarDaysIcon,
  ReceiptIcon,
  DollarSignIcon,
  LayoutDashboardIcon,
  PackageIcon,
  AlertTriangleIcon,
  XCircleIcon,
  ClockIcon,
} from "lucide-react";
import { useDashboard } from "@/hooks/useDashboard";
import { useApiError } from "@/hooks/useApiError";
import { config } from "@/lib/config";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { PageHeader } from "@/components/common/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/dashboard/StatCard";
import { AppointmentsChart } from "@/components/dashboard/AppointmentsChart";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { RecentAppointments } from "@/components/dashboard/RecentAppointments";
import { RecentExaminations } from "@/components/dashboard/RecentExaminations";
import { DateRangeSelector } from "@/components/dashboard/DateRangeSelector";
import { DemographicsChart } from "@/components/dashboard/DemographicsChart";
import { StockAlertsWidget } from "@/components/inventory/StockAlertsWidget";

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton className="h-[340px] rounded-2xl" />
        <Skeleton className="h-[340px] rounded-2xl" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton className="h-[300px] rounded-2xl" />
        <Skeleton className="h-[300px] rounded-2xl" />
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { t, i18n } = useTranslation();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const { stats: data, isLoading, isError, refetch } = useDashboard(
    startDate || undefined,
    endDate || undefined
  );
  useApiError();

  if (isLoading) {
    return <LoadingState variant="full-page" skeleton={<DashboardSkeleton />} />;
  }

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  const stats = data;
  if (!stats) return null;

  const currency = config.defaultCurrency;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={LayoutDashboardIcon}
        title={t("dashboard.title")}
        description={new Date().toLocaleDateString(i18n.language === "ar" ? "ar-EG" : "en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="animate-stagger-1">
        <StatCard
          title={t("dashboard.totalPatients")}
          value={stats.totalPatients}
          icon={<UsersIcon className="size-5" />}
          color="primary"
        />
        </div>
        <div className="animate-stagger-2">
        <StatCard
          title={t("dashboard.todayAppointments")}
          value={stats.todayAppointments}
          icon={<CalendarDaysIcon className="size-5" />}
          color="blue"
        />
        </div>
        <div className="animate-stagger-3">
        <StatCard
          title={t("dashboard.unpaidInvoices")}
          value={stats.unpaidInvoices.count}
          icon={<ReceiptIcon className="size-5" />}
          color="yellow"
          subtitle={t("dashboard.unpaidAmount", {
            count: stats.unpaidInvoices.count,
            amount: `${currency} ${stats.unpaidInvoices.totalAmount.toFixed(2)}`,
          })}
        />
        </div>
        <div className="animate-stagger-4">
        <StatCard
          title={t("dashboard.monthlyRevenue")}
          value={`${currency} ${stats.monthlyRevenue.toFixed(2)}`}
          icon={<DollarSignIcon className="size-5" />}
          color="green"
        />
        </div>
      </div>

      {stats.inventory && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
              <PackageIcon className="size-4.5" />
            </div>
            <h2 className="font-heading text-base font-semibold text-foreground">
              {t("dashboard.inventoryOverview")}
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard
              title={t("inventory.stats.totalValue")}
              value={`${currency} ${stats.inventory.totalValue.toFixed(2)}`}
              icon={<PackageIcon className="size-5" />}
              color="primary"
            />
            <StatCard
              title={t("inventory.stats.lowStockCount")}
              value={stats.inventory.lowStockCount}
              icon={<AlertTriangleIcon className="size-5" />}
              color="yellow"
            />
            <StatCard
              title={t("inventory.stats.outOfStockCount")}
              value={stats.inventory.outOfStockCount}
              icon={<XCircleIcon className="size-5" />}
              color="red"
            />
            <StatCard
              title={t("inventory.stats.expiringCount")}
              value={stats.inventory.expiringCount}
              icon={<ClockIcon className="size-5" />}
              color="yellow"
            />
            <StatCard
              title={t("inventory.stats.expiredCount")}
              value={stats.inventory.expiredCount}
              icon={<XCircleIcon className="size-5" />}
              color="red"
            />
          </div>
        </section>
      )}

      <StockAlertsWidget />

      <DateRangeSelector
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onPreset={(s, e) => { setStartDate(s); setEndDate(e); }}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.618fr_1fr] animate-stagger-5">
        <AppointmentsChart data={stats.appointmentsChart} />
        <RevenueChart data={stats.revenueChart} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.618fr] animate-stagger-6">
        <RecentAppointments appointments={stats.recentAppointments ?? []} />
        <RecentExaminations examinations={stats.recentExaminations ?? []} />
      </div>

      {stats.demographics && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <DemographicsChart
            data={stats.demographics.gender}
            titleKey="dashboard.genderDistribution"
          />
          <DemographicsChart
            data={stats.demographics.patientType}
            titleKey="dashboard.patientTypeDistribution"
          />
        </div>
      )}
    </div>
  );
}
