import { useState } from "react";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { AppointmentCalendar } from "@/components/appointments/AppointmentCalendar";
import { AppointmentForm } from "@/components/appointments/AppointmentForm";
import { AppointmentDetailDialog } from "@/components/appointments/AppointmentDetailDialog";
import { AppointmentFilters } from "@/components/appointments/AppointmentFilters";
import { ExaminationForm } from "@/components/examinations/ExaminationForm";
import { InvoiceForm } from "@/components/invoices/InvoiceForm";
import { PageHeader } from "@/components/common/PageHeader";
import {
  useUpdateAppointment,
  useLinkExamination,
  useLinkInvoice,
} from "@/hooks/useAppointments";
import { useExaminations } from "@/hooks/useExaminations";
import { type ExaminationCreateData } from "@/services/ExaminationService";
import type { Appointment, Invoice } from "@/types/models";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarPlusIcon } from "lucide-react";

export function AppointmentsPage() {
  const { t } = useTranslation();
  const updateAppointment = useUpdateAppointment();
  const { linkExamination } = useLinkExamination();
  const { linkInvoice } = useLinkInvoice();

  const [formOpen, setFormOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [defaultSlot, setDefaultSlot] = useState<{ start: Date; end: Date } | undefined>();
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailAppointment, setDetailAppointment] = useState<Appointment | null>(null);

  // Examination form state
  const [examFormOpen, setExamFormOpen] = useState(false);
  const [examAppointment, setExamAppointment] = useState<Appointment | null>(null);
  const examPatientId = examAppointment?.patientId ?? 0;
  const { createExam, isCreating: isCreatingExam } = useExaminations({ patientId: examPatientId });

  // Invoice form state
  const [invoiceFormOpen, setInvoiceFormOpen] = useState(false);
  const [invoiceAppointment, setInvoiceAppointment] = useState<Appointment | null>(null);

  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [appointmentType, setAppointmentType] = useState("");

  const handleClearFilters = () => {
    setStatus("");
    setSearch("");
    setAppointmentType("");
  };

  const handleNewAppointment = () => {
    setEditingAppointment(null);
    setDefaultSlot(undefined);
    setFormOpen(true);
  };

  const handleEventClick = (appointment: Appointment) => {
    setDetailAppointment(appointment);
    setDetailOpen(true);
  };

  const handleSlotSelect = (slot: { start: Date; end: Date }) => {
    setEditingAppointment(null);
    setDefaultSlot(slot);
    setFormOpen(true);
  };

  const handleEdit = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setDefaultSlot(undefined);
    setFormOpen(true);
  };

  const handleCreateExamination = (appointment: Appointment) => {
    if (!appointment.patientId) return;
    setExamAppointment(appointment);
    setExamFormOpen(true);
  };

  const handleExamSubmit = async (data: Record<string, unknown>, _isEdit: boolean) => {
    if (!examAppointment?.patientId) return;
    const examData = data as ExaminationCreateData;
    const created = await createExam({ patientId: examAppointment.patientId, data: examData });
    if (created?.data?.id) {
      await linkExamination({ id: examAppointment.id, examinationId: created.data.id });
    }
  };

  const handleCreateInvoice = (appointment: Appointment) => {
    if (!appointment.patientId) return;
    setInvoiceAppointment(appointment);
    setInvoiceFormOpen(true);
  };

  const handleInvoiceCreated = async (invoice: Invoice) => {
    if (!invoiceAppointment) return;
    await linkInvoice({ id: invoiceAppointment.id, invoiceId: invoice.id });
  };

  const handleEventDrop = async (appointment: Appointment, newStart: Date, newEnd: Date) => {
    try {
      await updateAppointment.updateAppointment({
        id: appointment.id,
        data: {
          appointmentDate: dayjs(newStart).format("YYYY-MM-DD"),
          startTime: dayjs(newStart).format("HH:mm"),
          endTime: dayjs(newEnd).format("HH:mm"),
        },
      });
    } catch {
      // error already handled by mutation onError (toast)
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        icon={CalendarPlusIcon}
        title={t("appointments.title")}
        description={t("appointments.form.description")}
        actions={
          <Button onClick={handleNewAppointment}>
            <CalendarPlusIcon className="size-4" />
            {t("appointments.add")}
          </Button>
        }
      />

      {/* Filters */}
      <Card className="shadow-card border-border/60 transition-all duration-300 hover:shadow-hover">
        <CardContent className="p-4">
          <AppointmentFilters
            status={status}
            setStatus={setStatus}
            search={search}
            setSearch={setSearch}
            appointmentType={appointmentType}
            setAppointmentType={setAppointmentType}
            onClear={handleClearFilters}
          />
        </CardContent>
      </Card>

      {/* Calendar */}
      <AppointmentCalendar
        onEventClick={handleEventClick}
        onSlotSelect={handleSlotSelect}
        onEventDrop={handleEventDrop}
        filters={{ status, search, appointmentType }}
      />

      {/* Dialogs */}
      <AppointmentForm
        open={formOpen}
        onOpenChange={setFormOpen}
        appointment={editingAppointment}
        defaultSlot={defaultSlot}
      />

      <AppointmentDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        appointment={detailAppointment}
        onEdit={handleEdit}
        onCreateExamination={handleCreateExamination}
        onCreateInvoice={handleCreateInvoice}
      />

      {/* Examination form (opened from appointment) */}
      {examAppointment?.patientId ? (
        <ExaminationForm
          open={examFormOpen}
          onOpenChange={setExamFormOpen}
          onSubmit={handleExamSubmit}
          isPending={isCreatingExam}
          patientId={examAppointment.patientId}
        />
      ) : null}

      {/* Invoice form (opened from appointment) */}
      {invoiceAppointment?.patientId ? (
        <InvoiceForm
          open={invoiceFormOpen}
          onOpenChange={setInvoiceFormOpen}
          patientId={invoiceAppointment.patientId}
          onCreated={handleInvoiceCreated}
        />
      ) : null}
    </div>
  );
}
