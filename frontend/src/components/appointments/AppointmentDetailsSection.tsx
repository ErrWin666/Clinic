import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FormSection } from "@/components/common/FormSection";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ClipboardIcon,
  TagIcon,
  MessageSquareIcon,
  StickyNoteIcon,
} from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import type { AppointmentFormValues } from "@/schemas/appointmentSchema";
import { APPOINTMENT_TYPES } from "@/schemas/appointmentSchema";
import { translateZodError } from "@/lib/zodError";

type FormType = UseFormReturn<AppointmentFormValues>;
type AppointmentType = (typeof APPOINTMENT_TYPES)[number];

interface AppointmentDetailsSectionProps {
  register: FormType["register"];
  watch: FormType["watch"];
  setValue: FormType["setValue"];
  errors: FormType["formState"]["errors"];
}

export function AppointmentDetailsSection({
  register,
  watch,
  setValue,
  errors,
}: AppointmentDetailsSectionProps) {
  const { t } = useTranslation();
  const [customType, setCustomType] = useState("");
  const watchType = watch("appointmentType");
  const isCustomType =
    !APPOINTMENT_TYPES.includes(watchType as AppointmentType) && !!watchType;

  return (
    <FormSection
      icon={ClipboardIcon}
      title={t("appointments.fields.appointmentType")}
      accentClass="bg-amber-500/10 text-amber-600 dark:text-amber-400"
    >
      <Field>
        <FieldLabel htmlFor="appointmentType" className="flex items-center gap-1.5">
          <TagIcon className="size-3.5 text-muted-foreground" />
          {t("appointments.fields.appointmentType")}
        </FieldLabel>
        <Select
          value={isCustomType ? "other" : watchType || ""}
          onValueChange={(v) => {
            if (v === "other") {
              setValue("appointmentType", customType || "", { shouldValidate: true });
            } else if (v) {
              setCustomType("");
              setValue("appointmentType", v, { shouldValidate: true });
            }
          }}
        >
          <SelectTrigger id="appointmentType" data-invalid={!!errors.appointmentType}>
            <SelectValue placeholder={t("appointments.fields.appointmentType")} />
          </SelectTrigger>
          <SelectContent>
            {APPOINTMENT_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {t(`appointments.types.${type}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isCustomType && (
          <Input
            placeholder={t("appointments.fields.appointmentType")}
            value={customType || watchType || ""}
            onChange={(e) => {
              setCustomType(e.target.value);
              setValue("appointmentType", e.target.value, { shouldValidate: true });
            }}
            data-invalid={!!errors.appointmentType}
          />
        )}
        {errors.appointmentType && (
          <FieldError>{translateZodError(errors.appointmentType.message)}</FieldError>
        )}
      </Field>
      <Field>
        <FieldLabel htmlFor="reason" className="flex items-center gap-1.5">
          <MessageSquareIcon className="size-3.5 text-muted-foreground" />
          {t("appointments.fields.reason")}
        </FieldLabel>
        <Textarea id="reason" rows={2} placeholder="—" {...register("reason")} />
      </Field>
      <Field>
        <FieldLabel htmlFor="notes" className="flex items-center gap-1.5">
          <StickyNoteIcon className="size-3.5 text-muted-foreground" />
          {t("appointments.fields.notes")}
        </FieldLabel>
        <Textarea id="notes" rows={2} placeholder="—" {...register("notes")} />
      </Field>
    </FormSection>
  );
}
