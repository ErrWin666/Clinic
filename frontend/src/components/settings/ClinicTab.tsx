import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Building2Icon, MapPinIcon, PhoneIcon, MailIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { FormSection } from "@/components/common/FormSection";
import { ClinicLogoUpload } from "@/components/settings/ClinicLogoUpload";
import { useSettings, useUpdateSettings } from "@/hooks/useSettings";
import { getLanguageLabel } from "@/lib/i18n";
import type { SettingsUpdateItem } from "@/types/settings";

interface ClinicFormValues {
  clinicName: string;
  currency: string;
  language: string;
  address: string;
  phone: string;
  email: string;
}

const CURRENCIES = ["USD", "SAR", "EGP", "AED", "EUR"];
const LANGUAGES = ["en", "ar"];

export function ClinicTab() {
  const { t, i18n } = useTranslation();
  const { data: settingsData, isLoading } = useSettings();
  const { updateSettings, isUpdating } = useUpdateSettings();

  const clinic = useMemo(() => settingsData?.data?.clinic ?? {}, [settingsData?.data?.clinic]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { isDirty },
  } = useForm<ClinicFormValues>({
    defaultValues: {
      clinicName: "",
      currency: "USD",
      language: "en",
      address: "",
      phone: "",
      email: "",
    },
  });

  useEffect(() => {
    if (clinic.name !== undefined || clinic.currency !== undefined || clinic.language !== undefined) {
      reset({
        clinicName: (clinic.name as string) ?? "",
        currency: (clinic.currency as string) ?? "USD",
        language: (clinic.language as string) ?? "en",
        address: (clinic.address as string) ?? "",
        phone: (clinic.phone as string) ?? "",
        email: (clinic.email as string) ?? "",
      });
    }
  }, [clinic, reset]);

  const watchedLanguage = watch("language");
  const watchedCurrency = watch("currency");

  const onSubmit = async (data: ClinicFormValues) => {
    const items: SettingsUpdateItem[] = [
      { key: "clinic.name", value: data.clinicName, category: "clinic" },
      { key: "clinic.currency", value: data.currency, category: "clinic" },
      { key: "clinic.address", value: data.address, category: "clinic" },
      { key: "clinic.phone", value: data.phone, category: "clinic" },
      { key: "clinic.email", value: data.email, category: "clinic" },
      { key: "clinic.language", value: data.language, category: "clinic" },
    ];
    await updateSettings(items);
    if (data.language !== i18n.language) {
      i18n.changeLanguage(data.language);
      document.dir = data.language === "ar" ? "rtl" : "ltr";
    }
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
        <CardTitle className="text-lg">{t("settings.tabs.clinic")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup className="gap-5">
            <ClinicLogoUpload logoPath={(clinic.logo as string) || ""} />

            <FormSection
              icon={Building2Icon}
              title={t("settings.clinic.clinicName")}
              accentClass="bg-primary/10 text-primary"
            >
              <Field>
                <FieldLabel htmlFor="clinicName">
                  {t("settings.clinic.clinicName")}
                </FieldLabel>
                <Input id="clinicName" {...register("clinicName")} />
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel>{t("settings.clinic.currency")}</FieldLabel>
                  <Select
                    value={watchedCurrency}
                    onValueChange={(v) => v && setValue("currency", v, { shouldDirty: true })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel>{t("settings.clinic.language")}</FieldLabel>
                  <Select
                    value={watchedLanguage}
                    onValueChange={(v) => v && setValue("language", v, { shouldDirty: true })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((l) => (
                        <SelectItem key={l} value={l}>
                          {getLanguageLabel(l)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </FormSection>

            <FormSection
              icon={MapPinIcon}
              title={t("settings.clinic.address")}
              accentClass="bg-blue-500/10 text-blue-600 dark:text-blue-400"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field className="sm:col-span-2">
                  <FieldLabel htmlFor="clinicAddress" className="flex items-center gap-1.5">
                    <MapPinIcon className="size-3.5 text-muted-foreground" />
                    {t("settings.clinic.address")}
                  </FieldLabel>
                  <Input id="clinicAddress" {...register("address")} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="clinicPhone" className="flex items-center gap-1.5">
                    <PhoneIcon className="size-3.5 text-muted-foreground" />
                    {t("settings.clinic.phone")}
                  </FieldLabel>
                  <Input id="clinicPhone" {...register("phone")} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="clinicEmail" className="flex items-center gap-1.5">
                    <MailIcon className="size-3.5 text-muted-foreground" />
                    {t("settings.clinic.email")}
                  </FieldLabel>
                  <Input id="clinicEmail" type="email" {...register("email")} />
                </Field>
              </div>
            </FormSection>

            <Button type="submit" disabled={isUpdating || !isDirty} className="w-fit">
              {isUpdating && <Spinner className="size-4" />}
              {t("settings.clinic.save")}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
