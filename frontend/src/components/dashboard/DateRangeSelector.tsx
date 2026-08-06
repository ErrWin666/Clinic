import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarRangeIcon, ArrowRightIcon } from "lucide-react";

interface DateRangeSelectorProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onPreset: (start: string, end: string) => void;
}

export function DateRangeSelector({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onPreset,
}: DateRangeSelectorProps) {
  const { t } = useTranslation();

  const today = new Date().toISOString().split("T")[0];

  const presets = [
    { label: t("dashboard.range7d"), days: 7 },
    { label: t("dashboard.range30d"), days: 30 },
    { label: t("dashboard.range90d"), days: 90 },
  ];

  const handlePreset = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    onPreset(start.toISOString().split("T")[0], end.toISOString().split("T")[0]);
  };

  return (
    <Card className="border-border/60 shadow-card">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15 shadow-soft">
            <CalendarRangeIcon className="size-4.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">
              {t("dashboard.dateRange")}
            </span>
            <span className="text-xs text-muted-foreground">
              {t("dashboard.dateRangeHint")}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="date"
            value={startDate}
            max={today}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="w-auto"
          />
          <ArrowRightIcon className="size-4 text-muted-foreground rtl:rotate-180" />
          <Input
            type="date"
            value={endDate}
            max={today}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="w-auto"
          />
          <div className="mx-1 h-6 w-px bg-border" />
          {presets.map((preset) => (
            <Button
              key={preset.days}
              variant="outline"
              size="sm"
              onClick={() => handlePreset(preset.days)}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
