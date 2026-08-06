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

interface InvoiceFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  startDate: string;
  onStartDateChange: (value: string) => void;
  endDate: string;
  onEndDateChange: (value: string) => void;
  minAmount: string;
  onMinAmountChange: (value: string) => void;
  maxAmount: string;
  onMaxAmountChange: (value: string) => void;
  onClear: () => void;
}

export function InvoiceFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  minAmount,
  onMinAmountChange,
  maxAmount,
  onMaxAmountChange,
  onClear,
}: InvoiceFiltersProps) {
  const { t } = useTranslation();
  const hasActiveFilters =
    search || status || startDate || endDate || minAmount || maxAmount;

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
        value={status || "all"}
        onValueChange={(v) => { if (v) onStatusChange(v === "all" ? "" : v); }}
      >
        <SelectTrigger className="w-full sm:w-[160px]">
          <SelectValue placeholder={t("invoices.fields.status")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("patients.filters.allTypes")}</SelectItem>
          <SelectItem value="unpaid">{t("invoices.statuses.unpaid")}</SelectItem>
          <SelectItem value="partially-paid">{t("invoices.statuses.partially-paid")}</SelectItem>
          <SelectItem value="paid">{t("invoices.statuses.paid")}</SelectItem>
          <SelectItem value="overdue">{t("invoices.statuses.overdue")}</SelectItem>
          <SelectItem value="cancelled">{t("invoices.statuses.cancelled")}</SelectItem>
        </SelectContent>
      </Select>

      <Input
        type="date"
        value={startDate}
        onChange={(e) => onStartDateChange(e.target.value)}
        className="w-full sm:w-[150px]"
        title={t("invoices.fields.startDate")}
      />

      <Input
        type="date"
        value={endDate}
        onChange={(e) => onEndDateChange(e.target.value)}
        className="w-full sm:w-[150px]"
        title={t("invoices.fields.endDate")}
      />

      <Input
        type="number"
        min={0}
        placeholder={t("invoices.fields.minAmount")}
        value={minAmount}
        onChange={(e) => onMinAmountChange(e.target.value)}
        className="w-full sm:w-[120px]"
      />

      <Input
        type="number"
        min={0}
        placeholder={t("invoices.fields.maxAmount")}
        value={maxAmount}
        onChange={(e) => onMaxAmountChange(e.target.value)}
        className="w-full sm:w-[120px]"
      />

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
