import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm, useFieldArray } from "react-hook-form";
import { typedResolver } from "@/lib/zodResolver";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { DialogHeaderWithIcon } from "@/components/common/DialogHeaderWithIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldGroup, FieldLabel, FieldError } from "@/components/ui/field";
import { FormSection } from "@/components/common/FormSection";
import { FormFooter } from "@/components/common/FormFooter";
import { SupplierCombobox } from "@/components/common/SupplierCombobox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAllProducts } from "@/hooks/useAllProducts";
import {
  ShoppingCartIcon,
  ReceiptIcon,
  CalendarIcon,
  StickyNoteIcon,
  SearchIcon,
  PlusIcon,
  TrashIcon,
} from "lucide-react";
import type { PurchaseOrder } from "@/types/models";

const itemSchema = z.object({
  productVariantId: z.coerce.number().int().min(1, "Required"),
  quantity: z.coerce.number().int().min(1, "Must be >= 1"),
  unitCost: z.coerce.number().min(0, "Must be >= 0"),
  batchNumber: z.string().optional(),
  expiryDate: z.string().optional(),
});

const schema = z.object({
  supplierId: z.coerce.number().int().min(1, "Required"),
  orderDate: z.string().min(1, "Required"),
  note: z.string().optional(),
  items: z.array(itemSchema).min(1, "At least one item required"),
});

type POFormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchaseOrder?: PurchaseOrder | null;
  onSubmit: (data: POFormValues) => Promise<void>;
  isPending: boolean;
}

export { type POFormValues };

export function PurchaseOrderForm({ open, onOpenChange, purchaseOrder, onSubmit, isPending }: Props) {
  const { t } = useTranslation();
  const [variantSearch, setVariantSearch] = useState("");

  const { variants } = useAllProducts({ search: variantSearch, enabled: open });

  const { register, handleSubmit, reset, control, formState: { errors }, watch, setValue } = useForm<POFormValues>({
    resolver: typedResolver(schema),
    defaultValues: {
      supplierId: 0,
      orderDate: new Date().toISOString().slice(0, 10),
      note: "",
      items: [{ productVariantId: 0, quantity: 1, unitCost: 0, batchNumber: "", expiryDate: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  useEffect(() => {
    if (open) {
      if (purchaseOrder) {
        reset({
          supplierId: purchaseOrder.supplierId,
          orderDate: purchaseOrder.orderDate.slice(0, 10),
          note: purchaseOrder.note || "",
          items: (purchaseOrder.items ?? []).map((i) => ({
            productVariantId: i.productVariantId,
            quantity: i.quantity,
            unitCost: i.unitCost,
            batchNumber: i.batchNumber || "",
            expiryDate: i.expiryDate ? i.expiryDate.slice(0, 10) : "",
          })),
        });
      } else {
        reset({
          supplierId: 0,
          orderDate: new Date().toISOString().slice(0, 10),
          note: "",
          items: [{ productVariantId: 0, quantity: 1, unitCost: 0, batchNumber: "", expiryDate: "" }],
        });
      }
    }
  }, [open, purchaseOrder, reset]);

  const handleFormSubmit = handleSubmit(async (data) => {
    await onSubmit(data);
    onOpenChange(false);
  });

  const watchSupplierId = watch("supplierId");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[85vh] max-w-4xl overflow-hidden flex flex-col sm:max-w-4xl"
        data-slot="purchase-order-form"
      >
        <DialogHeaderWithIcon
          icon={ShoppingCartIcon}
          variant="primary"
          title={purchaseOrder ? t("common.edit") : t("purchaseOrders.actions.add")}
          description={t("purchaseOrders.form.description")}
        />

        <form onSubmit={handleFormSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-1 min-h-0">
            <FieldGroup className="gap-5">
              {/* Section: Order Info */}
              <FormSection
                icon={ShoppingCartIcon}
                title={t("purchaseOrders.form.sections.orderInfo")}
                accentClass="bg-primary/10 text-primary"
              >
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel className="flex items-center gap-1.5">
                      <ShoppingCartIcon className="size-3.5 text-muted-foreground" />
                      {t("purchaseOrders.fields.supplier")}
                    </FieldLabel>
                    <SupplierCombobox
                      value={watchSupplierId || null}
                      onChange={(id) => setValue("supplierId", id ?? 0)}
                    />
                    {errors.supplierId && <FieldError>{errors.supplierId.message}</FieldError>}
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="orderDate" className="flex items-center gap-1.5">
                      <CalendarIcon className="size-3.5 text-muted-foreground" />
                      {t("purchaseOrders.fields.orderDate")}
                    </FieldLabel>
                    <Input
                      id="orderDate"
                      type="date"
                      data-invalid={!!errors.orderDate}
                      aria-invalid={!!errors.orderDate}
                      {...register("orderDate")}
                    />
                    {errors.orderDate && <FieldError>{errors.orderDate.message}</FieldError>}
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="note" className="flex items-center gap-1.5">
                    <StickyNoteIcon className="size-3.5 text-muted-foreground" />
                    {t("inventory.fields.note")}
                  </FieldLabel>
                  <Textarea id="note" rows={2} placeholder={t("inventory.fields.note")} {...register("note")} />
                </Field>
              </FormSection>

              {/* Section: Items */}
              <FormSection
                icon={ReceiptIcon}
                title={t("purchaseOrders.form.sections.items")}
                accentClass="bg-primary/10 text-primary"
                contentClassName="flex flex-col gap-4 p-4"
              >
                <Field>
                  <FieldLabel htmlFor="variantSearch" className="flex items-center gap-1.5">
                    <SearchIcon className="size-3.5 text-muted-foreground" />
                    {t("common.search")}
                  </FieldLabel>
                  <Input
                    id="variantSearch"
                    placeholder={t("common.search")}
                    value={variantSearch}
                    onChange={(e) => setVariantSearch(e.target.value)}
                  />
                </Field>

                <ScrollArea className="h-full max-h-[40vh]">
                  <div className="space-y-2 pr-2">
                    <div className="flex items-center justify-between">
                      <FieldLabel className="flex items-center gap-1.5">
                        <ReceiptIcon className="size-3.5 text-muted-foreground" />
                        {t("purchaseOrders.fields.items")}
                      </FieldLabel>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => append({ productVariantId: 0, quantity: 1, unitCost: 0, batchNumber: "", expiryDate: "" })}
                      >
                        <PlusIcon className="size-3.5" />
                        {t("common.add")}
                      </Button>
                    </div>
                    {fields.map((field, idx) => (
                      <div key={field.id} className="rounded-md border border-border/60 p-3 space-y-2">
                        <div className="flex items-start gap-2">
                          <select
                            {...register(`items.${idx}.productVariantId`)}
                            className="flex h-9 flex-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                          >
                            <option value={0}>—</option>
                            {variants.map((v) => (
                              <option key={v.id} value={v.id}>{v.productName} — {v.name} ({v.sku})</option>
                            ))}
                          </select>
                          <Button type="button" variant="ghost" size="icon" className="size-9 text-destructive" aria-label={t("common.delete")} onClick={() => remove(idx)}>
                            <TrashIcon className="size-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <Input type="number" placeholder={t("inventory.fields.quantity")} {...register(`items.${idx}.quantity`)} />
                          <Input type="number" step="0.01" placeholder={t("inventory.fields.unitCost")} {...register(`items.${idx}.unitCost`)} />
                          <Input placeholder={t("inventory.fields.batchNumber")} {...register(`items.${idx}.batchNumber`)} />
                        </div>
                        <Input type="date" {...register(`items.${idx}.expiryDate`)} />
                      </div>
                    ))}
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
