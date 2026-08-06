import { lazy, Suspense, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { DialogHeaderWithIcon } from "@/components/common/DialogHeaderWithIcon";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
const NotesEditor = lazy(() => import("@/components/patients/NotesEditor").then(m => ({ default: m.NotesEditor })));
import { FormSection } from "@/components/common/FormSection";
import { FormFooter } from "@/components/common/FormFooter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  UserIcon,
  MailIcon,
  StickyNoteIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  VenusIcon,
  MarsIcon,
  ShieldIcon,
  BabyIcon,
  UserCircleIcon,
} from "lucide-react";
import type { Patient } from "@/types/models";
import { patientSchema, type PatientFormValues, DEFAULT_PATIENT_VALUES, buildPatientDefaults } from "@/schemas/patientSchema";
import { translateZodError } from "@/lib/zodError";

interface PatientFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient?: Patient | null;
  onSubmit: (data: PatientFormValues, isEdit: boolean) => Promise<void>;
  isPending: boolean;
}

export function PatientForm({
  open,
  onOpenChange,
  patient,
  onSubmit,
  isPending,
}: PatientFormProps) {
  const { t } = useTranslation();
  const isEdit = !!patient;

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    mode: "onBlur",
    defaultValues: DEFAULT_PATIENT_VALUES,
  });

  useEffect(() => {
    if (open) {
      form.reset(buildPatientDefaults(patient));
    }
  }, [open, patient, form]);

  const handleSubmit = async (values: PatientFormValues) => {
    const payload = {
      ...values,
      email: values.email || null,
      address: values.address || null,
      notes: values.notes || null,
    };
    await onSubmit(payload as PatientFormValues, isEdit);
    onOpenChange(false);
  };

  const errors = form.formState.errors;
  const watchGender = form.watch("gender");
  const watchPatientType = form.watch("patientType");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[85vh] max-w-2xl overflow-hidden flex flex-col sm:max-w-2xl"
        data-slot="patient-form"
      >
        <DialogHeaderWithIcon
          icon={UserCircleIcon}
          variant="primary"
          title={isEdit ? t("patients.edit") : t("patients.add")}
          description={t("patients.form.description")}
        />

        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto px-1 min-h-0">
            <FieldGroup className="gap-5">
              {/* Section: Basic Information */}
              <FormSection
                icon={UserIcon}
                title={t("patients.form.sections.basic")}
                accentClass="bg-primary/10 text-primary"
              >
                <Field>
                  <FieldLabel htmlFor="fullName">
                    {t("patients.fields.fullName")}
                  </FieldLabel>
                  <Input
                    id="fullName"
                    placeholder={t("patients.fields.fullName")}
                    data-invalid={!!errors.fullName}
                    aria-invalid={!!errors.fullName}
                    {...form.register("fullName")}
                  />
                  {errors.fullName && (
                    <FieldError>{translateZodError(errors.fullName.message)}</FieldError>
                  )}
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="birthDate" className="flex items-center gap-1.5">
                      <CalendarIcon className="size-3.5 text-muted-foreground" />
                      {t("patients.fields.birthDate")}
                    </FieldLabel>
                    <Input
                      id="birthDate"
                      type="date"
                      data-invalid={!!errors.birthDate}
                      aria-invalid={!!errors.birthDate}
                      {...form.register("birthDate")}
                    />
                    {errors.birthDate && (
                      <FieldError>{translateZodError(errors.birthDate.message)}</FieldError>
                    )}
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="gender">
                      {t("patients.fields.gender")}
                    </FieldLabel>
                    <Select
                      value={watchGender}
                      onValueChange={(v) => form.setValue("gender", v as "male" | "female")}
                    >
                      <SelectTrigger id="gender" aria-invalid={!!errors.gender}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">
                          <span className="flex items-center gap-2">
                            <MarsIcon className="size-3.5 text-blue-500" />
                            {t("patients.genders.male")}
                          </span>
                        </SelectItem>
                        <SelectItem value="female">
                          <span className="flex items-center gap-2">
                            <VenusIcon className="size-3.5 text-pink-500" />
                            {t("patients.genders.female")}
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.gender && (
                      <FieldError>{translateZodError(errors.gender.message)}</FieldError>
                    )}
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="patientType">
                      {t("patients.fields.patientType")}
                    </FieldLabel>
                    <Select
                      value={watchPatientType}
                      onValueChange={(v) => form.setValue("patientType", v as "regular" | "guardian" | "child")}
                      disabled={isEdit && (patient?.patientType === "guardian" || patient?.patientType === "child")}
                    >
                      <SelectTrigger id="patientType" aria-invalid={!!errors.patientType}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="regular">
                          <span className="flex items-center gap-2">
                            <UserIcon className="size-3.5 text-muted-foreground" />
                            {t("patients.types.regular")}
                          </span>
                        </SelectItem>
                        <SelectItem value="guardian">
                          <span className="flex items-center gap-2">
                            <ShieldIcon className="size-3.5 text-amber-500" />
                            {t("patients.types.guardian")}
                          </span>
                        </SelectItem>
                        <SelectItem value="child">
                          <span className="flex items-center gap-2">
                            <BabyIcon className="size-3.5 text-emerald-500" />
                            {t("patients.types.child")}
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {isEdit && (patient?.patientType === "guardian" || patient?.patientType === "child") && (
                      <p className="text-xs text-muted-foreground">
                        {t("relationships.patientTypeAutoManaged")}
                      </p>
                    )}
                    {errors.patientType && (
                      <FieldError>{translateZodError(errors.patientType.message)}</FieldError>
                    )}
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="phoneNumber" className="flex items-center gap-1.5">
                      <PhoneIcon className="size-3.5 text-muted-foreground" />
                      {t("patients.fields.phoneNumber")}
                    </FieldLabel>
                    <Input
                      id="phoneNumber"
                      placeholder="000-000-0000"
                      data-invalid={!!errors.phoneNumber}
                      aria-invalid={!!errors.phoneNumber}
                      {...form.register("phoneNumber")}
                    />
                    {errors.phoneNumber && (
                      <FieldError>{translateZodError(errors.phoneNumber.message)}</FieldError>
                    )}
                  </Field>
                </div>
              </FormSection>

              {/* Section: Contact Details */}
              <FormSection
                icon={MailIcon}
                title={t("patients.form.sections.contact")}
                accentClass="bg-blue-500/10 text-blue-600 dark:text-blue-400"
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="email" className="flex items-center gap-1.5">
                      <MailIcon className="size-3.5 text-muted-foreground" />
                      {t("patients.fields.email")}
                    </FieldLabel>
                    <Input
                      id="email"
                      type="email"
                      placeholder="example@email.com"
                      data-invalid={!!errors.email}
                      aria-invalid={!!errors.email}
                      {...form.register("email")}
                    />
                    {errors.email && (
                      <FieldError>{translateZodError(errors.email.message)}</FieldError>
                    )}
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="address" className="flex items-center gap-1.5">
                      <MapPinIcon className="size-3.5 text-muted-foreground" />
                      {t("patients.fields.address")}
                    </FieldLabel>
                    <Input
                      id="address"
                      placeholder={t("patients.fields.address")}
                      data-invalid={!!errors.address}
                      aria-invalid={!!errors.address}
                      {...form.register("address")}
                    />
                    {errors.address && (
                      <FieldError>{translateZodError(errors.address.message)}</FieldError>
                    )}
                  </Field>
                </div>
              </FormSection>

              {/* Section: Additional Notes */}
              <FormSection
                icon={StickyNoteIcon}
                title={t("patients.form.sections.notes")}
                accentClass="bg-amber-500/10 text-amber-600 dark:text-amber-400"
              >
                <Field>
                  <Suspense fallback={<div className="h-[120px] rounded-lg border border-border/60 animate-pulse bg-muted/30" />}>
                    <NotesEditor
                      value={form.watch("notes")}
                      onChange={(val) => form.setValue("notes", val)}
                      patientId={patient?.id}
                    />
                  </Suspense>
                  {errors.notes && (
                    <FieldError>{translateZodError(errors.notes.message)}</FieldError>
                  )}
                </Field>
              </FormSection>

              {/* Summary preview for edit mode */}
              {isEdit && patient && (
                <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 bg-muted/20 px-4 py-2.5">
                  <span className="text-xs font-medium text-muted-foreground">
                    {t("patients.singular")} #{patient.displayId}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {t(`patients.genders.${patient.gender}`)}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {t(`patients.types.${patient.patientType}`)}
                  </Badge>
                </div>
              )}
            </FieldGroup>
          </div>

          <FormFooter
            onCancel={() => onOpenChange(false)}
            isSubmitting={isPending}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}

export type { PatientFormValues };
