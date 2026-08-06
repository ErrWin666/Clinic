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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field, FieldGroup, FieldLabel, FieldError } from "@/components/ui/field";
import { FormSection } from "@/components/common/FormSection";
import { FormFooter } from "@/components/common/FormFooter";
import { ENUMS } from "@/types/enums";
import { PackageIcon, StickyNoteIcon, TagIcon, LayersIcon } from "lucide-react";
import type { Product } from "@/types/models";

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.enum(ENUMS.PRODUCT_CATEGORY),
  costingMethod: z.enum(ENUMS.COSTING_METHOD),
  description: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  onSubmit: (data: ProductFormValues) => Promise<void>;
  isPending: boolean;
}

export { type ProductFormValues };

export function ProductForm({ open, onOpenChange, product, onSubmit, isPending }: ProductFormProps) {
  const { t } = useTranslation();
  const { register, handleSubmit, reset, formState: { errors }, setValue, watch } = useForm<ProductFormValues>({
    resolver: typedResolver(productSchema),
    defaultValues: {
      name: "",
      category: "other",
      costingMethod: "fifo",
      description: "",
    },
  });

  useEffect(() => {
    if (open) {
      if (product) {
        reset({
          name: product.name,
          category: product.category,
          costingMethod: product.costingMethod,
          description: product.description || "",
        });
      } else {
        reset({ name: "", category: "other", costingMethod: "fifo", description: "" });
      }
    }
  }, [open, product, reset]);

  const watchCategory = watch("category");
  const watchCostingMethod = watch("costingMethod");

  const handleFormSubmit = handleSubmit(async (data) => {
    await onSubmit(data);
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[85vh] max-w-2xl overflow-hidden flex flex-col sm:max-w-2xl"
        data-slot="product-form"
      >
        <DialogHeaderWithIcon
          icon={PackageIcon}
          variant="primary"
          title={product ? t("common.edit") : t("inventory.actions.addProduct")}
          description={t("inventory.form.description")}
        />

        <form onSubmit={handleFormSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-1 min-h-0">
            <FieldGroup className="gap-5">
              {/* Section: Basic Info */}
              <FormSection
                icon={PackageIcon}
                title={t("inventory.form.sections.basic")}
                accentClass="bg-primary/10 text-primary"
              >
                <Field>
                  <FieldLabel htmlFor="name" className="flex items-center gap-1.5">
                    <PackageIcon className="size-3.5 text-muted-foreground" />
                    {t("inventory.fields.name")}
                  </FieldLabel>
                  <Input
                    id="name"
                    placeholder={t("inventory.fields.name")}
                    data-invalid={!!errors.name}
                    aria-invalid={!!errors.name}
                    {...register("name")}
                  />
                  {errors.name && <FieldError>{errors.name.message}</FieldError>}
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel className="flex items-center gap-1.5">
                      <TagIcon className="size-3.5 text-muted-foreground" />
                      {t("inventory.fields.category")}
                    </FieldLabel>
                    <Select value={watchCategory} onValueChange={(v) => setValue("category", v as typeof watchCategory)}>
                      <SelectTrigger aria-invalid={!!errors.category}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ENUMS.PRODUCT_CATEGORY.map((cat) => (
                          <SelectItem key={cat} value={cat}>{t(`inventory.categories.${cat}`)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.category && <FieldError>{errors.category.message}</FieldError>}
                  </Field>

                  <Field>
                    <FieldLabel className="flex items-center gap-1.5">
                      <LayersIcon className="size-3.5 text-muted-foreground" />
                      {t("inventory.fields.costingMethod")}
                    </FieldLabel>
                    <Select value={watchCostingMethod} onValueChange={(v) => setValue("costingMethod", v as typeof watchCostingMethod)}>
                      <SelectTrigger aria-invalid={!!errors.costingMethod}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ENUMS.COSTING_METHOD.map((method) => (
                          <SelectItem key={method} value={method}>{t(`inventory.costingMethods.${method}`)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.costingMethod && <FieldError>{errors.costingMethod.message}</FieldError>}
                  </Field>
                </div>
              </FormSection>

              {/* Section: Description */}
              <FormSection
                icon={StickyNoteIcon}
                title={t("inventory.form.sections.description")}
                accentClass="bg-amber-500/10 text-amber-600"
              >
                <Field>
                  <FieldLabel htmlFor="description" className="flex items-center gap-1.5">
                    <StickyNoteIcon className="size-3.5 text-muted-foreground" />
                    {t("inventory.fields.description")}
                  </FieldLabel>
                  <Textarea
                    id="description"
                    rows={3}
                    placeholder={t("inventory.fields.description")}
                    {...register("description")}
                  />
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
