import { useTranslation } from "react-i18next";
import { FormSection } from "@/components/common/FormSection";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { PatientCombobox } from "@/components/common/PatientCombobox";
import type { UseFormReturn } from "react-hook-form";
import type { InvoiceFormValues } from "@/types/invoice";

type FormType = UseFormReturn<InvoiceFormValues>;

interface InvoiceBillToSectionProps {
  register: FormType["register"];
  watch: FormType["watch"];
  setValue: FormType["setValue"];
  errors: FormType["formState"]["errors"];
  linkToPatient: boolean;
  setLinkToPatient: (v: boolean) => void;
  onSelectPatient: (patient: { id: number; fullName: string; address?: string | null; phoneNumber?: string | null; email?: string | null } | null) => void;
}

export function InvoiceBillToSection({
  register,
  watch,
  setValue,
  errors,
  linkToPatient,
  setLinkToPatient,
  onSelectPatient,
}: InvoiceBillToSectionProps) {
  const { t } = useTranslation();

  return (
    <FormSection
      title={`${t("invoices.fields.patient")}/${t("invoices.fields.customer")}`}
      accentClass="bg-muted text-muted-foreground"
      action={
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {t("invoices.linkToPatient")}
          </span>
          <Switch
            checked={linkToPatient}
            onCheckedChange={setLinkToPatient}
          />
        </div>
      }
    >
      {linkToPatient ? (
        <Field>
          <FieldLabel>{t("invoices.fields.patient")}</FieldLabel>
          <PatientCombobox
            value={watch("patientId") ?? null}
            onChange={(id) =>
              setValue("patientId", id ?? undefined, { shouldValidate: true })
            }
            onSelect={(patient) =>
              onSelectPatient(
                patient
                  ? { id: patient.id, fullName: patient.fullName, address: patient.address, phoneNumber: patient.phoneNumber, email: patient.email }
                  : null
              )
            }
          />
          {errors.patientId && (
            <FieldError>
              {t("invoices.errors.PATIENT_OR_CUSTOMER_REQUIRED")}
            </FieldError>
          )}
        </Field>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field>
            <FieldLabel>{t("invoices.fields.customerName")}</FieldLabel>
            <Input
              {...register("customerName")}
              data-invalid={!!errors.customerName}
            />
            {errors.customerName && (
              <FieldError>
                {t("invoices.errors.PATIENT_OR_CUSTOMER_REQUIRED")}
              </FieldError>
            )}
          </Field>
          <Field>
            <FieldLabel>{t("invoices.fields.customerPhone")}</FieldLabel>
            <Input {...register("customerPhone")} />
          </Field>
        </div>
      )}
    </FormSection>
  );
}
