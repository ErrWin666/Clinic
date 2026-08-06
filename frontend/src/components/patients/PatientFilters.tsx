import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchIcon, XIcon } from "lucide-react";

interface PatientFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  patientType: string;
  onTypeChange: (value: string) => void;
  gender: string;
  onGenderChange: (value: string) => void;
  onClear: () => void;
}

export function PatientFilters({
  search,
  onSearchChange,
  patientType,
  onTypeChange,
  gender,
  onGenderChange,
  onClear,
}: PatientFiltersProps) {
  const { t } = useTranslation();
  const hasActiveFilters = search || patientType || gender;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative flex-1 min-w-[200px]">
        <SearchIcon className="absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t("patients.searchPlaceholder")}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="ps-8"
        />
      </div>

      <Select
        value={patientType || "all"}
        onValueChange={(v) => onTypeChange(v === "all" ? "" : (v as string))}
      >
        <SelectTrigger className="w-full sm:w-[160px]">
          <SelectValue placeholder={t("patients.filters.allTypes")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("patients.filters.allTypes")}</SelectItem>
          <SelectItem value="regular">{t("patients.types.regular")}</SelectItem>
          <SelectItem value="guardian">{t("patients.types.guardian")}</SelectItem>
          <SelectItem value="child">{t("patients.types.child")}</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={gender || "all"}
        onValueChange={(v) => onGenderChange(v === "all" ? "" : (v as string))}
      >
        <SelectTrigger className="w-full sm:w-[140px]">
          <SelectValue placeholder={t("patients.filters.allGenders")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("patients.filters.allGenders")}</SelectItem>
          <SelectItem value="male">{t("patients.genders.male")}</SelectItem>
          <SelectItem value="female">{t("patients.genders.female")}</SelectItem>
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="text-muted-foreground hover:text-foreground"
        >
          <XIcon className="size-4" />
          {t("patients.filters.clear")}
        </Button>
      )}
    </div>
  );
}
