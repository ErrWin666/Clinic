import { useTranslation } from "react-i18next";
import { CheckIcon, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface RoadmapStepperProps {
  total: number;
  completedSteps: number[];
  currentStep: number;
  icons: LucideIcon[];
  onStepClick?: (step: number) => void;
  className?: string;
}

export function RoadmapStepper({
  total,
  completedSteps,
  currentStep,
  icons,
  onStepClick,
  className,
}: RoadmapStepperProps) {
  const { t } = useTranslation();

  return (
    <div className={cn("flex items-center gap-1 overflow-x-auto pb-1", className)}>
      {Array.from({ length: total }).map((_, idx) => {
        const stepNumber = idx + 1;
        const isCompleted = completedSteps.includes(stepNumber);
        const isCurrent = stepNumber === currentStep;
        const Icon = icons[idx];

        return (
          <div key={stepNumber} className="flex items-center gap-1 shrink-0">
            {/* Step circle */}
            <button
              type="button"
              onClick={() => onStepClick?.(stepNumber)}
              className={cn(
                "flex size-9 items-center justify-center rounded-full border-2 transition-all duration-300",
                isCompleted &&
                  "border-emerald-500 bg-emerald-500/10 text-emerald-600 shadow-soft",
                isCurrent &&
                  !isCompleted &&
                  "border-primary bg-primary/10 text-primary shadow-soft scale-110",
                !isCompleted &&
                  !isCurrent &&
                  "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-primary"
              )}
              aria-label={`${t("inventory.guide.step")} ${stepNumber}`}
            >
              {isCompleted ? (
                <CheckIcon className="size-4" />
              ) : (
                <Icon className="size-4" />
              )}
            </button>

            {/* Connector line */}
            {idx < total - 1 && (
              <div
                className={cn(
                  "h-0.5 w-6 rounded-full transition-all duration-500 sm:w-10",
                  isCompleted ? "bg-emerald-500/40" : "bg-border"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
