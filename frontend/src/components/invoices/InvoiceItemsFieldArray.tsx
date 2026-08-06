import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FormSection } from "@/components/common/FormSection";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ReceiptIcon, PlusIcon, Trash2Icon, ScanLineIcon, SearchIcon } from "lucide-react";
import type { UseFormReturn, UseFieldArrayAppend } from "react-hook-form";
import type { InvoiceFormValues } from "@/types/invoice";
import { useAllProducts } from "@/hooks/useAllProducts";
import { usePackagingUnits } from "@/hooks/usePackagingUnits";
import { PackagingUnitService } from "@/services/PackagingUnitService";

type FormType = UseFormReturn<InvoiceFormValues>;

interface InvoiceItemsFieldArrayProps {
  fields: { id: string }[];
  register: FormType["register"];
  append: UseFieldArrayAppend<InvoiceFormValues, "items">;
  remove: (index: number) => void;
  errors: FormType["formState"]["errors"];
  setValue: FormType["setValue"];
  watch: FormType["watch"];
}

export function InvoiceItemsFieldArray({
  fields,
  register,
  append,
  remove,
  errors,
  setValue,
  watch,
}: InvoiceItemsFieldArrayProps) {
  const { t } = useTranslation();
  const [variantSearch, setVariantSearch] = useState("");
  const [showVariantPicker, setShowVariantPicker] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [barcodeTargetIndex, setBarcodeTargetIndex] = useState<number | null>(null);
  const [scanning, setScanning] = useState(false);

  const { variants } = useAllProducts({
    search: variantSearch,
    enabled: showVariantPicker,
  });

  const handleSelectVariant = (variant: { id: number; name: string; sku: string; sellPrice: number; productName: string }) => {
    const targetIndex = barcodeTargetIndex ?? 0;
    setValue(`items.${targetIndex}.description`, `${variant.productName} — ${variant.name}`, { shouldDirty: true });
    setValue(`items.${targetIndex}.unitPrice`, variant.sellPrice, { shouldDirty: true });
    setValue(`items.${targetIndex}.productVariantId`, variant.id, { shouldDirty: true });
    setValue(`items.${targetIndex}.unit`, "piece", { shouldDirty: true });
    setShowVariantPicker(false);
    setVariantSearch("");
    setBarcodeTargetIndex(null);
  };

  const handleBarcodeScan = async () => {
    if (!barcodeInput.trim()) return;
    setScanning(true);
    try {
      // New API: returns { variant, unit, factor }
      const res = await PackagingUnitService.findByBarcode(barcodeInput.trim());
      const { variant, unit, factor } = res.data;
      if (variant) {
        const targetIndex = barcodeTargetIndex ?? fields.length - 1;
        const productName = variant.product?.name ?? variant.name;
        setValue(`items.${targetIndex}.description`, productName ? `${productName} — ${variant.name}` : variant.name, { shouldDirty: true });
        // If a packaging unit was matched, use its sell price (or compute from factor)
        const price = unit?.sellPrice != null ? Number(unit.sellPrice) : Number(variant.sellPrice) * (factor || 1);
        setValue(`items.${targetIndex}.unitPrice`, price, { shouldDirty: true });
        setValue(`items.${targetIndex}.productVariantId`, variant.id, { shouldDirty: true });
        setValue(`items.${targetIndex}.unit`, unit?.name || "piece", { shouldDirty: true });

        // Auto-append a new empty row for the next scan
        if (barcodeTargetIndex == null) {
          append({ description: "", quantity: 1, unitPrice: 0, unit: "piece" });
        }
      }
    } catch {
      // Barcode not found — ignore
    }
    setScanning(false);
    setBarcodeInput("");
    setBarcodeTargetIndex(null);
  };

  return (
    <FormSection
      icon={ReceiptIcon}
      title={t("invoices.fields.items")}
      accentClass="bg-muted text-muted-foreground"
    >
      <div className="flex flex-col gap-2">
        {/* Barcode scan row */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <ScanLineIcon className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("inventory.actions.scanBarcode")}
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleBarcodeScan(); } }}
              className="ps-9"
              autoFocus
            />
          </div>
          <Button type="button" variant="outline" size="sm" onClick={handleBarcodeScan} disabled={scanning}>
            <ScanLineIcon className="size-4" />
            {scanning ? t("common.saving") : t("inventory.actions.scanBarcode")}
          </Button>
        </div>

        {/* Variant picker */}
        {showVariantPicker && (
          <div className="rounded-md border border-border/60 p-3 space-y-2 bg-muted/30">
            <div className="relative">
              <SearchIcon className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("common.search")}
                value={variantSearch}
                onChange={(e) => setVariantSearch(e.target.value)}
                className="ps-9"
                autoFocus
              />
            </div>
            <div className="max-h-[200px] overflow-y-auto space-y-1">
              {variants.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => handleSelectVariant(v)}
                  className="flex w-full items-center justify-between rounded-md px-3 py-2 text-start text-sm hover:bg-background"
                >
                  <div>
                    <div className="font-medium">{v.productName} — {v.name}</div>
                    <div className="text-xs text-muted-foreground">{v.sku}</div>
                  </div>
                  <div className="font-mono text-sm">{Number(v.sellPrice).toFixed(2)}</div>
                </button>
              ))}
              {variants.length === 0 && (
                <div className="py-4 text-center text-sm text-muted-foreground">{t("common.noData")}</div>
              )}
            </div>
          </div>
        )}

        {/* Header row */}
        <div className="hidden grid-cols-[1fr_90px_90px_110px_36px] gap-2 px-1 text-xs font-medium text-muted-foreground sm:grid">
          <span>{t("invoices.fields.description")}</span>
          <span className="text-center">{t("invoices.fields.quantity")}</span>
          <span className="text-center">{t("inventory.packaging.unit")}</span>
          <span className="text-end">{t("invoices.fields.unitPrice")}</span>
          <span />
        </div>
        {fields.map((field, index) => {
          const variantId = watch(`items.${index}.productVariantId`);
          const currentUnit = watch(`items.${index}.unit`) || "piece";
          return (
            <div
              key={field.id}
              className="grid grid-cols-[1fr_90px_90px_110px_36px] items-start gap-2"
            >
              <div className="relative">
                <Input
                  placeholder={t("invoices.fields.description")}
                  {...register(`items.${index}.description`)}
                  data-invalid={!!errors.items?.[index]?.description}
                />
                {variantId && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                      {t("inventory.products")}
                    </span>
                  </div>
                )}
              </div>
              <Input
                type="number"
                min={1}
                placeholder="1"
                {...register(`items.${index}.quantity`, { valueAsNumber: true })}
              />
              {/* Unit selector */}
              <UnitSelect
                variantId={variantId}
                value={currentUnit}
                onChange={(unitName, price) => {
                  setValue(`items.${index}.unit`, unitName, { shouldDirty: true });
                  if (price != null) {
                    setValue(`items.${index}.unitPrice`, price, { shouldDirty: true });
                  }
                }}
              />
              <Input
                type="number"
                step="0.01"
                min={0}
                placeholder="0.00"
                {...register(`items.${index}.unitPrice`, { valueAsNumber: true })}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => remove(index)}
                disabled={fields.length === 1}
                className="text-destructive hover:text-destructive"
              >
                <Trash2Icon className="size-4" />
              </Button>
            </div>
          );
        })}
        {errors.items && (
          <FieldError>
            {typeof errors.items.message === "string"
              ? errors.items.message
              : t("invoices.noItems")}
          </FieldError>
        )}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ description: "", quantity: 1, unitPrice: 0, unit: "piece" })}
            className="mt-1 w-fit"
          >
            <PlusIcon className="size-4" />
            {t("invoices.addLineItem")}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => { setBarcodeTargetIndex(fields.length - 1); setShowVariantPicker(!showVariantPicker); }}
            className="mt-1 w-fit"
          >
            <SearchIcon className="size-4" />
            {t("inventory.products")}
          </Button>
        </div>
      </div>
    </FormSection>
  );
}

/**
 * Unit selector for an invoice line item.
 * When a product variant is selected, fetches its packaging units and lets
 * the user pick the unit (piece/box/carton). Updates the price accordingly.
 */
function UnitSelect({
  variantId,
  value,
  onChange,
}: {
  variantId?: number;
  value: string;
  onChange: (unitName: string, price?: number | null) => void;
}) {
  const { t } = useTranslation();
  const { packagingUnits } = usePackagingUnits(variantId);

  const units = packagingUnits;

  // If no packaging units defined, show a simple "piece" selector
  if (units.length === 0) {
    return (
      <Select value={value} onValueChange={(v) => onChange(v ?? "")}>
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
    <Select
      value={value}
      onValueChange={(v) => {
        const val = v ?? "";
        const unit = units.find((u) => u.name === val);
        const price = unit?.sellPrice != null ? Number(unit.sellPrice) : undefined;
        onChange(val, price);
      }}
    >
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
