import { useTranslation } from "react-i18next";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { MarkdownDisplay } from "@/components/common/MarkdownDisplay";
import {
  VISION_FIELDS,
  CORNEA_FIELDS,
  PRESCRIPTION_FIELDS,
  CONTACT_LENS_FIELDS,
  FRAME_FIELDS,
  FRAME_LENS_FIELDS,
  PRESCRIPTION_INSTRUCTION_FIELDS,
  SECTION_ICONS,
} from "@/components/examinations/examination-constants";
import type { Examination } from "@/types/models";

function FieldDisplay({
  exam,
  fieldName,
  t,
}: {
  exam: Examination;
  fieldName: string;
  t: (key: string) => string;
}) {
  const value = (exam as unknown as Record<string, string | undefined>)[fieldName];
  const isInstructionField = PRESCRIPTION_INSTRUCTION_FIELDS.includes(
    fieldName as (typeof PRESCRIPTION_INSTRUCTION_FIELDS)[number]
  );
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">
        {t(`examinations.fields.${fieldName}`)}
      </span>
      {isInstructionField ? (
        <MarkdownDisplay value={value ?? ""} className="text-sm" />
      ) : (
        <span className="text-sm">{value || "—"}</span>
      )}
    </div>
  );
}

function FieldDisplayGrid({
  exam,
  fields,
  t,
}: {
  exam: Examination;
  fields: readonly string[];
  t: (key: string) => string;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {fields.map((fieldName) => (
        <FieldDisplay key={fieldName} exam={exam} fieldName={fieldName} t={t} />
      ))}
    </div>
  );
}

function SectionTrigger({
  sectionKey,
  labelKey,
  t,
}: {
  sectionKey: string;
  labelKey: string;
  t: (key: string) => string;
}) {
  const Icon = SECTION_ICONS[sectionKey];
  return (
    <AccordionTrigger className="rounded-lg px-2.5 py-1.5 hover:bg-muted/50">
      <span className="flex flex-col gap-0.5">
        <span className="flex items-center gap-2">
          <Icon className="size-4 text-primary" />
          {t(`examinations.sections.${labelKey}`)}
        </span>
        <span className="text-xs font-normal text-muted-foreground">
          {t(`examinations.sectionDescriptions.${labelKey}`)}
        </span>
      </span>
    </AccordionTrigger>
  );
}

function EyeSection({
  label,
  fields,
  exam,
  t,
}: {
  label: string;
  fields: readonly string[];
  exam: Examination;
  t: (key: string) => string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {t(`examinations.eyeLabels.${label}`)}
      </span>
      <FieldDisplayGrid exam={exam} fields={fields} t={t} />
    </div>
  );
}

export function ExaminationDetailAccordion({
  exam,
}: {
  exam: Examination;
}) {
  const { t } = useTranslation();

  return (
    <Accordion>
      <AccordionItem value="vision">
        <SectionTrigger sectionKey="vision" labelKey="visionPressure" t={t} />
        <AccordionContent>
          <EyeSection label="right" fields={VISION_FIELDS.slice(0, 3)} exam={exam} t={t} />
          <Separator className="my-4" />
          <EyeSection label="left" fields={VISION_FIELDS.slice(3)} exam={exam} t={t} />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="cornea">
        <SectionTrigger sectionKey="cornea" labelKey="corneaLens" t={t} />
        <AccordionContent>
          <EyeSection label="right" fields={CORNEA_FIELDS.slice(0, 6)} exam={exam} t={t} />
          <Separator className="my-4" />
          <EyeSection label="left" fields={CORNEA_FIELDS.slice(6)} exam={exam} t={t} />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="prescription">
        <SectionTrigger sectionKey="prescription" labelKey="prescription" t={t} />
        <AccordionContent>
          <EyeSection label="right" fields={PRESCRIPTION_FIELDS.slice(0, 5)} exam={exam} t={t} />
          <Separator className="my-4" />
          <EyeSection label="left" fields={PRESCRIPTION_FIELDS.slice(5)} exam={exam} t={t} />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="contact">
        <SectionTrigger sectionKey="contact" labelKey="contactLenses" t={t} />
        <AccordionContent>
          <EyeSection label="right" fields={CONTACT_LENS_FIELDS.slice(0, 3)} exam={exam} t={t} />
          <Separator className="my-4" />
          <EyeSection label="left" fields={CONTACT_LENS_FIELDS.slice(3)} exam={exam} t={t} />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="frame">
        <SectionTrigger sectionKey="frame" labelKey="frame" t={t} />
        <AccordionContent>
          <FieldDisplayGrid exam={exam} fields={FRAME_FIELDS} t={t} />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="frameLenses">
        <SectionTrigger sectionKey="frameLenses" labelKey="frameLenses" t={t} />
        <AccordionContent>
          <FieldDisplayGrid exam={exam} fields={FRAME_LENS_FIELDS} t={t} />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="instructions">
        <SectionTrigger sectionKey="instructions" labelKey="prescriptionsInstructions" t={t} />
        <AccordionContent>
          <div className="flex flex-col gap-4">
            {PRESCRIPTION_INSTRUCTION_FIELDS.map((fieldName) => (
              <FieldDisplay key={fieldName} exam={exam} fieldName={fieldName} t={t} />
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
