import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import { SunIcon, MoonIcon, PaletteIcon, ClockIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { FormSection } from "@/components/common/FormSection";
import { useSettings, useUpdateSettings } from "@/hooks/useSettings";
import type { SettingsUpdateItem } from "@/types/settings";

const DAY_KEYS = [0, 1, 2, 3, 4, 5, 6] as const;

export function AppearanceTab() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { data: settingsData, isLoading } = useSettings();
  const { updateSettings, isUpdating } = useUpdateSettings();

  const ui = useMemo(() => settingsData?.data?.ui ?? {}, [settingsData?.data?.ui]);
  const uiRef = useRef(ui);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [workingDays, setWorkingDays] = useState<number[]>([0, 1, 2, 3, 4]);

  useEffect(() => {
    if (uiRef.current === ui) return;
    uiRef.current = ui;
    const wh = ui.workingHours as Record<string, unknown> | undefined;
    if (wh) {
      /* eslint-disable react-hooks/set-state-in-effect */
      if (wh.start) setStartTime(wh.start as string);
      if (wh.end) setEndTime(wh.end as string);
      if (Array.isArray(wh.days)) setWorkingDays(wh.days as number[]);
      /* eslint-enable react-hooks/set-state-in-effect */
    }
    if (ui.theme) {
      setTheme(ui.theme as string);
    }
  }, [ui, setTheme]);

  const handleThemeChange = (newTheme: "light" | "dark") => {
    setTheme(newTheme);
    const items: SettingsUpdateItem[] = [
      { key: "theme", value: newTheme, category: "ui" },
    ];
    updateSettings(items);
  };

  const handleSaveWorkingHours = async () => {
    const items: SettingsUpdateItem[] = [
      {
        key: "workingHours",
        value: JSON.stringify({ start: startTime, end: endTime, days: workingDays }),
        category: "ui",
      },
    ];
    await updateSettings(items);
  };

  const toggleDay = (day: number) => {
    setWorkingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  if (isLoading) {
    return (
      <Card className="shadow-card border-border/60">
        <CardContent className="flex h-40 items-center justify-center">
          <Spinner className="size-6" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card border-border/60">
      <CardHeader>
        <CardTitle className="text-lg">{t("settings.tabs.appearance")}</CardTitle>
      </CardHeader>
      <CardContent>
        <FieldGroup className="gap-5">
          <FormSection
            icon={PaletteIcon}
            title={t("settings.appearance.theme")}
            accentClass="bg-primary/10 text-primary"
          >
            <Field>
              <FieldLabel>{t("settings.appearance.theme")}</FieldLabel>
              <div className="flex gap-2">
                <Button
                  variant={theme === "light" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleThemeChange("light")}
                >
                  <SunIcon className="size-4" />
                  {t("settings.appearance.light")}
                </Button>
                <Button
                  variant={theme === "dark" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleThemeChange("dark")}
                >
                  <MoonIcon className="size-4" />
                  {t("settings.appearance.dark")}
                </Button>
              </div>
            </Field>
          </FormSection>

          <FormSection
            icon={ClockIcon}
            title={t("settings.appearance.workingHours")}
            accentClass="bg-blue-500/10 text-blue-600 dark:text-blue-400"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="startTime">
                  {t("settings.appearance.startTime")}
                </FieldLabel>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="endTime">
                  {t("settings.appearance.endTime")}
                </FieldLabel>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </Field>
            </div>

            <Field>
              <FieldLabel>{t("settings.appearance.workingDays")}</FieldLabel>
              <div className="flex flex-wrap gap-3">
                {DAY_KEYS.map((day) => (
                  <label
                    key={day}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Checkbox
                      checked={workingDays.includes(day)}
                      onCheckedChange={() => toggleDay(day)}
                    />
                    <span className="text-sm">
                      {t(`settings.appearance.days.${day}`)}
                    </span>
                  </label>
                ))}
              </div>
            </Field>

            <Button
              onClick={handleSaveWorkingHours}
              disabled={isUpdating}
              className="w-fit"
            >
              {isUpdating && <Spinner className="size-4" />}
              {t("settings.appearance.save")}
            </Button>
          </FormSection>
        </FieldGroup>
      </CardContent>
    </Card>
  );
}
