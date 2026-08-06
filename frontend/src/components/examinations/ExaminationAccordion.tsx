import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { FieldGroup } from "@/components/ui/field";
import {
  EyeIcon,
  EyeOffIcon,
  GlassesIcon,
  CircleDotIcon,
  FrameIcon,
  SunIcon,
  ClipboardIcon,
} from "lucide-react";
import {
  VISION_FIELDS,
  CORNEA_FIELDS,
  PRESCRIPTION_FIELDS,
  CONTACT_LENS_FIELDS,
  FRAME_FIELDS,
  FRAME_LENS_FIELDS,
  PRESCRIPTION_INSTRUCTION_FIELDS,
} from "@/components/examinations/examination-constants";
import {
  FieldGrid,
  ExaminationNotesField,
  SectionBadge,
  EyeSeparator,
} from "@/components/examinations/ExaminationFormParts";
import type { ExaminationFormValues } from "@/schemas/examinationSchema";
import type { UseFormReturn } from "react-hook-form";

type FormType = UseFormReturn<ExaminationFormValues>;

interface ExaminationAccordionProps {
  form: FormType;
  errors: Record<string, { message?: string } | undefined>;
  register: FormType["register"];
  t: (key: string) => string;
  patientId: number;
}

export function ExaminationAccordion({
  form,
  errors,
  register,
  t,
  patientId,
}: ExaminationAccordionProps) {
  return (
    <Accordion>
      {/* Vision & Pressure */}
      <AccordionItem value="vision">
        <AccordionTrigger className="rounded-lg px-2 hover:bg-muted/50">
          <span className="flex flex-col gap-0.5">
            <span className="flex items-center gap-2">
              <EyeIcon className="size-4 text-blue-500" />
              {t("examinations.sections.visionPressure")}
            </span>
            <span className="text-xs font-normal text-muted-foreground">
              {t("examinations.sectionDescriptions.visionPressure")}
            </span>
          </span>
          <SectionBadge fields={VISION_FIELDS} control={form.control} />
        </AccordionTrigger>
        <AccordionContent>
          <FieldGroup className="gap-4">
            <EyeSeparator label={t("examinations.eyeLabels.right")} />
            <FieldGrid fields={VISION_FIELDS.slice(0, 3)} register={register} errors={errors} t={t} />
            <EyeSeparator label={t("examinations.eyeLabels.left")} />
            <FieldGrid fields={VISION_FIELDS.slice(3)} register={register} errors={errors} t={t} />
          </FieldGroup>
        </AccordionContent>
      </AccordionItem>

      {/* Cornea & Lens */}
      <AccordionItem value="cornea">
        <AccordionTrigger className="rounded-lg px-2 hover:bg-muted/50">
          <span className="flex flex-col gap-0.5">
            <span className="flex items-center gap-2">
              <EyeOffIcon className="size-4 text-violet-500" />
              {t("examinations.sections.corneaLens")}
            </span>
            <span className="text-xs font-normal text-muted-foreground">
              {t("examinations.sectionDescriptions.corneaLens")}
            </span>
          </span>
          <SectionBadge fields={CORNEA_FIELDS} control={form.control} />
        </AccordionTrigger>
        <AccordionContent>
          <FieldGroup className="gap-4">
            <EyeSeparator label={t("examinations.eyeLabels.right")} />
            <FieldGrid fields={CORNEA_FIELDS.slice(0, 6)} register={register} errors={errors} t={t} />
            <EyeSeparator label={t("examinations.eyeLabels.left")} />
            <FieldGrid fields={CORNEA_FIELDS.slice(6)} register={register} errors={errors} t={t} />
          </FieldGroup>
        </AccordionContent>
      </AccordionItem>

      {/* Prescription */}
      <AccordionItem value="prescription">
        <AccordionTrigger className="rounded-lg px-2 hover:bg-muted/50">
          <span className="flex flex-col gap-0.5">
            <span className="flex items-center gap-2">
              <GlassesIcon className="size-4 text-amber-500" />
              {t("examinations.sections.prescription")}
            </span>
            <span className="text-xs font-normal text-muted-foreground">
              {t("examinations.sectionDescriptions.prescription")}
            </span>
          </span>
          <SectionBadge fields={PRESCRIPTION_FIELDS} control={form.control} />
        </AccordionTrigger>
        <AccordionContent>
          <FieldGroup className="gap-4">
            <EyeSeparator label={t("examinations.eyeLabels.right")} />
            <FieldGrid fields={PRESCRIPTION_FIELDS.slice(0, 5)} register={register} errors={errors} t={t} />
            <EyeSeparator label={t("examinations.eyeLabels.left")} />
            <FieldGrid fields={PRESCRIPTION_FIELDS.slice(5)} register={register} errors={errors} t={t} />
          </FieldGroup>
        </AccordionContent>
      </AccordionItem>

      {/* Contact Lenses */}
      <AccordionItem value="contact">
        <AccordionTrigger className="rounded-lg px-2 hover:bg-muted/50">
          <span className="flex flex-col gap-0.5">
            <span className="flex items-center gap-2">
              <CircleDotIcon className="size-4 text-teal-500" />
              {t("examinations.sections.contactLenses")}
            </span>
            <span className="text-xs font-normal text-muted-foreground">
              {t("examinations.sectionDescriptions.contactLenses")}
            </span>
          </span>
          <SectionBadge fields={CONTACT_LENS_FIELDS} control={form.control} />
        </AccordionTrigger>
        <AccordionContent>
          <FieldGroup className="gap-4">
            <EyeSeparator label={t("examinations.eyeLabels.right")} />
            <FieldGrid fields={CONTACT_LENS_FIELDS.slice(0, 3)} register={register} errors={errors} t={t} />
            <EyeSeparator label={t("examinations.eyeLabels.left")} />
            <FieldGrid fields={CONTACT_LENS_FIELDS.slice(3)} register={register} errors={errors} t={t} />
          </FieldGroup>
        </AccordionContent>
      </AccordionItem>

      {/* Frame */}
      <AccordionItem value="frame">
        <AccordionTrigger className="rounded-lg px-2 hover:bg-muted/50">
          <span className="flex flex-col gap-0.5">
            <span className="flex items-center gap-2">
              <FrameIcon className="size-4 text-rose-500" />
              {t("examinations.sections.frame")}
            </span>
            <span className="text-xs font-normal text-muted-foreground">
              {t("examinations.sectionDescriptions.frame")}
            </span>
          </span>
          <SectionBadge fields={FRAME_FIELDS} control={form.control} />
        </AccordionTrigger>
        <AccordionContent>
          <FieldGrid fields={FRAME_FIELDS} register={register} errors={errors} t={t} />
        </AccordionContent>
      </AccordionItem>

      {/* Frame Lenses */}
      <AccordionItem value="frameLenses">
        <AccordionTrigger className="rounded-lg px-2 hover:bg-muted/50">
          <span className="flex flex-col gap-0.5">
            <span className="flex items-center gap-2">
              <SunIcon className="size-4 text-orange-500" />
              {t("examinations.sections.frameLenses")}
            </span>
            <span className="text-xs font-normal text-muted-foreground">
              {t("examinations.sectionDescriptions.frameLenses")}
            </span>
          </span>
          <SectionBadge fields={FRAME_LENS_FIELDS} control={form.control} />
        </AccordionTrigger>
        <AccordionContent>
          <FieldGrid fields={FRAME_LENS_FIELDS} register={register} errors={errors} t={t} />
        </AccordionContent>
      </AccordionItem>

      {/* Prescriptions & Instructions */}
      <AccordionItem value="instructions">
        <AccordionTrigger className="rounded-lg px-2 hover:bg-muted/50">
          <span className="flex flex-col gap-0.5">
            <span className="flex items-center gap-2">
              <ClipboardIcon className="size-4 text-emerald-500" />
              {t("examinations.sections.prescriptionsInstructions")}
            </span>
            <span className="text-xs font-normal text-muted-foreground">
              {t("examinations.sectionDescriptions.prescriptionsInstructions")}
            </span>
          </span>
          <SectionBadge fields={PRESCRIPTION_INSTRUCTION_FIELDS} control={form.control} />
        </AccordionTrigger>
        <AccordionContent>
          <FieldGroup className="gap-4">
            {PRESCRIPTION_INSTRUCTION_FIELDS.map((fieldName) => (
              <ExaminationNotesField
                key={fieldName}
                fieldName={fieldName}
                form={form}
                errors={errors}
                t={t}
                patientId={patientId}
              />
            ))}
          </FieldGroup>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
