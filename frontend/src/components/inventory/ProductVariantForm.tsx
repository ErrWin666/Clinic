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
import { PackagingUnitsSection } from "@/components/inventory/PackagingUnitsSection";
import { useProductVariants } from "@/hooks/useProducts";
import {
  BoxesIcon,
  DollarSignIcon,
  WarehouseIcon,
  BarcodeIcon,
  TagIcon,
  MapPinIcon,
  HashIcon,
} from "lucide-react";
import type { Product, ProductVariant } from "@/types/models";

const variantSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().min(1, "SKU is required"),
  barcode: z.string().optional(),
  sellPrice: z.coerce.number().min(0, "Must be >= 0"),
  costPrice: z.coerce.number().min(0).optional(),
  minQuantity: z.coerce.number().int().min(0).optional(),
  maxQuantity: z.coerce.number().int().min(0).optional(),
  location: z.string().optional(),
  serialNumber: z.string().optional(),
});

type VariantFormValues = z.infer<typeof variantSchema>;

interface ProductVariantFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product;
  variant?: ProductVariant | null;
  isPending: boolean;
}

export { type VariantFormValues };

export function ProductVariantForm({ open, onOpenChange, product, variant, isPending }: ProductVariantFormProps) {
  const { t } = useTranslation();
  const { createVariant, updateVariant } = useProductVariants(product.id);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<VariantFormValues>({
    resolver: typedResolver(variantSchema),
    defaultValues: {
      name: "",
      sku: "",
      barcode: "",
      sellPrice: 0,
      costPrice: 0,
      minQuantity: 0,
      maxQuantity: 0,
      location: "",
      serialNumber: "",
    },
  });

  useEffect(() => {
    if (open) {
      if (variant) {
        reset({
          name: variant.name,
          sku: variant.sku,
          barcode: variant.barcode || "",
          sellPrice: variant.sellPrice,
          costPrice: variant.costPrice,
          minQuantity: variant.minQuantity,
          maxQuantity: variant.maxQuantity,
          location: variant.location || "",
          serialNumber: variant.serialNumber || "",
        });
      } else {
        reset({ name: "", sku: "", barcode: "", sellPrice: 0, costPrice: 0, minQuantity: 0, maxQuantity: 0, location: "", serialNumber: "" });
      }
    }
  }, [open, variant, reset]);

  const handleFormSubmit = handleSubmit(async (data) => {
    if (variant) {
      await updateVariant({ variantId: variant.id, data });
    } else {
      await createVariant(data);
    }
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[85vh] max-w-2xl overflow-hidden flex flex-col sm:max-w-2xl"
        data-slot="product-variant-form"
      >
        <DialogHeaderWithIcon
          icon={BoxesIcon}
          variant="primary"
          title={`${variant ? t("common.edit") : t("inventory.actions.addVariant")} — ${product.name}`}
          description={t("inventory.form.variantDescription")}
        />

        <form onSubmit={handleFormSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-1 min-h-0">
            <FieldGroup className="gap-5">
              {/* Section: Variant Info */}
              <FormSection
                icon={BoxesIcon}
                title={t("inventory.form.sections.variantInfo")}
                accentClass="bg-primary/10 text-primary"
              >
                <Field>
                  <FieldLabel htmlFor="name" className="flex items-center gap-1.5">
                    <TagIcon className="size-3.5 text-muted-foreground" />
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
                    <FieldLabel htmlFor="sku" className="flex items-center gap-1.5">
                      <HashIcon className="size-3.5 text-muted-foreground" />
                      {t("inventory.fields.sku")}
                    </FieldLabel>
                    <Input
                      id="sku"
                      placeholder={t("inventory.fields.sku")}
                      data-invalid={!!errors.sku}
                      aria-invalid={!!errors.sku}
                      {...register("sku")}
                    />
                    {errors.sku && <FieldError>{errors.sku.message}</FieldError>}
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="barcode" className="flex items-center gap-1.5">
                      <BarcodeIcon className="size-3.5 text-muted-foreground" />
                      {t("inventory.fields.barcode")}
                    </FieldLabel>
                    <Input id="barcode" placeholder={t("inventory.fields.barcode")} {...register("barcode")} />
                  </Field>
                </div>
              </FormSection>

              {/* Section: Pricing */}
              <FormSection
                icon={DollarSignIcon}
                title={t("inventory.form.sections.pricing")}
                accentClass="bg-emerald-500/10 text-emerald-600"
              >
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="sellPrice" className="flex items-center gap-1.5">
                      <DollarSignIcon className="size-3.5 text-muted-foreground" />
                      {t("inventory.fields.sellPrice")}
                    </FieldLabel>
                    <Input
                      id="sellPrice"
                      type="number"
                      step="0.01"
                      placeholder={t("inventory.fields.sellPrice")}
                      data-invalid={!!errors.sellPrice}
                      aria-invalid={!!errors.sellPrice}
                      {...register("sellPrice")}
                    />
                    {errors.sellPrice && <FieldError>{errors.sellPrice.message}</FieldError>}
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="costPrice" className="flex items-center gap-1.5">
                      <DollarSignIcon className="size-3.5 text-muted-foreground" />
                      {t("inventory.fields.costPrice")}
                    </FieldLabel>
                    <Input id="costPrice" type="number" step="0.01" placeholder={t("inventory.fields.costPrice")} {...register("costPrice")} />
                  </Field>
                </div>
              </FormSection>

              {/* Section: Stock */}
              <FormSection
                icon={WarehouseIcon}
                title={t("inventory.form.sections.stock")}
                accentClass="bg-blue-500/10 text-blue-600"
              >
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="minQuantity" className="flex items-center gap-1.5">
                      <WarehouseIcon className="size-3.5 text-muted-foreground" />
                      {t("inventory.fields.minQuantity")}
                    </FieldLabel>
                    <Input id="minQuantity" type="number" placeholder={t("inventory.fields.minQuantity")} {...register("minQuantity")} />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="maxQuantity" className="flex items-center gap-1.5">
                      <WarehouseIcon className="size-3.5 text-muted-foreground" />
                      {t("inventory.fields.maxQuantity")}
                    </FieldLabel>
                    <Input id="maxQuantity" type="number" placeholder={t("inventory.fields.maxQuantity")} {...register("maxQuantity")} />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="location" className="flex items-center gap-1.5">
                      <MapPinIcon className="size-3.5 text-muted-foreground" />
                      {t("inventory.fields.location")}
                    </FieldLabel>
                    <Input id="location" placeholder={t("inventory.fields.location")} {...register("location")} />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="serialNumber" className="flex items-center gap-1.5">
                      <HashIcon className="size-3.5 text-muted-foreground" />
                      {t("inventory.fields.serialNumber")}
                    </FieldLabel>
                    <Input id="serialNumber" placeholder={t("inventory.fields.serialNumber")} {...register("serialNumber")} />
                  </Field>
                </div>
              </FormSection>

              {/* Section: Packaging Units (only when editing existing variant) */}
              {variant && (
                <PackagingUnitsSection variantId={variant.id} />
              )}
            </FieldGroup>
          </div>

          <FormFooter onCancel={() => onOpenChange(false)} isSubmitting={isPending} />
        </form>
      </DialogContent>
    </Dialog>
  );
}
