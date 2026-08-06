import type { ComponentType } from "react";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { IconBadge, type IconBadgeVariant } from "@/components/common/IconBadge";
import { cn } from "@/lib/utils";

interface DialogHeaderWithIconProps {
  icon: ComponentType<{ className?: string }>;
  title: React.ReactNode;
  description?: string;
  variant?: IconBadgeVariant;
  /** Extra content to render inside the title row (e.g. badges) */
  titleExtra?: React.ReactNode;
  className?: string;
  /** Optional className for the wrapping DialogHeader */
  headerClassName?: string;
}

/**
 * Unified dialog header with an icon badge, title, and optional description.
 * Replaces the repeated pattern of DialogTitle + icon container across 17+ dialogs.
 */
export function DialogHeaderWithIcon({
  icon,
  title,
  description,
  variant = "primary",
  titleExtra,
  className,
  headerClassName,
}: DialogHeaderWithIconProps) {
  return (
    <DialogHeader className={headerClassName}>
      <DialogTitle className={cn("flex items-center gap-2.5 pr-8", className)}>
        <IconBadge icon={icon} variant={variant} size="md" />
        {title}
        {titleExtra}
      </DialogTitle>
      {description && <DialogDescription>{description}</DialogDescription>}
    </DialogHeader>
  );
}
