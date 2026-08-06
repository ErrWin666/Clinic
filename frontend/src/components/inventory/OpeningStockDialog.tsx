import { useEffect, useState } from "react";
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
import { FormFooter } from "@/components/common/FormFooter";
import { FormSection } from "@/components/common/FormSection";
import { PackagePlusIcon } from "lucide-react";
import { useOpeningStock } from "@/hooks/useStock";
import { useAllProducts } from "@/hooks/useAllProducts";

const schema = z.object({
  productVariantId: z.coerce.number().int().min(1, "Required"),
  quantity: z.coerce.number().int().min(1, "Must be >= 1"),
  unitCost: z.coerce.number().min(0, "Must be >= 0"),
  batchNumber: z.string().min(1, "Required"),
  expiryDate: z.string().optional(),
  note: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OpeningStockDialog({ open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const { addOpeningStock, isAdding } = useOpeningStock();
  const [search, setSearch] = useState("");

  const { variants } = useAllProducts({ search, enabled: open });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: typedResolver(schema),
    defaultValues: { productVariantId: 0, quantity: 1, unitCost: 0, batchNumber: "", expiryDate: "", note: "" },
  });

  useEffect(() => {
    if (open) reset({ productVariantId: 0, quantity: 1, unitCost: 0, batchNumber: "", expiryDate: "", note: "" });
  }, [open, reset]);

  const onSubmit = handleSubmit(async (data) => {
    await addOpeningStock({
      productVariantId: data.productVariantId,
      quantity: data.quantity,
      unitCost: data.unitCost,
      batchNumber: data.batchNumber,
      expiryDate: data.expiryDate || undefined,
      note: data.note || undefined,
    });
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-hidden flex flex-col sm:max-w-2xl">
        <DialogHeaderWithIcon
          icon={PackagePlusIcon}
          variant="primary"
          title={t("inventory.actions.openingStock")}
          description={t("inventory.actions.openingStockDescription")}
        />
        <form onSubmit={onSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-1 min-h-0">
            <FieldGroup className="gap-5">
              <FormSection
                icon={PackagePlusIcon}
                title={t("inventory.actions.openingStock")}
                accentClass="bg-primary/10 text-primary"
              >
                <Field>
                  <FieldLabel htmlFor="variantSearch">{t("common.search")}</FieldLabel>
                  <Input
                    id="variantSearch"
                    placeholder={t("common.search")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="productVariantId">{t("inventory.fields.name")}</FieldLabel>
                  <select
                    id="productVariantId"
                    {...register("productVariantId")}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  >
                    <option value={0}>—</option>
                    {variants.map((v) => (
                      <option key={v.id} value={v.id}>{v.productName} — {v.name} ({v.sku})</option>
                    ))}
                  </select>
                  {errors.productVariantId && <FieldError>{errors.productVariantId.message}</FieldError>}
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="quantity">{t("inventory.fields.quantity")}</FieldLabel>
                    <Input id="quantity" type="number" {...register("quantity")} />
                    {errors.quantity && <FieldError>{errors.quantity.message}</FieldError>}
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="unitCost">{t("inventory.fields.unitCost")}</FieldLabel>
                    <Input id="unitCost" type="number" step="0.01" {...register("unitCost")} />
                    {errors.unitCost && <FieldError>{errors.unitCost.message}</FieldError>}
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="batchNumber">{t("inventory.fields.batchNumber")}</FieldLabel>
                    <Input id="batchNumber" {...register("batchNumber")} />
                    {errors.batchNumber && <FieldError>{errors.batchNumber.message}</FieldError>}
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="expiryDate">{t("inventory.fields.expiryDate")}</FieldLabel>
                    <Input id="expiryDate" type="date" {...register("expiryDate")} />
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="note">{t("inventory.fields.note")}</FieldLabel>
                  <Input id="note" {...register("note")} />
                </Field>
              </FormSection>
            </FieldGroup>
          </div>
          <FormFooter onCancel={() => onOpenChange(false)} isSubmitting={isAdding} />
        </form>
      </DialogContent>
    </Dialog>
  );
}
