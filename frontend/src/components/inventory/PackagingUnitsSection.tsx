import { useState } from "react";
import { useTranslation } from "react-i18next";
import { usePackagingUnits } from "@/hooks/usePackagingUnits";
import { FormSection } from "@/components/common/FormSection";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BarcodePrintDialog } from "@/components/inventory/BarcodePrintDialog";
import {
  PackageIcon,
  PlusIcon,
  Trash2Icon,
  SaveIcon,
  XIcon,
  PrinterIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PackagingUnit } from "@/types/models";

interface PackagingUnitsSectionProps {
  variantId: number | null;
  /** When true (create mode), units are collected locally and emitted to parent */
  onUnitsChange?: (units: PackagingUnit[]) => void;
  initialUnits?: PackagingUnit[];
}

interface DraftUnit {
  id?: number;
  name: string;
  shortName: string;
  factor: number;
  isBaseUnit: boolean;
  barcode: string;
  sellPrice: string;
}

const EMPTY_DRAFT: DraftUnit = {
  name: "",
  shortName: "",
  factor: 1,
  isBaseUnit: false,
  barcode: "",
  sellPrice: "",
};

export function PackagingUnitsSection({ variantId, onUnitsChange, initialUnits }: PackagingUnitsSectionProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<DraftUnit>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showBarcodePrint, setShowBarcodePrint] = useState(false);

  // For existing variant — fetch from API via hook
  const isExisting = variantId != null && !onUnitsChange;
  const {
    packagingUnits: apiUnits,
    isLoading,
    createUnit,
    updateUnit,
    deleteUnit,
  } = usePackagingUnits(isExisting ? variantId : null);

  const units: PackagingUnit[] = isExisting
    ? apiUnits
    : initialUnits ?? [];

  const handleAddOrUpdate = async () => {
    if (!draft.name || !draft.shortName) return;

    if (onUnitsChange) {
      // Local mode (create variant) — just emit
      const newUnit: PackagingUnit = {
        id: Date.now(),
        productVariantId: variantId ?? 0,
        name: draft.name,
        shortName: draft.shortName,
        factor: draft.factor,
        isBaseUnit: draft.isBaseUnit,
        barcode: draft.barcode || null,
        sellPrice: draft.sellPrice ? Number(draft.sellPrice) : null,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      onUnitsChange([...units, newUnit]);
      setDraft(EMPTY_DRAFT);
      return;
    }

    const payload = {
      name: draft.name,
      shortName: draft.shortName,
      factor: draft.factor,
      isBaseUnit: draft.isBaseUnit,
      barcode: draft.barcode || null,
      sellPrice: draft.sellPrice ? Number(draft.sellPrice) : null,
    };

    if (editingId != null) {
      await updateUnit({ id: editingId, payload });
      setEditingId(null);
    } else {
      await createUnit(payload);
    }
    setDraft(EMPTY_DRAFT);
  };

  const handleEdit = (unit: PackagingUnit) => {
    setEditingId(unit.id);
    setDraft({
      id: unit.id,
      name: unit.name,
      shortName: unit.shortName,
      factor: unit.factor,
      isBaseUnit: unit.isBaseUnit,
      barcode: unit.barcode || "",
      sellPrice: unit.sellPrice != null ? String(unit.sellPrice) : "",
    });
  };

  const handleDelete = (id: number) => {
    if (onUnitsChange) {
      onUnitsChange(units.filter((u) => u.id !== id));
      return;
    }
    deleteUnit(id);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
  };

  return (
    <FormSection
      icon={PackageIcon}
      title={t("inventory.form.sections.packagingUnits")}
      accentClass="bg-purple-500/10 text-purple-600"
      description={t("inventory.form.sections.packagingUnitsDescription")}
    >
      {/* Existing units list */}
      <div className="flex flex-col gap-2">
        {isExisting && isLoading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-lg" />
          ))
        ) : units.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">
            {t("inventory.form.noPackagingUnits")}
          </p>
        ) : (
          units.map((unit) => (
            <div
              key={unit.id}
              className={cn(
                "flex items-center gap-3 rounded-xl border border-border/50 p-3 transition-colors",
                editingId === unit.id && "ring-2 ring-primary/30 bg-primary/5"
              )}
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600">
                <PackageIcon className="size-4" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{unit.name}</span>
                  {unit.isBaseUnit && (
                    <Badge variant="secondary" className="text-xs">
                      {t("inventory.packaging.baseUnit")}
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  1 {unit.shortName} = {unit.factor} {t("inventory.packaging.pieces")}
                  {unit.sellPrice != null && ` · ${unit.sellPrice}`}
                </span>
              </div>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label={t("common.edit")}
                  onClick={() => handleEdit(unit)}
                >
                  <SaveIcon className="size-3.5" />
                </Button>
                {!unit.isBaseUnit && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 text-destructive hover:text-destructive"
                    aria-label={t("common.delete")}
                    onClick={() => handleDelete(unit.id)}
                  >
                    <Trash2Icon className="size-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Print Barcodes button */}
      {units.filter((u) => u.barcode).length > 0 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-fit"
          onClick={() => setShowBarcodePrint(true)}
        >
          <PrinterIcon className="size-4" />
          {t("inventory.barcode.printBarcodes")}
        </Button>
      )}

      {/* Add/Edit form */}
      <div className="rounded-xl border border-dashed border-border/60 p-3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Input
            placeholder={t("inventory.packaging.namePlaceholder")}
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            className="text-sm"
          />
          <Input
            placeholder={t("inventory.packaging.shortNamePlaceholder")}
            value={draft.shortName}
            onChange={(e) => setDraft({ ...draft, shortName: e.target.value })}
            className="text-sm"
          />
          <Input
            type="number"
            min={1}
            placeholder={t("inventory.packaging.factorPlaceholder")}
            value={draft.factor}
            onChange={(e) => setDraft({ ...draft, factor: Number(e.target.value) })}
            className="text-sm"
          />
          <Input
            placeholder={t("inventory.packaging.barcodePlaceholder")}
            value={draft.barcode}
            onChange={(e) => setDraft({ ...draft, barcode: e.target.value })}
            className="text-sm"
          />
        </div>
        <div className="mt-2 flex items-center gap-2">
          <Input
            type="number"
            step="0.01"
            placeholder={t("inventory.packaging.sellPricePlaceholder")}
            value={draft.sellPrice}
            onChange={(e) => setDraft({ ...draft, sellPrice: e.target.value })}
            className="max-w-[180px] text-sm"
          />
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={draft.isBaseUnit}
              onChange={(e) => setDraft({ ...draft, isBaseUnit: e.target.checked })}
              className="size-3.5"
            />
            {t("inventory.packaging.baseUnit")}
          </label>
          <div className="flex-1" />
          {editingId != null && (
            <Button type="button" variant="ghost" size="sm" onClick={handleCancelEdit}>
              <XIcon className="size-3.5" />
              {t("common.cancel")}
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            onClick={handleAddOrUpdate}
            disabled={!draft.name || !draft.shortName}
          >
            <PlusIcon className="size-3.5" />
            {editingId != null ? t("common.save") : t("common.add")}
          </Button>
        </div>
      </div>

      {/* Barcode Print Dialog */}
      <BarcodePrintDialog
        open={showBarcodePrint}
        onOpenChange={setShowBarcodePrint}
        items={units
          .filter((u) => u.barcode)
          .map((u) => ({
            name: u.name,
            shortName: u.shortName,
            barcode: u.barcode || "",
            sellPrice: u.sellPrice,
          }))}
      />
    </FormSection>
  );
}
