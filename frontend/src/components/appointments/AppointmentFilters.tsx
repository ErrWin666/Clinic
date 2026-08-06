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
import { ENUMS } from "@/types/enums";

const APPOINTMENT_TYPES = ["consultation", "follow-up", "checkup", "surgery", "emergency", "vaccination", "lab-test", "imaging", "other"] as const;

interface AppointmentFiltersProps {
  status: string;
  setStatus: (v: string) => void;
  search: string;
  setSearch: (v: string) => void;
  appointmentType: string;
  setAppointmentType: (v: string) => void;
  onClear: () => void;
}

export function AppointmentFilters({
  status,
  setStatus,
  search,
  setSearch,
  appointmentType,
  setAppointmentType,
  onClear,
}: AppointmentFiltersProps) {
  const { t } = useTranslation();
  const hasActiveFilters = status || search || appointmentType;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative flex-1 min-w-[200px]">
        <SearchIcon className="absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t("patients.searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ps-8"
        />
      </div>

      <Select
        value={status || "all"}
        onValueChange={(v) => setStatus(v === "all" ? "" : (v as string))}
      >
        <SelectTrigger className="w-full sm:w-[160px]">
          <SelectValue placeholder={t("appointments.fields.status")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("appointments.fields.status")}</SelectItem>
          {ENUMS.APPOINTMENT_STATUS.map((s) => (
            <SelectItem key={s} value={s}>
              {t(`appointments.statuses.${s}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={appointmentType || "all"}
        onValueChange={(v) => setAppointmentType(v === "all" ? "" : (v as string))}
      >
        <SelectTrigger className="w-full sm:w-[160px]">
          <SelectValue placeholder={t("appointments.fields.appointmentType")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("appointments.fields.appointmentType")}</SelectItem>
          {APPOINTMENT_TYPES.map((type) => (
            <SelectItem key={type} value={type}>
              {t(`appointments.types.${type}`)}
            </SelectItem>
          ))}
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
