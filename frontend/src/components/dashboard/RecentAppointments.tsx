import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/EmptyState";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Appointment } from "@/types/models";
import type { AppointmentStatus } from "@/types/enums";

interface RecentAppointmentsProps {
  appointments: Appointment[];
}

const statusVariant: Record<
  AppointmentStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  upcoming: "default",
  confirmed: "default",
  completed: "secondary",
  cancelled: "destructive",
  "no-show": "outline",
  rescheduled: "outline",
};

export function RecentAppointments({ appointments }: RecentAppointmentsProps) {
  const { t } = useTranslation();

  return (
    <Card className="shadow-card border-border/60">
      <CardHeader className="flex-row items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <CardTitle className="font-heading text-base font-semibold">
            {t("dashboard.recentAppointments")}
          </CardTitle>
          <CardDescription>
            {t("dashboard.recentAppointmentsDescription")}
          </CardDescription>
        </div>
        <Link
          to="/appointments"
          className="text-xs font-medium text-primary hover:underline"
        >
          {t("common.viewAll")}
        </Link>
      </CardHeader>
      <CardContent>
        {appointments.length === 0 ? (
          <EmptyState title={t("dashboard.noAppointments")} />
        ) : (
          <div className="flex flex-col gap-2">
            {appointments.map((apt) => {
              const name =
                apt.patient?.fullName ||
                apt.quickName ||
                t("dashboard.quickPatient");
              const initial = name.charAt(0).toUpperCase();
              return (
                <Link
                  key={apt.id}
                  to="/appointments"
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/40 p-3 transition-all duration-200 hover:border-border/80 hover:bg-muted/40"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {initial}
                    </div>
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="truncate text-sm font-medium text-foreground">
                        {name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {apt.appointmentDate} · {apt.startTime}
                      </span>
                    </div>
                  </div>
                  <Badge variant={statusVariant[apt.status]}>
                    {apt.status}
                  </Badge>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
