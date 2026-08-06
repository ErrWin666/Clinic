import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { InboxIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center gap-5 py-16 animate-in fade-in zoom-in-95 slide-in-from-bottom-3 duration-500">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-muted to-muted/50 text-muted-foreground shadow-soft ring-1 ring-border/40 animate-float">
        {icon || <InboxIcon className="size-8" />}
      </div>
      <div className="flex flex-col items-center gap-2">
        <p className="text-lg font-heading font-semibold text-foreground">{t(title)}</p>
        {description && (
          <p className="text-sm text-muted-foreground text-center max-w-sm leading-relaxed">
            {t(description)}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
