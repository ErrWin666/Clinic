import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { config } from "@/lib/config";

import arCommon from "@/locales/ar/common.json";
import enCommon from "@/locales/en/common.json";

void i18n.use(initReactI18next).init({
  resources: {
    ar: { common: arCommon },
    en: { common: enCommon },
  },
  lng: config.defaultLanguage,
  fallbackLng: "en",
  defaultNS: "common",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;

/** Human-readable labels for supported languages, keyed by language code. */
export const LANGUAGE_LABELS: Record<string, string> = {
  ar: "العربية",
  en: "English",
};

/** Get the display label for a language code, falling back to the code itself. */
export function getLanguageLabel(code: string): string {
  return LANGUAGE_LABELS[code] ?? code;
}
