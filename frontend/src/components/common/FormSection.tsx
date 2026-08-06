import type { ComponentType } from "react";
import { cn } from "@/lib/utils";

interface FormSectionProps {
  icon?: ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  accentClass?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  contentClassName?: string;
}

export function FormSection({
  icon: Icon,
  title,
  description,
  accentClass = "bg-primary/10 text-primary",
  action,
  children,
  contentClassName = "flex flex-col gap-4 p-4",
}: FormSectionProps) {
  return (
    <div className="rounded-xl border border-border/40 bg-card overflow-hidden shadow-sm">
      <div className="flex items-center justify-between border-b border-border/40 bg-muted/30 px-4 py-3">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className={cn("flex size-8 items-center justify-center rounded-lg ring-1 ring-border/50", accentClass)}>
              <Icon className="size-4" />
            </div>
          )}
          <div className="flex flex-col">
            <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
            {description && (
              <span className="text-xs font-normal text-muted-foreground">{description}</span>
            )}
          </div>
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className={contentClassName}>{children}</div>
    </div>
  );
}
