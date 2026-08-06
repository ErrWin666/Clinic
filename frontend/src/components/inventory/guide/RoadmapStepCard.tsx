import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import {
  ChevronDownIcon,
  CheckIcon,
  ArrowRightIcon,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IconBadge, type IconBadgeVariant } from "@/components/common/IconBadge";
import { RoadmapTip } from "./RoadmapTip";
import { cn } from "@/lib/utils";

export interface RoadmapStep {
  number: number;
  icon: LucideIcon;
  route: string;
  routeLabel: string;
}

interface RoadmapStepCardProps {
  step: RoadmapStep;
  isCompleted: boolean;
  isCurrent: boolean;
  defaultExpanded?: boolean;
  onToggleComplete: (stepNumber: number) => void;
}

export function RoadmapStepCard({
  step,
  isCompleted,
  isCurrent,
  defaultExpanded = false,
  onToggleComplete,
}: RoadmapStepCardProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const isRtl = i18n.language === "ar";

  const variant: IconBadgeVariant = isCompleted ? "success" : isCurrent ? "primary" : "primary";
  const stepKey = step.number.toString();

  const statusBadge = isCompleted ? (
    <Badge variant="default" className="gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/15">
      <CheckIcon className="size-3" />
      {t("inventory.guide.completed")}
    </Badge>
  ) : isCurrent ? (
    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/15">
      {t("inventory.guide.current")}
    </Badge>
  ) : (
    <Badge variant="outline" className="text-muted-foreground">
      {t("inventory.guide.upcoming")}
    </Badge>
  );

  return (
    <Card
      className={cn(
        "shadow-card border-border/60 transition-all duration-300 overflow-hidden",
        isCompleted && "ring-1 ring-emerald-500/20",
        isCurrent && !isCompleted && "ring-1 ring-primary/20 shadow-hover",
        !isCompleted && !isCurrent && "hover:shadow-soft"
      )}
    >
      <CardHeader
        className="cursor-pointer select-none p-4"
        onClick={() => setExpanded((prev) => !prev)}
      >
        <div className="flex items-center gap-3">
          <IconBadge
            icon={isCompleted ? CheckIcon : step.icon}
            variant={variant}
            size="md"
            className={cn(isCompleted && "bg-emerald-500/10 text-emerald-600 ring-emerald-500/15")}
          />
          <div className="flex flex-1 flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground tabular-nums">
                {t("inventory.guide.step")} {step.number}
              </span>
              {statusBadge}
            </div>
            <h3 className="text-sm font-semibold text-foreground">
              {t(`inventory.guide.steps.${stepKey}.title`)}
            </h3>
          </div>
          <ChevronDownIcon
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform duration-300",
              expanded && "rotate-180"
            )}
          />
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="flex flex-col gap-4 px-4 pb-4 animate-in fade-in slide-in-from-top-1 duration-300">
          {/* Description */}
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t(`inventory.guide.steps.${stepKey}.description`)}
          </p>

          {/* Tip */}
          <RoadmapTip
            variant="success"
            text={t(`inventory.guide.steps.${stepKey}.tip`)}
          />

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button
              size="sm"
              variant="default"
              className="gap-1.5"
              onClick={() => navigate(step.route)}
            >
              {t("inventory.guide.goToPage")}
              <ArrowRightIcon className={cn("size-3.5", isRtl && "rotate-180")} />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className={cn(
                "gap-1.5",
                isCompleted && "border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/5"
              )}
              onClick={() => onToggleComplete(step.number)}
            >
              <CheckIcon className="size-3.5" />
              {isCompleted
                ? t("inventory.guide.completed")
                : t("inventory.guide.markComplete")}
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
