import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { typedResolver } from "@/lib/zodResolver";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { DialogHeaderWithIcon } from "@/components/common/DialogHeaderWithIcon";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel, FieldError } from "@/components/ui/field";
import { FormSection } from "@/components/common/FormSection";
import { FormFooter } from "@/components/common/FormFooter";
import { ProductVariantCombobox } from "@/components/common/ProductVariantCombobox";
import {
  PackageCheckIcon,
  BoxesIcon,
  StethoscopeIcon,
  HashIcon,
} from "lucide-react";
import type { ExamConsumableRule } from "@/types/models";

const schema = z.object({
  examType: z.string().min(1, "Required"),
  productVariantId: z.coerce.number().int().min(1, "Required"),
  quantity: z.coerce.number().int().min(1, "Must be >= 1"),
});

type RuleFormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule?: ExamConsumableRule | null;
  onSubmit: (data: RuleFormValues) => Promise<void>;
  isPending: boolean;
}

export { type RuleFormValues };

export function ExamConsumableRuleForm({ open, onOpenChange, rule, onSubmit, isPending }: Props) {
  const { t } = useTranslation();

  const { register, handleSubmit, reset, formState: { errors }, watch, setValue } = useForm<RuleFormValues>({
    resolver: typedResolver(schema),
    defaultValues: { examType: "", productVariantId: 0, quantity: 1 },
  });

  useEffect(() => {
    if (open) {
      if (rule) {
        reset({ examType: rule.examType, productVariantId: rule.productVariantId, quantity: rule.quantity });
      } else {
        reset({ examType: "", productVariantId: 0, quantity: 1 });
      }
    }
  }, [open, rule, reset]);

  const handleFormSubmit = handleSubmit(async (data) => {
    await onSubmit(data);
    onOpenChange(false);
  });

  const watchProductVariantId = watch("productVariantId");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[85vh] max-w-2xl overflow-hidden flex flex-col sm:max-w-2xl"
        data-slot="exam-consumable-rule-form"
      >
        <DialogHeaderWithIcon
          icon={PackageCheckIcon}
          variant="primary"
          title={rule ? t("common.edit") : t("inventory.actions.addConsumableRule")}
          description={t("inventory.form.ruleDescription")}
        />

        <form onSubmit={handleFormSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-1 min-h-0">
            <FieldGroup className="gap-5">
              {/* Section: Rule */}
              <FormSection
                icon={PackageCheckIcon}
                title={t("inventory.form.sections.rule")}
                accentClass="bg-primary/10 text-primary"
              >
                <Field>
                  <FieldLabel htmlFor="examType" className="flex items-center gap-1.5">
                    <StethoscopeIcon className="size-3.5 text-muted-foreground" />
                    {t("inventory.fields.examType")}
                  </FieldLabel>
                  <Input
                    id="examType"
                    placeholder={t("inventory.fields.examType")}
                    data-invalid={!!errors.examType}
                    aria-invalid={!!errors.examType}
                    disabled={!!rule}
                    {...register("examType")}
                  />
                  {errors.examType && <FieldError>{errors.examType.message}</FieldError>}
                </Field>

                {!rule && (
                  <Field>
                    <FieldLabel className="flex items-center gap-1.5">
                      <BoxesIcon className="size-3.5 text-muted-foreground" />
                      {t("inventory.fields.name")}
                    </FieldLabel>
                    <ProductVariantCombobox
                      value={watchProductVariantId || null}
                      onChange={(id) => setValue("productVariantId", id ?? 0)}
                    />
                    {errors.productVariantId && <FieldError>{errors.productVariantId.message}</FieldError>}
                  </Field>
                )}
              </FormSection>

              {/* Section: Quantities */}
              <FormSection
                icon={BoxesIcon}
                title={t("inventory.form.sections.quantities")}
                accentClass="bg-blue-500/10 text-blue-600"
              >
                <Field>
                  <FieldLabel htmlFor="quantity" className="flex items-center gap-1.5">
                    <HashIcon className="size-3.5 text-muted-foreground" />
                    {t("inventory.fields.quantity")}
                  </FieldLabel>
                  <Input
                    id="quantity"
                    type="number"
                    placeholder={t("inventory.fields.quantity")}
                    data-invalid={!!errors.quantity}
                    aria-invalid={!!errors.quantity}
                    {...register("quantity")}
                  />
                  {errors.quantity && <FieldError>{errors.quantity.message}</FieldError>}
                </Field>
              </FormSection>
            </FieldGroup>
          </div>

          <FormFooter onCancel={() => onOpenChange(false)} isSubmitting={isPending} />
        </form>
      </DialogContent>
    </Dialog>
  );
}
