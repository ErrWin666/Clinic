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
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAllProducts } from "@/hooks/useAllProducts";
import {
  BoxesIcon,
  ReceiptIcon,
  StickyNoteIcon,
  SearchIcon,
  PackageIcon,
  PlusIcon,
  TrashIcon,
} from "lucide-react";
import type { ProductBundle } from "@/types/models";

const itemSchema = z.object({
  productVariantId: z.coerce.number().int().min(1, "Required"),
  quantity: z.coerce.number().int().min(1, "Must be >= 1"),
});

const schema = z.object({
  productId: z.coerce.number().int().min(1, "Required"),
  description: z.string().optional(),
  items: z.array(itemSchema).min(1, "At least one item required"),
});

type BundleFormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bundle?: ProductBundle | null;
  onSubmit: (data: BundleFormValues) => Promise<void>;
  isPending: boolean;
}

export { type BundleFormValues };

export function ProductBundleForm({ open, onOpenChange, bundle, onSubmit, isPending }: Props) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");

  const { products, variants } = useAllProducts({ search, enabled: open });

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<BundleFormValues>({
    resolver: typedResolver(schema),
    defaultValues: { productId: 0, description: "", items: [{ productVariantId: 0, quantity: 1 }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  useEffect(() => {
    if (open) {
      if (bundle) {
        reset({
          productId: bundle.productId,
          description: bundle.description || "",
          items: (bundle.items ?? []).map((i) => ({ productVariantId: i.productVariantId, quantity: i.quantity })),
        });
      } else {
        reset({ productId: 0, description: "", items: [{ productVariantId: 0, quantity: 1 }] });
      }
    }
  }, [open, bundle, reset]);

  const handleFormSubmit = handleSubmit(async (data) => {
    await onSubmit(data);
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[85vh] max-w-4xl overflow-hidden flex flex-col sm:max-w-4xl"
        data-slot="product-bundle-form"
      >
        <DialogHeaderWithIcon
          icon={BoxesIcon}
          variant="primary"
          title={bundle ? t("common.edit") : t("inventory.actions.addBundle")}
          description={t("inventory.form.bundleDescription")}
        />

        <form onSubmit={handleFormSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-1 min-h-0">
            <FieldGroup className="gap-5">
              {/* Section: Bundle */}
              <FormSection
                icon={BoxesIcon}
                title={t("inventory.form.sections.bundle")}
                accentClass="bg-primary/10 text-primary"
              >
                <Field>
                  <FieldLabel htmlFor="search" className="flex items-center gap-1.5">
                    <SearchIcon className="size-3.5 text-muted-foreground" />
                    {t("common.search")}
                  </FieldLabel>
                  <Input
                    id="search"
                    placeholder={t("common.search")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="productId" className="flex items-center gap-1.5">
                    <PackageIcon className="size-3.5 text-muted-foreground" />
                    {t("inventory.products")}
                  </FieldLabel>
                  <select
                    id="productId"
                    {...register("productId")}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  >
                    <option value={0}>—</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  {errors.productId && <FieldError>{errors.productId.message}</FieldError>}
                </Field>

                <Field>
                  <FieldLabel htmlFor="description" className="flex items-center gap-1.5">
                    <StickyNoteIcon className="size-3.5 text-muted-foreground" />
                    {t("inventory.fields.description")}
                  </FieldLabel>
                  <Textarea id="description" rows={2} placeholder={t("inventory.fields.description")} {...register("description")} />
                </Field>
              </FormSection>

              {/* Section: Items */}
              <FormSection
                icon={ReceiptIcon}
                title={t("inventory.form.sections.items")}
                accentClass="bg-primary/10 text-primary"
                contentClassName="flex flex-col gap-4 p-4"
              >
                <ScrollArea className="h-full max-h-[40vh]">
                  <div className="space-y-2 pr-2">
                    <div className="flex items-center justify-between">
                      <FieldLabel className="flex items-center gap-1.5">
                        <ReceiptIcon className="size-3.5 text-muted-foreground" />
                        {t("inventory.fields.items")}
                      </FieldLabel>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => append({ productVariantId: 0, quantity: 1 })}
                      >
                        <PlusIcon className="size-3.5" />
                        {t("common.add")}
                      </Button>
                    </div>
                    {fields.map((field, idx) => (
                      <div key={field.id} className="flex items-start gap-2">
                        <select
                          {...register(`items.${idx}.productVariantId`)}
                          className="flex h-9 flex-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                        >
                          <option value={0}>—</option>
                          {variants.map((v) => (
                            <option key={v.id} value={v.id}>{v.productName} — {v.name} ({v.sku})</option>
                          ))}
                        </select>
                        <Input type="number" className="w-20" placeholder={t("inventory.fields.quantity")} {...register(`items.${idx}.quantity`)} />
                        <Button type="button" variant="ghost" size="icon" className="size-9 text-destructive" aria-label={t("common.delete")} onClick={() => remove(idx)}>
                          <TrashIcon className="size-4" />
                        </Button>
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
