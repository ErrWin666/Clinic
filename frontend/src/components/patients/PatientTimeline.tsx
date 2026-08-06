import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/EmptyState";
import { CalendarIcon, EyeIcon, ReceiptIcon } from "lucide-react";
import type { PatientDetail, Appointment, Examination, Invoice } from "@/types/models";

interface TimelineEvent {
  date: string;
  type: "appointment" | "examination" | "invoice";
  displayId: string;
  label: string;
  status: string;
  detail?: string;
}

function buildTimeline(patient: PatientDetail, t: (key: string) => string): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  (patient.appointments ?? []).forEach((apt: Appointment) => {
    events.push({
      date: apt.appointmentDate,
      type: "appointment",
      displayId: apt.displayId,
      label: t("patientProfile.timelineAppointment"),
      status: apt.status,
      detail: `${apt.startTime} - ${apt.endTime}`,
    });
  });

  (patient.eyeExaminations ?? []).forEach((exam: Examination) => {
    events.push({
      date: exam.examDate?.split("T")[0] ?? "",
      type: "examination",
      displayId: exam.displayId,
      label: t("patientProfile.timelineExamination"),
      status: exam.examStatus,
    });
  });

  (patient.invoices ?? []).forEach((inv: Invoice) => {
    events.push({
      date: inv.invoiceDate,
      type: "invoice",
      displayId: inv.displayId,
      label: t("patientProfile.timelineInvoice"),
      status: inv.invoiceStatus,
      detail: inv.totalAmount.toFixed(2),
    });
  });

  return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

const typeConfig = {
  appointment: {
    icon: CalendarIcon,
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  examination: {
    icon: EyeIcon,
    color: "bg-primary/10 text-primary",
    badge: "bg-primary/10 text-primary border-primary/20",
  },
  invoice: {
    icon: ReceiptIcon,
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
} as const;

interface PatientTimelineProps {
  patient: PatientDetail;
}

export function PatientTimeline({ patient }: PatientTimelineProps) {
  const { t } = useTranslation();
  const events = useMemo(() => buildTimeline(patient, t), [patient, t]);

  return (
    <Card className="shadow-card border-border/60">
      <CardHeader>
        <CardTitle className="font-heading text-base font-semibold">
          {t("patientProfile.timelineTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <EmptyState title={t("patientProfile.timelineEmpty")} />
        ) : (
          <div className="relative">
            <div className="absolute right-4 top-2 bottom-2 w-px bg-border rtl:right-auto rtl:left-4" />
            <div className="flex flex-col gap-4">
              {events.map((event, index) => {
                const config = typeConfig[event.type];
                return (
                  <div key={`${event.type}-${event.displayId}-${index}`} className="relative flex items-start gap-4 pr-2 rtl:pr-0 rtl:pl-2">
                    <div className={`relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full ring-4 ring-background ${config.color}`}>
                      <config.icon className="size-4" />
                    </div>
                    <div className="flex flex-1 flex-col gap-1 rounded-xl border border-border/40 p-3 transition-colors hover:border-border/80">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-foreground">
                          {event.label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {dayjs(event.date).format("YYYY-MM-DD")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">
                          {event.displayId}
                        </span>
                        {event.detail && (
                          <span className="text-xs text-muted-foreground">
                            · {event.detail}
                          </span>
                        )}
                        <Badge variant="outline" className={`ml-auto text-xs ${config.badge}`}>
                          {event.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
