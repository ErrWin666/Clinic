import type { ComponentType } from "react";
import { cn } from "@/lib/utils";

export type IconBadgeVariant = "primary" | "destructive" | "warning" | "success";
export type IconBadgeSize = "sm" | "md" | "lg";

interface IconBadgeProps {
  icon: ComponentType<{ className?: string }>;
  variant?: IconBadgeVariant;
  size?: IconBadgeSize;
  className?: string;
}

const VARIANT_CLASSES: Record<IconBadgeVariant, string> = {
  primary: "bg-primary/10 text-primary ring-1 ring-primary/15 shadow-soft",
  destructive: "bg-destructive/10 text-destructive ring-1 ring-destructive/15 shadow-soft",
  warning:
    "bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/15 shadow-soft",
  success:
    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/15 shadow-soft",
};

const SIZE_CLASSES: Record<IconBadgeSize, string> = {
  sm: "size-8 rounded-lg",
  md: "size-9 rounded-xl",
  lg: "size-10 rounded-xl",
};

const ICON_SIZE_CLASSES: Record<IconBadgeSize, string> = {
  sm: "size-4",
  md: "size-5",
  lg: "size-5",
};

export function IconBadge({
  icon: Icon,
  variant = "primary",
  size = "md",
  className,
}: IconBadgeProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center transition-transform duration-300",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className
      )}
    >
      <Icon className={ICON_SIZE_CLASSES[size]} />
    </div>
  );
}
