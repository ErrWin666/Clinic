import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EyeIcon, ReceiptIcon, CalendarIcon } from "lucide-react";
import type { Examination, Invoice, Appointment } from "@/types/models";

interface PatientActivityCardsProps {
  lastExam?: Examination;
  lastInvoice?: Invoice;
  nextAppointment?: Appointment;
}

export function PatientActivityCards({
  lastExam,
  lastInvoice,
  nextAppointment,
}: PatientActivityCardsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <Card className="shadow-sm border-border/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary/8 text-primary ring-1 ring-primary/10">
              <EyeIcon className="size-4" />
            </span>
            {t("patientProfile.lastExam")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lastExam ? (
            <div className="flex flex-col gap-1 text-sm">
              <span className="font-medium">{lastExam.displayId}</span>
              <span className="text-muted-foreground">
                {dayjs(lastExam.examDate).format("YYYY-MM-DD")}
              </span>
              <Badge variant="outline" className="w-fit mt-1">
                {t(`examinations.statuses.${lastExam.examStatus}`)}
              </Badge>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">
              {t("patientProfile.noExaminations")}
            </span>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm border-border/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary/8 text-primary ring-1 ring-primary/10">
              <ReceiptIcon className="size-4" />
            </span>
            {t("patientProfile.lastInvoice")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lastInvoice ? (
            <div className="flex flex-col gap-1 text-sm">
              <span className="font-medium">{lastInvoice.displayId}</span>
              <span className="text-muted-foreground">
                {dayjs(lastInvoice.invoiceDate).format("YYYY-MM-DD")}
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-medium">
                  {lastInvoice.totalAmount.toFixed(2)}
                </span>
                <Badge variant="outline">
                  {lastInvoice.invoiceStatus}
                </Badge>
              </div>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">
              {t("patientProfile.noInvoices")}
            </span>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm border-border/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary/8 text-primary ring-1 ring-primary/10">
              <CalendarIcon className="size-4" />
            </span>
            {t("patientProfile.nextAppointment")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {nextAppointment ? (
            <div className="flex flex-col gap-1 text-sm">
              <span className="font-medium">{nextAppointment.displayId}</span>
              <span className="text-muted-foreground">
                {dayjs(nextAppointment.appointmentDate).format("YYYY-MM-DD")}{" "}
                {nextAppointment.startTime}
              </span>
              <Badge variant="outline" className="w-fit mt-1">
                {nextAppointment.status}
              </Badge>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">
              {t("patientProfile.noAppointments")}
            </span>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
