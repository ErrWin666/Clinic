import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm, useFieldArray } from "react-hook-form";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PackageCheckIcon } from "lucide-react";
import type { PurchaseOrder } from "@/types/models";
import { usePackagingUnits } from "@/hooks/usePackagingUnits";

const itemSchema = z.object({
  id: z.coerce.number().int().min(1),
  receivedQuantity: z.coerce.number().int().min(0),
  receivedUnit: z.string().default("piece"),
  batchNumber: z.string().optional(),
  expiryDate: z.string().optional(),
});

const schema = z.object({
  items: z.array(itemSchema),
});

type ReceiveValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchaseOrder: PurchaseOrder | null;
  onSubmit: (data: ReceiveValues) => Promise<void>;
  isPending: boolean;
}

export { type ReceiveValues };

export function ReceiveDialog({ open, onOpenChange, purchaseOrder, onSubmit, isPending }: Props) {
  const { t } = useTranslation();

  const { register, handleSubmit, reset, control, setValue, watch, formState: { errors } } = useForm<ReceiveValues>({
    resolver: typedResolver(schema),
    defaultValues: { items: [] },
  });

  const { fields } = useFieldArray({ control, name: "items" });

  useEffect(() => {
    if (open && purchaseOrder) {
      reset({
        items: (purchaseOrder.items ?? []).map((i) => ({
          id: i.id,
          receivedQuantity: i.receivedQuantity,
          receivedUnit: i.receivedUnit || "piece",
          batchNumber: i.batchNumber || "",
          expiryDate: i.expiryDate ? i.expiryDate.slice(0, 10) : "",
        })),
      });
    }
  }, [open, purchaseOrder, reset]);

  const handleFormSubmit = handleSubmit(async (data) => {
    await onSubmit(data);
    onOpenChange(false);
  });

  if (!purchaseOrder) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-hidden flex flex-col sm:max-w-2xl">
        <DialogHeaderWithIcon
          icon={PackageCheckIcon}
          variant="success"
          title={`${t("purchaseOrders.actions.receive")} — ${purchaseOrder.displayId}`}
          description={t("purchaseOrders.actions.receiveDescription")}
        />
        <form onSubmit={handleFormSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden px-1 min-h-0">
            <FieldGroup className="gap-5">
              <FormSection
                icon={PackageCheckIcon}
                title={t("purchaseOrders.actions.receive")}
                accentClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                contentClassName="p-0"
              >
                <ScrollArea className="h-full max-h-[55vh]">
                  <div className="flex flex-col gap-3 p-4">
                    {fields.map((field, idx) => {
                      const poItem = purchaseOrder.items?.find((i) => i.id === Number(field.id));
                      const variantId = poItem?.productVariantId;
                      const currentUnit = watch(`items.${idx}.receivedUnit`) || "piece";
                      return (
                        <div key={field.id} className="rounded-md border border-border/60 p-3 space-y-2">
                          <div className="text-sm font-medium">{poItem?.variant?.name || "—"}</div>
                          <div className="text-xs text-muted-foreground">
                            {t("inventory.fields.quantity")}: {poItem?.quantity} | {t("inventory.fields.unitCost")}: {Number(poItem?.unitCost ?? 0).toFixed(2)}
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                            <Field>
                              <FieldLabel htmlFor={`items.${idx}.receivedQuantity`} className="text-xs text-muted-foreground">
                                {t("purchaseOrders.actions.receive")}
                              </FieldLabel>
                              <Input id={`items.${idx}.receivedQuantity`} type="number" {...register(`items.${idx}.receivedQuantity`)} />
                            </Field>
                            <Field>
                              <FieldLabel className="text-xs text-muted-foreground">
                                {t("inventory.packaging.unit")}
                              </FieldLabel>
                              <ReceiveUnitSelect
                                variantId={variantId}
                                value={currentUnit}
                                onChange={(unitName) => setValue(`items.${idx}.receivedUnit`, unitName, { shouldDirty: true })}
                              />
                            </Field>
                            <Field>
                              <FieldLabel htmlFor={`items.${idx}.batchNumber`} className="text-xs text-muted-foreground">
                                {t("inventory.fields.batchNumber")}
                              </FieldLabel>
                              <Input id={`items.${idx}.batchNumber`} {...register(`items.${idx}.batchNumber`)} />
                            </Field>
                            <Field>
                              <FieldLabel htmlFor={`items.${idx}.expiryDate`} className="text-xs text-muted-foreground">
                                {t("inventory.fields.expiryDate")}
                              </FieldLabel>
                              <Input id={`items.${idx}.expiryDate`} type="date" {...register(`items.${idx}.expiryDate`)} />
                            </Field>
                          </div>
                        </div>
                      );
                    })}
                    {errors.items && <FieldError>{errors.items.message}</FieldError>}
                  </div>
                </ScrollArea>
              </FormSection>
            </FieldGroup>
          </div>
          <FormFooter onCancel={() => onOpenChange(false)} isSubmitting={isPending} />
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ReceiveUnitSelect({
  variantId,
  value,
  onChange,
}: {
  variantId?: number;
  value: string;
  onChange: (unitName: string) => void;
}) {
  const { t } = useTranslation();
  const { packagingUnits } = usePackagingUnits(variantId);

  const units = packagingUnits;

  if (units.length === 0) {
    return (
      <Select value={value} onValueChange={(v) => onChange(v ?? "")} disabled>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="piece">{t("inventory.packaging.piece")}</SelectItem>
        </SelectContent>
      </Select>
    );
  }

  return (
    <Select value={value} onValueChange={(v) => onChange(v ?? "")}>
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {units.map((unit) => (
          <SelectItem key={unit.id} value={unit.name}>
            {unit.shortName} (×{unit.factor})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
