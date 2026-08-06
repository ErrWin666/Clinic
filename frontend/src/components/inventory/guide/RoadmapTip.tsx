import { useTranslation } from "react-i18next";
import { InfoIcon, AlertTriangleIcon, LightbulbIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type RoadmapTipVariant = "info" | "warning" | "success";

interface RoadmapTipProps {
  variant?: RoadmapTipVariant;
  text: string;
  className?: string;
}

const VARIANT_CLASSES: Record<RoadmapTipVariant, string> = {
  info: "bg-primary/5 border-primary/20 text-primary",
  warning: "bg-amber-500/5 border-amber-500/20 text-amber-600 dark:text-amber-400",
  success: "bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
};

const VARIANT_ICONS: Record<RoadmapTipVariant, typeof InfoIcon> = {
  info: InfoIcon,
  warning: AlertTriangleIcon,
  success: LightbulbIcon,
};

export function RoadmapTip({ variant = "info", text, className }: RoadmapTipProps) {
  const { t } = useTranslation();
  const Icon = VARIANT_ICONS[variant];

  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm transition-all duration-300",
        VARIANT_CLASSES[variant],
        className
      )}
    >
      <Icon className="size-4 shrink-0 translate-y-0.5" />
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-semibold uppercase tracking-wide opacity-70">
          {t(`inventory.guide.tips.${variant}`)}
        </span>
        <span className="leading-relaxed">{text}</span>
      </div>
    </div>
  );
}
