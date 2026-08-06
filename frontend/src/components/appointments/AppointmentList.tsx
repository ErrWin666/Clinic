import { useState } from "react";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { usePatientAppointments } from "@/hooks/usePatientAppointments";
import {
  useChangeAppointmentStatus,
  useDeleteAppointment,
} from "@/hooks/useAppointments";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { AppointmentForm } from "@/components/appointments/AppointmentForm";
import { AppointmentDetailDialog } from "@/components/appointments/AppointmentDetailDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { ENUMS } from "@/types/enums";
import type { Appointment } from "@/types/models";
import {
  CalendarIcon,
  CalendarPlusIcon,
  MoreVerticalIcon,
  PencilIcon,
  EyeIcon,
  Trash2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";

const STATUS_BADGE_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  upcoming: "default",
  confirmed: "default",
  completed: "secondary",
  cancelled: "destructive",
  "no-show": "outline",
  rescheduled: "outline",
};

interface AppointmentListProps {
  patientId: number;
}

export function AppointmentList({ patientId }: AppointmentListProps) {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailAppointment, setDetailAppointment] = useState<Appointment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Appointment | null>(null);

  const {
    appointments,
    pagination,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = usePatientAppointments({ patientId, page });

  const { changeStatus, isChangingStatus } = useChangeAppointmentStatus();
  const { deleteAppointment, isDeleting } = useDeleteAppointment();

  const handleNew = () => {
    setEditingAppointment(null);
    setFormOpen(true);
  };

  const handleEdit = (apt: Appointment) => {
    setEditingAppointment(apt);
    setFormOpen(true);
  };

  const handleView = (apt: Appointment) => {
    setDetailAppointment(apt);
    setDetailOpen(true);
  };

  const handleStatusChange = async (apt: Appointment, status: string) => {
    await changeStatus({ id: apt.id, status });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteAppointment(deleteTarget.id);
    setDeleteTarget(null);
  };

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <CalendarIcon className="size-4" />
          </div>
          <h3 className="text-sm font-semibold tracking-tight">
            {t("appointments.title")}
          </h3>
        </div>
        <Button size="sm" onClick={handleNew}>
          <CalendarPlusIcon className="size-4" />
          {t("appointments.add")}
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col gap-2 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : appointments.length === 0 ? (
            <EmptyState
              icon={<CalendarIcon className="size-7" />}
              title="appointments.empty"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">{t("appointments.fields.appointmentDate")}</TableHead>
                  <TableHead>{t("appointments.fields.time")}</TableHead>
                  <TableHead>{t("appointments.fields.appointmentType")}</TableHead>
                  <TableHead>{t("appointments.fields.status")}</TableHead>
                  <TableHead className="hidden md:table-cell">ID</TableHead>
                  <TableHead className="w-[40px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map((apt, index) => (
                  <TableRow
                    key={apt.id}
                    className={`cursor-pointer animate-in fade-in slide-in-from-bottom-1 duration-200 ${isFetching ? "opacity-60" : ""}`}
                    style={{ animationDelay: `${index * 30}ms` }}
                    onClick={() => handleView(apt)}
                  >
                    <TableCell className="font-medium">
                      {dayjs(apt.appointmentDate).format("YYYY-MM-DD")}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {apt.startTime} - {apt.endTime}
                    </TableCell>
                    <TableCell>{t(`appointments.types.${apt.appointmentType}`)}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_BADGE_VARIANT[apt.status] ?? "default"}>
                        {t(`appointments.statuses.${apt.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell font-mono text-xs text-muted-foreground">
                      {apt.displayId}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" size="icon-sm" className="size-7" aria-label={t("common.actions")} />
                        }
                      >
                        <MoreVerticalIcon className="size-4" />
                      </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleView(apt)}>
                            <EyeIcon className="size-4" />
                            {t("appointments.view")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(apt)}>
                            <PencilIcon className="size-4" />
                            {t("common.edit")}
                          </DropdownMenuItem>
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                              {t("appointments.changeStatus")}
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                              {ENUMS.APPOINTMENT_STATUS.map((status) => (
                                <DropdownMenuItem
                                  key={status}
                                  onClick={() => handleStatusChange(apt, status)}
                                  disabled={isChangingStatus}
                                >
                                  {t(`appointments.statuses.${status}`)}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteTarget(apt)}
                          >
                            <Trash2Icon className="size-4" />
                            {t("common.delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <span className="text-xs text-muted-foreground">
            {t("common.pagination.page", {
              current: pagination.currentPage,
              total: pagination.totalPages,
            })}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.currentPage <= 1 || isFetching}
              onClick={() => setPage(pagination.currentPage - 1)}
            >
              <ChevronLeftIcon className="size-4 rtl:rotate-180" />
            </Button>
            <span className="px-2 text-sm font-medium">
              {pagination.currentPage} / {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.currentPage >= pagination.totalPages || isFetching}
              onClick={() => setPage(pagination.currentPage + 1)}
            >
              <ChevronRightIcon className="size-4 rtl:rotate-180" />
            </Button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <AppointmentForm
        open={formOpen}
        onOpenChange={setFormOpen}
        appointment={editingAppointment}
        patientId={patientId}
      />

      <AppointmentDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        appointment={detailAppointment}
        onEdit={(apt) => {
          setDetailOpen(false);
          handleEdit(apt);
        }}
      />

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        itemName={deleteTarget?.displayId ?? ""}
        itemType="appointments.delete"
        isPending={isDeleting}
      />
    </div>
  );
}
