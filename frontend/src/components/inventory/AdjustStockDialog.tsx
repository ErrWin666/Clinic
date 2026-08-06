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
import { ScaleIcon } from "lucide-react";
import { useAdjustStock } from "@/hooks/useStock";
import { useAllProducts } from "@/hooks/useAllProducts";

const schema = z.object({
  productVariantId: z.coerce.number().int().min(1, "Required"),
  newQuantity: z.coerce.number().int().min(0, "Must be >= 0"),
  reason: z.string().min(1, "Required"),
  note: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdjustStockDialog({ open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const { adjustStock, isAdjusting } = useAdjustStock();
  const [search, setSearch] = useState("");

  const { variants } = useAllProducts({ search, enabled: open });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: typedResolver(schema),
    defaultValues: { productVariantId: 0, newQuantity: 0, reason: "adjustment", note: "" },
  });

  useEffect(() => {
    if (open) reset({ productVariantId: 0, newQuantity: 0, reason: "adjustment", note: "" });
  }, [open, reset]);

  const onSubmit = handleSubmit(async (data) => {
    await adjustStock({
      productVariantId: data.productVariantId,
      newQuantity: data.newQuantity,
      reason: data.reason,
      note: data.note || undefined,
    });
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-hidden flex flex-col sm:max-w-2xl">
        <DialogHeaderWithIcon
          icon={ScaleIcon}
          variant="warning"
          title={t("inventory.actions.adjustStock")}
          description={t("inventory.actions.adjustStockDescription")}
        />
        <form onSubmit={onSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-1 min-h-0">
            <FieldGroup className="gap-5">
              <FormSection
                icon={ScaleIcon}
                title={t("inventory.actions.adjustStock")}
                accentClass="bg-amber-500/10 text-amber-600 dark:text-amber-400"
              >
                <Field>
                  <FieldLabel htmlFor="variantSearch">{t("common.search")}</FieldLabel>
                  <Input id="variantSearch" value={search} onChange={(e) => setSearch(e.target.value)} />
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
                    <FieldLabel htmlFor="newQuantity">{t("inventory.fields.quantity")}</FieldLabel>
                    <Input id="newQuantity" type="number" {...register("newQuantity")} />
                    {errors.newQuantity && <FieldError>{errors.newQuantity.message}</FieldError>}
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="reason">{t("inventory.fields.reason")}</FieldLabel>
                    <Input id="reason" {...register("reason")} />
                    {errors.reason && <FieldError>{errors.reason.message}</FieldError>}
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="note">{t("inventory.fields.note")}</FieldLabel>
                  <Input id="note" {...register("note")} />
                </Field>
              </FormSection>
            </FieldGroup>
          </div>
          <FormFooter onCancel={() => onOpenChange(false)} isSubmitting={isAdjusting} />
        </form>
      </DialogContent>
    </Dialog>
  );
}
