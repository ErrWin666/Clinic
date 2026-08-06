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
import { AlertTriangleIcon } from "lucide-react";
import { useRecordDamage } from "@/hooks/useStock";
import { useAllProducts } from "@/hooks/useAllProducts";

const schema = z.object({
  batchId: z.coerce.number().int().min(1, "Required"),
  quantity: z.coerce.number().int().min(1, "Must be >= 1"),
  note: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DamageDialog({ open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const { recordDamage, isRecording } = useRecordDamage();
  const [search, setSearch] = useState("");

  const { products } = useAllProducts({ search, enabled: open });

  const batches = products.flatMap((p) =>
    (p.variants ?? []).flatMap((v) =>
      (v.batches ?? []).filter((b) => b.quantity > 0).map((b) => ({
        ...b,
        variantName: v.name,
        productName: p.name,
        sku: v.sku,
      }))
    )
  );

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: typedResolver(schema),
    defaultValues: { batchId: 0, quantity: 1, note: "" },
  });

  useEffect(() => {
    if (open) reset({ batchId: 0, quantity: 1, note: "" });
  }, [open, reset]);

  const onSubmit = handleSubmit(async (data) => {
    await recordDamage({
      batchId: data.batchId,
      quantity: data.quantity,
      note: data.note || undefined,
    });
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-hidden flex flex-col sm:max-w-2xl">
        <DialogHeaderWithIcon
          icon={AlertTriangleIcon}
          variant="destructive"
          title={t("inventory.actions.recordDamage")}
          description={t("inventory.actions.recordDamageDescription")}
        />
        <form onSubmit={onSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-1 min-h-0">
            <FieldGroup className="gap-5">
              <FormSection
                icon={AlertTriangleIcon}
                title={t("inventory.actions.recordDamage")}
                accentClass="bg-destructive/10 text-destructive"
              >
                <Field>
                  <FieldLabel htmlFor="search">{t("common.search")}</FieldLabel>
                  <Input id="search" value={search} onChange={(e) => setSearch(e.target.value)} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="batchId">{t("inventory.fields.batchNumber")}</FieldLabel>
                  <select
                    id="batchId"
                    {...register("batchId")}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  >
                    <option value={0}>—</option>
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.productName} — {b.variantName} | {b.batchNumber} (qty: {b.quantity})
                      </option>
                    ))}
                  </select>
                  {errors.batchId && <FieldError>{errors.batchId.message}</FieldError>}
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="quantity">{t("inventory.fields.quantity")}</FieldLabel>
                    <Input id="quantity" type="number" {...register("quantity")} />
                    {errors.quantity && <FieldError>{errors.quantity.message}</FieldError>}
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="note">{t("inventory.fields.note")}</FieldLabel>
                    <Input id="note" {...register("note")} />
                  </Field>
                </div>
              </FormSection>
            </FieldGroup>
          </div>
          <FormFooter onCancel={() => onOpenChange(false)} isSubmitting={isRecording} submitVariant="destructive" />
        </form>
      </DialogContent>
    </Dialog>
  );
}
