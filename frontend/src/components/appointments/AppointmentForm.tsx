import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import dayjs from "dayjs";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { DialogHeaderWithIcon } from "@/components/common/DialogHeaderWithIcon";
import {
  Field,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { FormSection } from "@/components/common/FormSection";
import { FormFooter } from "@/components/common/FormFooter";
import { translateZodError } from "@/lib/zodError";
import { TimeSlotPicker } from "./TimeSlotPicker";
import { AppointmentPatientSection } from "./AppointmentPatientSection";
import { AppointmentDetailsSection } from "./AppointmentDetailsSection";
import {
  useCreateAppointment,
  useUpdateAppointment,
  useAvailableSlots,
} from "@/hooks/useAppointments";
import type { Appointment } from "@/types/models";
import type { TimeSlot } from "@/services/AppointmentService";
import {
  CalendarIcon,
  CalendarClockIcon,
  ClockIcon,
} from "lucide-react";
import {
  appointmentSchema,
  type AppointmentFormValues,
} from "@/schemas/appointmentSchema";

interface AppointmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment?: Appointment | null;
  defaultSlot?: { start: Date; end: Date };
  patientId?: number;
}

export function AppointmentForm({
  open,
  onOpenChange,
  appointment,
  defaultSlot,
  patientId,
}: AppointmentFormProps) {
  const { t } = useTranslation();
  const isEdit = !!appointment;
  const { createAppointment, isCreating } = useCreateAppointment();
  const { updateAppointment, isUpdating } = useUpdateAppointment();
  const isSubmitting = isCreating || isUpdating;
  const [isQuickMode, setIsQuickMode] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    mode: "onBlur",
    defaultValues: {
      appointmentDate: "",
      startTime: "09:00",
      endTime: "09:30",
      appointmentType: "",
      reason: "",
      notes: "",
      patientId: undefined,
      quickName: "",
      quickPhone: "",
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = form;

  const watchDate = watch("appointmentDate");
  const watchType = watch("appointmentType");
  const { slots, isLoading: isLoadingSlots } = useAvailableSlots(
    watchDate || undefined,
    watchType || undefined
  );

  useEffect(() => {
    if (open) {
      setSelectedSlot(null);
      if (appointment) {
        reset({
          appointmentDate: dayjs(appointment.appointmentDate).format("YYYY-MM-DD"),
          startTime: appointment.startTime,
          endTime: appointment.endTime,
          appointmentType: appointment.appointmentType,
          reason: appointment.reason ?? "",
          notes: appointment.notes ?? "",
          patientId: appointment.patientId ?? undefined,
          quickName: appointment.quickName ?? "",
          quickPhone: appointment.quickPhone ?? "",
        });
        setIsQuickMode(!appointment.patientId && (!!appointment.quickName || !!appointment.quickPhone));
      } else if (defaultSlot) {
        reset({
          appointmentDate: dayjs(defaultSlot.start).format("YYYY-MM-DD"),
          startTime: dayjs(defaultSlot.start).format("HH:mm"),
          endTime: dayjs(defaultSlot.end).format("HH:mm"),
          appointmentType: "",
          reason: "",
          notes: "",
          patientId: patientId ?? undefined,
          quickName: "",
          quickPhone: "",
        });
        setIsQuickMode(!patientId);
      } else {
        reset({
          appointmentDate: dayjs().format("YYYY-MM-DD"),
          startTime: "09:00",
          endTime: "09:30",
          appointmentType: "",
          reason: "",
          notes: "",
          patientId: patientId ?? undefined,
          quickName: "",
          quickPhone: "",
        });
        setIsQuickMode(!patientId);
      }
    }
  }, [open, appointment, defaultSlot, patientId, reset]);

  const onSubmit = async (values: AppointmentFormValues) => {
    const payload = {
      ...values,
      patientId: values.patientId ?? null,
      quickName: values.quickName || null,
      quickPhone: values.quickPhone || null,
      reason: values.reason || null,
      notes: values.notes || null,
    };

    if (isEdit && appointment) {
      await updateAppointment({ id: appointment.id, data: payload });
    } else {
      await createAppointment(payload);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeaderWithIcon
          icon={CalendarClockIcon}
          variant="primary"
          title={isEdit ? t("appointments.edit") : t("appointments.add")}
          description={t("appointments.form.description")}
        />

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto px-1 min-h-0">
            <div className="flex flex-col gap-5">
              <AppointmentPatientSection
                register={register}
                watch={watch}
                setValue={setValue}
                errors={errors}
                isQuickMode={isQuickMode}
                setIsQuickMode={setIsQuickMode}
              />

              {/* Date & Time card */}
              <FormSection
                icon={CalendarIcon}
                title={`${t("appointments.fields.appointmentDate")} & ${t("appointments.fields.time")}`}
                accentClass="bg-primary/10 text-primary"
                contentClassName="grid grid-cols-3 gap-4 p-4"
              >
                <Field>
                  <FieldLabel htmlFor="appointmentDate" className="flex items-center gap-1.5">
                    <CalendarIcon className="size-3.5 text-muted-foreground" />
                    {t("appointments.fields.appointmentDate")}
                  </FieldLabel>
                  <Input
                    id="appointmentDate"
                    type="date"
                    data-invalid={!!errors.appointmentDate}
                    {...register("appointmentDate")}
                  />
                  {errors.appointmentDate && (
                    <FieldError>{translateZodError(errors.appointmentDate.message)}</FieldError>
                  )}
                </Field>
                <Field>
                  <FieldLabel htmlFor="startTime" className="flex items-center gap-1.5">
                    <ClockIcon className="size-3.5 text-muted-foreground" />
                    {t("appointments.fields.startTime")}
                  </FieldLabel>
                  <Input
                    id="startTime"
                    type="time"
                    data-invalid={!!errors.startTime}
                    {...register("startTime")}
                  />
                  {errors.startTime && (
                    <FieldError>{translateZodError(errors.startTime.message)}</FieldError>
                  )}
                </Field>
                <Field>
                  <FieldLabel htmlFor="endTime" className="flex items-center gap-1.5">
                    <ClockIcon className="size-3.5 text-muted-foreground" />
                    {t("appointments.fields.endTime")}
                  </FieldLabel>
                  <Input
                    id="endTime"
                    type="time"
                    data-invalid={!!errors.endTime}
                    {...register("endTime")}
                  />
                  {errors.endTime && (
                    <FieldError>{translateZodError(errors.endTime.message)}</FieldError>
                  )}
                </Field>
              </FormSection>

              {/* Available time slots */}
              {watchDate && watchType && (
                <Field>
                  <FieldLabel className="flex items-center gap-1.5">
                    <ClockIcon className="size-3.5 text-muted-foreground" />
                    {t("appointments.availableSlots")}
                  </FieldLabel>
                  <TimeSlotPicker
                    slots={slots}
                    selectedSlot={selectedSlot}
                    onSelect={(slot) => {
                      setSelectedSlot(slot);
                      setValue("startTime", slot.startTime, { shouldValidate: true });
                      setValue("endTime", slot.endTime, { shouldValidate: true });
                    }}
                    isLoading={isLoadingSlots}
                  />
                </Field>
              )}

              <AppointmentDetailsSection
                register={register}
                watch={watch}
                setValue={setValue}
                errors={errors}
              />
            </div>
          </div>

          <FormFooter
            onCancel={() => onOpenChange(false)}
            isSubmitting={isSubmitting}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}
