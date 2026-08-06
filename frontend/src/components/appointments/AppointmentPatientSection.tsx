import { useTranslation } from "react-i18next";
import { FormSection } from "@/components/common/FormSection";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { PatientCombobox } from "@/components/common/PatientCombobox";
import { translateZodError } from "@/lib/zodError";
import {
  UsersIcon,
  UserIcon,
  PhoneIcon,
  SearchIcon,
} from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import type { AppointmentFormValues } from "@/schemas/appointmentSchema";

type FormType = UseFormReturn<AppointmentFormValues>;

interface AppointmentPatientSectionProps {
  register: FormType["register"];
  watch: FormType["watch"];
  setValue: FormType["setValue"];
  errors: FormType["formState"]["errors"];
  isQuickMode: boolean;
  setIsQuickMode: (v: boolean) => void;
}

export function AppointmentPatientSection({
  register,
  watch,
  setValue,
  errors,
  isQuickMode,
  setIsQuickMode,
}: AppointmentPatientSectionProps) {
  const { t } = useTranslation();
  const watchPatientId = watch("patientId");

  return (
    <FormSection
      icon={UsersIcon}
      title={isQuickMode
        ? t("appointments.quickAppointment")
        : t("appointments.fields.patient")}
      accentClass="bg-blue-500/10 text-blue-600 dark:text-blue-400"
      action={
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {t("appointments.quickAppointment")}
          </span>
          <Switch
            checked={isQuickMode}
            onCheckedChange={(checked) => {
              setIsQuickMode(checked);
              if (checked) {
                setValue("patientId", undefined);
              } else {
                setValue("quickName", "");
                setValue("quickPhone", "");
              }
            }}
          />
        </div>
      }
    >
      {isQuickMode ? (
        <div className="flex flex-col gap-4">
          <Field>
            <FieldLabel className="flex items-center gap-1.5">
              <SearchIcon className="size-3.5 text-muted-foreground" />
              {t("appointments.form.patientMode")}
            </FieldLabel>
            <PatientCombobox
              value={null}
              onChange={(id) => {
                if (id) {
                  // Link the patient directly instead of copying data into quick fields
                  setIsQuickMode(false);
                  setValue("patientId", id, { shouldValidate: true });
                  setValue("quickName", "");
                  setValue("quickPhone", "");
                }
              }}
              placeholder={t("appointments.form.quickMode")}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="quickName" className="flex items-center gap-1.5">
                <UserIcon className="size-3.5 text-muted-foreground" />
                {t("appointments.fields.quickName")}
              </FieldLabel>
              <Input
                id="quickName"
                placeholder="—"
                data-invalid={!!errors.quickName}
                {...register("quickName")}
              />
              {errors.quickName && (
                <FieldError>{translateZodError(errors.quickName.message)}</FieldError>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="quickPhone" className="flex items-center gap-1.5">
                <PhoneIcon className="size-3.5 text-muted-foreground" />
                {t("appointments.fields.quickPhone")}
              </FieldLabel>
              <Input
                id="quickPhone"
                placeholder="—"
                data-invalid={!!errors.quickPhone}
                {...register("quickPhone")}
              />
              {errors.quickPhone && (
                <FieldError>{translateZodError(errors.quickPhone.message)}</FieldError>
              )}
            </Field>
          </div>
        </div>
      ) : (
        <Field>
          <FieldLabel className="flex items-center gap-1.5">
            <UsersIcon className="size-3.5 text-muted-foreground" />
            {t("appointments.fields.patient")}
          </FieldLabel>
          <PatientCombobox
            value={watchPatientId ?? null}
            onChange={(id) =>
              setValue("patientId", id ?? undefined, {
                shouldValidate: true,
              })
            }
          />
          {errors.patientId && (
            <FieldError>{translateZodError(errors.patientId.message)}</FieldError>
          )}
        </Field>
      )}
    </FormSection>
  );
}
