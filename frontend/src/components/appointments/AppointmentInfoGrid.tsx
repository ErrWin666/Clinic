import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import type { Appointment } from "@/types/models";
import {
  UserIcon,
  PhoneIcon,
  TagIcon,
  ClockIcon,
  MessageSquareIcon,
  StickyNoteIcon,
  FileTextIcon,
  ReceiptIcon,
  ZapIcon,
} from "lucide-react";

interface AppointmentInfoGridProps {
  appointment: Appointment;
  patientName: string;
  isQuick: boolean;
}

export function AppointmentInfoGrid({ appointment, patientName, isQuick }: AppointmentInfoGridProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-2 gap-3 rounded-xl border border-border/40 bg-muted/30 p-4">
      {isQuick && (
        <div className="col-span-2 mb-1">
          <Badge variant="outline" className="gap-1 text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/5">
            <ZapIcon className="size-3" />
            {t("appointments.quickAppointment")}
          </Badge>
        </div>
      )}
      <div className="flex flex-col gap-1">
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <UserIcon className="size-3.5 text-blue-500" />
          {isQuick ? t("appointments.fields.quickName") : t("appointments.fields.patient")}
        </span>
        <span className="text-sm font-medium truncate">{patientName}</span>
      </div>
      {isQuick && appointment.quickPhone && (
        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <PhoneIcon className="size-3.5 text-teal-500" />
            {t("appointments.fields.quickPhone")}
          </span>
          <span className="text-sm font-medium">{appointment.quickPhone}</span>
        </div>
      )}
      <div className="flex flex-col gap-1">
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <TagIcon className="size-3.5 text-purple-500" />
          {t("appointments.fields.appointmentType")}
        </span>
        <span className="text-sm font-medium">
          {t(`appointments.types.${appointment.appointmentType}`)}
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <ClockIcon className="size-3.5 text-amber-500" />
          {t("appointments.fields.time")}
        </span>
        <span className="text-sm font-medium">
          {appointment.startTime} — {appointment.endTime}
        </span>
      </div>
      {appointment.reason && (
        <div className="col-span-2 flex flex-col gap-1">
          <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <MessageSquareIcon className="size-3.5 text-sky-500" />
            {t("appointments.fields.reason")}
          </span>
          <span className="text-sm">{appointment.reason}</span>
        </div>
      )}
      {appointment.notes && (
        <div className="col-span-2 flex flex-col gap-1">
          <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <StickyNoteIcon className="size-3.5 text-yellow-500" />
            {t("appointments.fields.notes")}
          </span>
          <span className="text-sm">{appointment.notes}</span>
        </div>
      )}

      {/* Linked entities */}
      {(appointment.examination || appointment.invoice) && (
        <div className="col-span-2 flex flex-col gap-2.5 border-t border-border/40 pt-3">
          {appointment.examination && (
            <div className="flex items-center gap-2.5 text-sm">
              <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileTextIcon className="size-4" />
              </div>
              <span className="text-muted-foreground">{t("appointments.linkedExamination")}:</span>
              <Badge variant="secondary" className="text-xs">
                {appointment.examination.displayId}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {t(`examinations.statuses.${appointment.examination.examStatus}`)}
              </span>
            </div>
          )}
          {appointment.invoice && (
            <div className="flex items-center gap-2.5 text-sm">
              <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ReceiptIcon className="size-4" />
              </div>
              <span className="text-muted-foreground">{t("appointments.linkedInvoice")}:</span>
              <Badge variant="secondary" className="text-xs">
                {appointment.invoice.displayId}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {t(`invoices.statuses.${appointment.invoice.invoiceStatus}`)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
