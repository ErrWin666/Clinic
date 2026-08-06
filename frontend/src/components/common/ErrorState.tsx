import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { AlertCircleIcon, RefreshCwIcon } from "lucide-react";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center gap-5 py-16 animate-in fade-in zoom-in-95 slide-in-from-bottom-3 duration-500">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-destructive/8 text-destructive shadow-soft ring-1 ring-destructive/15 animate-shake">
        <AlertCircleIcon className="size-7" />
      </div>
      <p className="text-sm text-muted-foreground text-center max-w-sm leading-relaxed">
        {message || t("common.somethingWentWrong")}
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-1">
          <RefreshCwIcon className="size-4" />
          {t("common.retry")}
        </Button>
      )}
    </div>
  );
}
