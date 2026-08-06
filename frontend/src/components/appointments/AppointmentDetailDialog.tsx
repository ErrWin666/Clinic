import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { DialogHeaderWithIcon } from "@/components/common/DialogHeaderWithIcon";
import type { IconBadgeVariant } from "@/components/common/IconBadge";
import { Badge } from "@/components/ui/badge";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { AppointmentInfoGrid } from "./AppointmentInfoGrid";
import { AppointmentActions } from "./AppointmentActions";
import {
  useChangeAppointmentStatus,
  useLinkPatient,
  useDeleteAppointment,
  useConfirmAppointment,
} from "@/hooks/useAppointments";
import type { Appointment } from "@/types/models";
import type { AppointmentStatus } from "@/types/enums";
import { CalendarIcon } from "lucide-react";

interface AppointmentDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
  onEdit: (appointment: Appointment) => void;
  onCreateExamination?: (appointment: Appointment) => void;
  onCreateInvoice?: (appointment: Appointment) => void;
}

const STATUS_BADGE_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  upcoming: "default",
  confirmed: "default",
  completed: "secondary",
  cancelled: "destructive",
  "no-show": "outline",
  rescheduled: "outline",
};

const STATUS_ICON_VARIANT: Record<string, IconBadgeVariant> = {
  upcoming: "primary",
  confirmed: "success",
  completed: "success",
  cancelled: "destructive",
  "no-show": "primary",
  rescheduled: "warning",
};

export function AppointmentDetailDialog({
  open,
  onOpenChange,
  appointment,
  onEdit,
  onCreateExamination,
  onCreateInvoice,
}: AppointmentDetailDialogProps) {
  const { t } = useTranslation();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [localAppointment, setLocalAppointment] = useState<Appointment | null>(appointment);

  // Sync local state when the incoming appointment prop changes (e.g. dialog reopened with another appointment)
  // This is the documented React pattern for resetting state on prop change when `key` remounting isn't feasible.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalAppointment(appointment);
  }, [appointment]);

  const { changeStatus, isChangingStatus } = useChangeAppointmentStatus();
  const { linkPatient, isLinking } = useLinkPatient();
  const { deleteAppointment, isDeleting } = useDeleteAppointment();
  const { confirmAppointment, isConfirming } = useConfirmAppointment();

  if (!localAppointment) return null;

  const current = localAppointment;
  const patientName = current.patient?.fullName ?? current.quickName ?? "—";
  const isQuick = !current.patientId && !!current.quickName;

  const handleStatusChange = async (status: string | null) => {
    if (!status) return;
    await changeStatus({ id: current.id, status });
    setLocalAppointment((prev) => (prev ? { ...prev, status: status as AppointmentStatus } : prev));
  };

  const handleLinkPatient = async (patientId: number) => {
    await linkPatient({ id: current.id, patientId });
    onOpenChange(false);
  };

  const handleDelete = async () => {
    await deleteAppointment(current.id);
    setDeleteOpen(false);
    onOpenChange(false);
  };

  const handleEdit = () => {
    onOpenChange(false);
    onEdit(current);
  };

  const handleConfirm = async () => {
    await confirmAppointment(current.id);
    setLocalAppointment((prev) => (prev ? { ...prev, status: "confirmed" } : prev));
  };

  const handleMarkNoShow = async () => {
    await changeStatus({ id: current.id, status: "no-show" });
    setLocalAppointment((prev) => (prev ? { ...prev, status: "no-show" } : prev));
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-hidden flex flex-col p-0">
          <DialogHeaderWithIcon
            icon={CalendarIcon}
            variant={STATUS_ICON_VARIANT[current.status] ?? "primary"}
            headerClassName="px-6 py-4 border-b border-border/50 shrink-0"
            title={<span className="truncate">{current.displayId}</span>}
            titleExtra={
              <Badge variant={STATUS_BADGE_VARIANT[current.status] ?? "default"} className="ml-auto">
                {t(`appointments.statuses.${current.status}`)}
              </Badge>
            }
            description={`${dayjs(current.appointmentDate).format("YYYY-MM-DD")} · ${current.startTime} — ${current.endTime}`}
          />

          <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4 min-h-0">
            <AppointmentInfoGrid
              appointment={current}
              patientName={patientName}
              isQuick={isQuick}
            />

            <AppointmentActions
              appointment={current}
              isQuick={isQuick}
              isConfirming={isConfirming}
              isChangingStatus={isChangingStatus}
              isLinking={isLinking}
              onConfirm={handleConfirm}
              onMarkNoShow={handleMarkNoShow}
              onStatusChange={handleStatusChange}
              onCreateExamination={onCreateExamination}
              onCreateInvoice={onCreateInvoice}
              onLinkPatient={handleLinkPatient}
              onEdit={handleEdit}
              onDelete={() => setDeleteOpen(true)}
              onOpenChange={onOpenChange}
            />
          </div>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={deleteOpen}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
        itemName={current.displayId}
        itemType="appointments.delete"
        isPending={isDeleting}
      />
    </>
  );
}
