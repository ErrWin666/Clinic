import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useAllProducts } from "@/hooks/useAllProducts";
import type { ProductVariantOption } from "@/lib/productUtils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PackageIcon, XIcon, CheckIcon, SearchIcon } from "lucide-react";

export type { ProductVariantOption };

interface ProductVariantComboboxProps {
  value: number | null;
  onChange: (id: number | null) => void;
  onSelect?: (variant: ProductVariantOption | null) => void;
  placeholder?: string;
}

export function ProductVariantCombobox({
  value,
  onChange,
  onSelect,
  placeholder,
}: ProductVariantComboboxProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [manualSelect, setManualSelect] = useState<ProductVariantOption | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { variants, isLoading } = useAllProducts({ search, enabled: open });
  const { variants: allVariants } = useAllProducts({
    search: "",
    enabled: !!value && !manualSelect,
  });

  const selected = manualSelect ??
    (value && allVariants.length > 0
      ? allVariants.find((v) => v.id === value) ?? null
      : null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const handleOpenChange = (v: boolean) => {
    setOpen(v);
    if (!v) setSearch("");
  };

  const handleSelect = (variant: ProductVariantOption) => {
    setManualSelect(variant);
    onChange(variant.id);
    onSelect?.(variant);
    setOpen(false);
  };

  const handleClear = () => {
    setManualSelect(null);
    onChange(null);
    onSelect?.(null);
    setSearch("");
  };

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="flex-1 justify-between font-normal"
            >
              {selected ? (
                <span className="flex items-center gap-2 truncate">
                  <span className="text-muted-foreground text-xs font-mono">
                    {selected.sku}
                  </span>
                  {selected.productName} — {selected.name}
                </span>
              ) : (
                <span className="text-muted-foreground">
                  {placeholder ?? t("inventory.fields.selectVariant")}
                </span>
              )}
              <PackageIcon className="size-4 shrink-0 opacity-50" />
            </Button>
          }
        />
        <PopoverContent className="w-[380px] p-0" align="start">
          <div className="relative">
            <SearchIcon className="absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              ref={inputRef}
              placeholder={t("common.search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-none border-0 border-b focus-visible:ring-0 focus-visible:border-input ps-8"
            />
          </div>
          <div className="max-h-[240px] overflow-y-auto p-1">
            {isLoading ? (
              <div className="flex flex-col gap-2 p-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full rounded-md" />
                ))}
              </div>
            ) : variants.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {search.trim() ? t("common.noResults") : t("common.search")}
              </div>
            ) : (
              variants.map((variant) => (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => handleSelect(variant)}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-muted cursor-pointer text-start"
                >
                  <span className="font-mono text-xs text-muted-foreground">
                    {variant.sku}
                  </span>
                  <span className="flex-1 truncate">
                    {variant.productName} — {variant.name}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {Number(variant.sellPrice).toFixed(2)}
                  </span>
                  {selected?.id === variant.id && (
                    <CheckIcon className="size-4 text-primary" />
                  )}
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
      {selected && (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t("common.clear")}
          onClick={handleClear}
          className="shrink-0"
        >
          <XIcon className="size-4" />
        </Button>
      )}
    </div>
  );
}
