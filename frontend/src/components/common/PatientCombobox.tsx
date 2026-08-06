import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  usePatientAutocomplete,
  usePatientById,
  type AutocompleteResult,
} from "@/hooks/usePatientAutocomplete";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UsersIcon, XIcon, CheckIcon, SearchIcon } from "lucide-react";

interface PatientComboboxProps {
  value: number | null;
  onChange: (id: number | null) => void;
  onSelect?: (patient: AutocompleteResult | null) => void;
  placeholder?: string;
}

export function PatientCombobox({
  value,
  onChange,
  onSelect,
  placeholder,
}: PatientComboboxProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [manualSelect, setManualSelect] = useState<AutocompleteResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { results, isLoading } = usePatientAutocomplete(search, open);
  const { patient } = usePatientById(value, !!value && !manualSelect);

  const selected = manualSelect ??
    (patient
      ? {
          id: patient.id,
          displayId: patient.displayId,
          fullName: patient.fullName,
          phoneNumber: patient.phoneNumber,
          gender: patient.gender,
          birthDate: patient.birthDate,
          address: patient.address,
          email: patient.email,
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

  const handleSelect = (patient: AutocompleteResult) => {
    setManualSelect(patient);
    onChange(patient.id);
    onSelect?.(patient);
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
                  <span className="text-muted-foreground font-mono text-xs">
                    {selected.displayId}
                  </span>
                  {selected.fullName}
                </span>
              ) : (
                <span className="text-muted-foreground">
                  {placeholder ?? t("appointments.form.patientMode")}
                </span>
              )}
              <UsersIcon className="size-4 shrink-0 opacity-50" />
            </Button>
          }
        />
        <PopoverContent className="w-[340px] p-0" align="start">
          <div className="relative">
            <SearchIcon className="absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              ref={inputRef}
              placeholder={t("patients.searchPlaceholder")}
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
                {search.trim() ? t("patients.noResults") : t("patients.searchPlaceholder")}
              </div>
            ) : (
              results.map((patient) => (
                <button
                  key={patient.id}
                  type="button"
                  onClick={() => handleSelect(patient)}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-muted cursor-pointer text-start"
                >
                  <span className="font-mono text-xs text-muted-foreground">
                    {patient.displayId}
                  </span>
                  <span className="flex-1 truncate">{patient.fullName}</span>
                  {selected?.id === patient.id && (
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
