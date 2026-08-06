import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { PatientCombobox } from "@/components/common/PatientCombobox";
import type { Appointment } from "@/types/models";
import {
  CheckCircleIcon,
  XCircleIcon,
  FileTextIcon,
  ReceiptIcon,
  LinkIcon,
  PencilIcon,
  Trash2Icon,
  ChevronDownIcon,
  Loader2Icon,
} from "lucide-react";

const VALID_TRANSITIONS: Record<string, string[]> = {
  upcoming: ["confirmed", "cancelled", "no-show", "rescheduled", "completed"],
  confirmed: ["completed", "cancelled", "no-show", "rescheduled"],
  completed: [],
  cancelled: ["upcoming"],
  "no-show": ["upcoming", "cancelled"],
  rescheduled: ["upcoming", "confirmed", "cancelled"],
};

const TERMINAL_STATUSES = ["completed", "cancelled"];

// Color classes for each status — used for the pill buttons
const STATUS_PILL_STYLES: Record<string, string> = {
  upcoming: "bg-blue-500/10 text-blue-700 dark:text-blue-300 ring-blue-500/20 hover:bg-blue-500/20",
  confirmed: "bg-teal-500/10 text-teal-700 dark:text-teal-300 ring-teal-500/20 hover:bg-teal-500/20",
  completed: "bg-green-500/10 text-green-700 dark:text-green-300 ring-green-500/20 hover:bg-green-500/20",
  cancelled: "bg-red-500/10 text-red-700 dark:text-red-300 ring-red-500/20 hover:bg-red-500/20",
  "no-show": "bg-muted text-muted-foreground ring-border/40 hover:bg-muted/80",
  rescheduled: "bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-amber-500/20 hover:bg-amber-500/20",
};

const STATUS_DOT: Record<string, string> = {
  upcoming: "bg-blue-500",
  confirmed: "bg-teal-500",
  completed: "bg-green-500",
  cancelled: "bg-red-500",
  "no-show": "bg-muted-foreground",
  rescheduled: "bg-amber-500",
};

interface AppointmentActionsProps {
  appointment: Appointment;
  isQuick: boolean;
  isConfirming: boolean;
  isChangingStatus: boolean;
  isLinking: boolean;
  onConfirm: () => void;
  onMarkNoShow: () => void;
  onStatusChange: (status: string | null) => void;
  onCreateExamination?: (appointment: Appointment) => void;
  onCreateInvoice?: (appointment: Appointment) => void;
  onLinkPatient: (patientId: number) => void;
  onEdit: () => void;
  onDelete: () => void;
  onOpenChange: (open: boolean) => void;
}

export function AppointmentActions({
  appointment,
  isQuick,
  isConfirming,
  isChangingStatus,
  isLinking,
  onConfirm,
  onMarkNoShow,
  onStatusChange,
  onCreateExamination,
  onCreateInvoice,
  onLinkPatient,
  onEdit,
  onDelete,
  onOpenChange,
}: AppointmentActionsProps) {
  const { t } = useTranslation();
  const [showLinkPatient, setShowLinkPatient] = useState(false);
  const [statusPickerOpen, setStatusPickerOpen] = useState(false);

  const allowedTransitions = VALID_TRANSITIONS[appointment.status] ?? [];
  const isTerminal = TERMINAL_STATUSES.includes(appointment.status);

  return (
    <div className="flex flex-col gap-3">
      {/* Quick actions: Confirm + No-show — only for upcoming */}
      {appointment.status === "upcoming" && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onConfirm}
            disabled={isConfirming || isChangingStatus}
          >
            <CheckCircleIcon className="size-4" />
            {t("appointments.confirm")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-muted-foreground"
            onClick={onMarkNoShow}
            disabled={isConfirming || isChangingStatus}
          >
            <XCircleIcon className="size-4" />
            {t("appointments.markNoShow")}
          </Button>
        </div>
      )}

      {/* Create examination/invoice — only if patientId exists and not yet linked */}
      {(appointment.patientId && !appointment.examinationId && onCreateExamination) ||
      (appointment.patientId && !appointment.invoiceId && onCreateInvoice) ? (
        <div className="flex items-center gap-2 border-t border-border/40 pt-3">
          {appointment.patientId && !appointment.examinationId && onCreateExamination && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => {
                onOpenChange(false);
                onCreateExamination(appointment);
              }}
            >
              <FileTextIcon className="size-4" />
              {t("appointments.createExamination")}
            </Button>
          )}
          {appointment.patientId && !appointment.invoiceId && onCreateInvoice && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => {
                onOpenChange(false);
                onCreateInvoice(appointment);
              }}
            >
              <ReceiptIcon className="size-4" />
              {t("appointments.createInvoice")}
            </Button>
          )}
        </div>
      ) : null}

      {/* Change status — hidden for terminal statuses */}
      {!isTerminal && allowedTransitions.length > 0 && (
        <div className="border-t border-border/40 pt-3">
          <button
            type="button"
            onClick={() => setStatusPickerOpen((v) => !v)}
            className="flex w-full items-center justify-between rounded-lg px-1 py-0.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <span className="flex items-center gap-1.5 font-medium">
              <span className={`size-2 rounded-full ${STATUS_DOT[appointment.status] ?? "bg-muted-foreground"}`} />
              {t("appointments.changeStatus")}
            </span>
            <ChevronDownIcon
              className={`size-4 transition-transform ${statusPickerOpen ? "rotate-180" : ""}`}
            />
          </button>

          {statusPickerOpen && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {allowedTransitions.map((status) => (
                <button
                  key={status}
                  type="button"
                  disabled={isChangingStatus}
                  onClick={() => {
                    onStatusChange(status);
                    setStatusPickerOpen(false);
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 transition-colors disabled:opacity-50 ${STATUS_PILL_STYLES[status] ?? STATUS_PILL_STYLES["upcoming"]}`}
                >
                  <span className={`size-1.5 rounded-full ${STATUS_DOT[status] ?? "bg-muted-foreground"}`} />
                  {t(`appointments.statuses.${status}`)}
                </button>
              ))}
              {isChangingStatus && (
                <Loader2Icon className="size-4 animate-spin text-muted-foreground self-center" />
              )}
            </div>
          )}
        </div>
      )}

      {/* Link patient (quick appointment only) */}
      {isQuick && (
        <div className="border-t border-border/40 pt-3">
          {!showLinkPatient ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setShowLinkPatient(true)}
            >
              <LinkIcon className="size-4" />
              {t("appointments.linkPatient")}
            </Button>
          ) : (
            <div className="flex flex-col gap-2">
              <PatientCombobox
                value={null}
                onChange={(id) => id && onLinkPatient(id)}
                placeholder={t("appointments.linkPatient")}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLinkPatient(false)}
                disabled={isLinking}
              >
                {t("common.cancel")}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Management: Edit + Delete */}
      <div className="flex items-center justify-end gap-1 border-t border-border/40 pt-3">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 px-2.5 text-muted-foreground hover:text-foreground"
          onClick={onEdit}
        >
          <PencilIcon className="size-3.5" />
          {t("common.edit")}
        </Button>
        <div className="mx-0.5 h-4 w-px bg-border/50" />
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 px-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/5"
          onClick={onDelete}
        >
          <Trash2Icon className="size-3.5" />
          {t("common.delete")}
        </Button>
      </div>
    </div>
  );
}
