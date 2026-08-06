import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  useSupplierAutocomplete,
  useSupplierById,
} from "@/hooks/useSupplierAutocomplete";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TruckIcon, XIcon, CheckIcon, SearchIcon } from "lucide-react";

export interface SupplierOption {
  id: number;
  name: string;
  contactPerson: string | null;
  phone: string | null;
  balance: number;
}

interface SupplierComboboxProps {
  value: number | null;
  onChange: (id: number | null) => void;
  onSelect?: (supplier: SupplierOption | null) => void;
  placeholder?: string;
}

export function SupplierCombobox({
  value,
  onChange,
  onSelect,
  placeholder,
}: SupplierComboboxProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [manualSelect, setManualSelect] = useState<SupplierOption | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { suppliers, isLoading } = useSupplierAutocomplete(search, open);
  const { supplier } = useSupplierById(value, !!value && !manualSelect);

  const results: SupplierOption[] = suppliers.map((s) => ({
    id: s.id,
    name: s.name,
    contactPerson: s.contactPerson ?? null,
    phone: s.phone ?? null,
    balance: Number(s.balance ?? 0),
  }));

  const selected = manualSelect ??
    (supplier
      ? {
          id: supplier.id,
          name: supplier.name,
          contactPerson: supplier.contactPerson ?? null,
          phone: supplier.phone ?? null,
          balance: Number(supplier.balance ?? 0),
        }
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

  const handleSelect = (supplier: SupplierOption) => {
    setManualSelect(supplier);
    onChange(supplier.id);
    onSelect?.(supplier);
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
                  {selected.name}
                  {selected.contactPerson && (
                    <span className="text-muted-foreground text-xs">
                      — {selected.contactPerson}
                    </span>
                  )}
                </span>
              ) : (
                <span className="text-muted-foreground">
                  {placeholder ?? t("suppliers.fields.selectSupplier")}
                </span>
              )}
              <TruckIcon className="size-4 shrink-0 opacity-50" />
            </Button>
          }
        />
        <PopoverContent className="w-[340px] p-0" align="start">
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
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full rounded-md" />
                ))}
              </div>
            ) : results.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {search.trim() ? t("common.noResults") : t("common.search")}
              </div>
            ) : (
              results.map((supplier) => (
                <button
                  key={supplier.id}
                  type="button"
                  onClick={() => handleSelect(supplier)}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-muted cursor-pointer text-start"
                >
                  <span className="flex-1 truncate">{supplier.name}</span>
                  {supplier.contactPerson && (
                    <span className="text-xs text-muted-foreground truncate">
                      {supplier.contactPerson}
                    </span>
                  )}
                  {selected?.id === supplier.id && (
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
