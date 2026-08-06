import { useWatch } from "react-hook-form";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { NotesEditor } from "@/components/patients/NotesEditor";
import { EyeIcon } from "lucide-react";
import type { ExaminationFormValues } from "@/schemas/examinationSchema";
import type { UseFormReturn } from "react-hook-form";
import { translateZodError } from "@/lib/zodError";

type FormType = UseFormReturn<ExaminationFormValues>;
type RegisterFn = FormType["register"];
type ControlType = FormType["control"];

export function FieldGrid({
  fields,
  register,
  errors,
  t,
}: {
  fields: readonly string[];
  register: RegisterFn;
  errors: Record<string, { message?: string } | undefined>;
  t: (key: string) => string;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {fields.map((fieldName) => (
        <Field key={fieldName}>
          <FieldLabel htmlFor={fieldName} className="text-xs">
            {t(`examinations.fields.${fieldName}`)}
          </FieldLabel>
          <Input
            id={fieldName}
            data-invalid={!!errors[fieldName as keyof ExaminationFormValues]}
            aria-invalid={!!errors[fieldName as keyof ExaminationFormValues]}
            {...register(fieldName as keyof ExaminationFormValues)}
          />
          {errors[fieldName as keyof ExaminationFormValues] && (
            <FieldError>
              {translateZodError(errors[fieldName as keyof ExaminationFormValues]?.message)}
            </FieldError>
          )}
        </Field>
      ))}
    </div>
  );
}

export function ExaminationNotesField({
  fieldName,
  form,
  errors,
  t,
  patientId,
}: {
  fieldName: string;
  form: FormType;
  errors: Record<string, { message?: string } | undefined>;
  t: (key: string) => string;
  patientId: number;
}) {
  return (
    <Field>
      <FieldLabel htmlFor={fieldName} className="text-xs">
        {t(`examinations.fields.${fieldName}`)}
      </FieldLabel>
      <NotesEditor
        value={form.watch(fieldName as keyof ExaminationFormValues) as string ?? ""}
        onChange={(val) => form.setValue(fieldName as keyof ExaminationFormValues, val as never)}
        patientId={patientId}
        editorClassName="min-h-[80px] max-h-[200px] overflow-y-auto"
      />
      {errors[fieldName as keyof ExaminationFormValues] && (
        <FieldError>
          {translateZodError(errors[fieldName as keyof ExaminationFormValues]?.message)}
        </FieldError>
      )}
    </Field>
  );
}

export function SectionBadge({
  fields,
  control,
}: {
  fields: readonly string[];
  control: ControlType;
}) {
  const values = useWatch({ control, name: fields as unknown as (keyof ExaminationFormValues)[] });
  const filled = values.filter((v) => v !== undefined && v !== null && v !== "").length;
  if (filled === 0) return null;
  return (
    <Badge variant="secondary" className="ml-auto tabular-nums text-xs">
      {filled}/{fields.length}
    </Badge>
  );
}

export function EyeSeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <div className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary">
        <EyeIcon className="size-3.5" />
      </div>
      <span className="text-xs font-semibold uppercase tracking-wide text-primary">
        {label}
      </span>
      <div className="h-px flex-1 bg-border/60" />
    </div>
  );
}
