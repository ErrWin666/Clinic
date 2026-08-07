import { useCallback } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import type { AxiosError } from "axios";
import type { ApiResponse } from "@/types/api";
import { getErrorI18nKey } from "@/lib/errorCodes";

export function useApiError() {
  const { t } = useTranslation();

  const handleApiError = useCallback(
    (error: unknown) => {
      const axiosError = error as AxiosError<ApiResponse<unknown>>;
      const code = axiosError?.response?.data?.error?.code;
      const backendMessage = axiosError?.response?.data?.error?.message;
      const i18nKey = getErrorI18nKey(code);
      const translated = t(i18nKey);
      if (code === "VALIDATION_ERROR" && backendMessage && backendMessage !== translated) {
        toast.error(backendMessage);
      } else {
        toast.error(translated);
      }
    },
    [t]
  );

  return { handleApiError };
}
