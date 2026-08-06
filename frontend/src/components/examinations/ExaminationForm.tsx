import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
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
import { ExaminationAttachments } from "@/components/examinations/ExaminationAttachments";
import { ExaminationAccordion } from "@/components/examinations/ExaminationAccordion";
import { FormSection } from "@/components/common/FormSection";
import { FormFooter } from "@/components/common/FormFooter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, ActivityIcon } from "lucide-react";
import type { Examination } from "@/types/models";
import { EXAM_STATUS_VARIANT } from "@/components/examinations/examination-constants";
import { examSchema, type ExaminationFormValues } from "@/schemas/examinationSchema";
import { buildExaminationDefaults } from "@/components/examinations/examinationFormDefaults";
import { translateZodError } from "@/lib/zodError";

interface ExaminationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  examination?: Examination | null;
  onSubmit: (data: Record<string, unknown>, isEdit: boolean) => Promise<void>;
  isPending: boolean;
  patientId: number;
}

export function ExaminationForm({
  open,
  onOpenChange,
  examination,
  onSubmit,
  isPending,
  patientId,
}: ExaminationFormProps) {
  const { t } = useTranslation();
  const isEdit = !!examination;

  const form = useForm<ExaminationFormValues>({
    resolver: zodResolver(examSchema),
    mode: "onBlur",
    defaultValues: buildExaminationDefaults(examination),
  });

  useEffect(() => {
    if (open) {
      form.reset(buildExaminationDefaults(examination));
    }
  }, [open, examination, form]);

  const handleSubmit = async (values: ExaminationFormValues) => {
    const payload: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(values)) {
      if (value !== "" && value !== null && value !== undefined) {
        payload[key] = value;
      }
    }
    await onSubmit(payload, isEdit);
    onOpenChange(false);
  };

  const errors = form.formState.errors;
  const register = form.register;
  const examStatus = form.watch("examStatus");

  const statusBadgeVariant = EXAM_STATUS_VARIANT[examStatus];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-hidden flex flex-col sm:max-w-2xl" data-slot="examination-form">
        <DialogHeaderWithIcon
          icon={ActivityIcon}
          variant="primary"
          title={isEdit ? t("examinations.edit") : t("examinations.add")}
          description={t("examinations.form.description")}
        />

        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto px-1 min-h-0">
              <FieldGroup>
                {/* Exam metadata card */}
                <FormSection
                  icon={CalendarIcon}
                  title={t("examinations.sections.examInfo")}
                  accentClass="bg-primary/10 text-primary"
                  contentClassName="grid grid-cols-2 gap-4 p-4"
                >
                    <Field>
                      <FieldLabel htmlFor="examDate" className="flex items-center gap-1.5">
                        <CalendarIcon className="size-3.5 text-muted-foreground" />
                        {t("examinations.fields.examDate")}
                      </FieldLabel>
                      <Input
                        id="examDate"
                        type="date"
                        data-invalid={!!errors.examDate}
                        aria-invalid={!!errors.examDate}
                        {...register("examDate")}
                      />
                      {errors.examDate && (
                        <FieldError>{translateZodError(errors.examDate.message)}</FieldError>
                      )}
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="examStatus">
                        {t("examinations.fields.examStatus")}
                      </FieldLabel>
                      <div className="flex items-center gap-2">
                        <Select
                          value={examStatus}
                          onValueChange={(v) => form.setValue("examStatus", v as "pending" | "completed" | "cancelled")}
                        >
                          <SelectTrigger id="examStatus" aria-invalid={!!errors.examStatus} className="flex-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">
                              {t("examinations.statuses.pending")}
                            </SelectItem>
                            <SelectItem value="completed">
                              {t("examinations.statuses.completed")}
                            </SelectItem>
                            <SelectItem value="cancelled">
                              {t("examinations.statuses.cancelled")}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <Badge variant={statusBadgeVariant} className="shrink-0">
                          {t(`examinations.statuses.${examStatus}`)}
                        </Badge>
                      </div>
                      {errors.examStatus && (
                        <FieldError>{translateZodError(errors.examStatus.message)}</FieldError>
                      )}
                    </Field>
                </FormSection>

                <ExaminationAccordion
                  form={form}
                  errors={errors}
                  register={register}
                  t={t}
                  patientId={patientId}
                />

                <ExaminationAttachments patientId={patientId} examinationId={examination?.id ?? null} />
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
