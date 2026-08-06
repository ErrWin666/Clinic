import { useTranslation } from "react-i18next";
import { CheckCircle2Icon, RotateCcwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RoadmapProgressProps {
  completed: number;
  total: number;
  onReset: () => void;
  className?: string;
}

export function RoadmapProgress({ completed, total, onReset, className }: RoadmapProgressProps) {
  const { t } = useTranslation();
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const allDone = completed === total;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {allDone ? (
            <CheckCircle2Icon className="size-5 text-emerald-500" />
          ) : null}
          <span className="text-sm font-medium text-foreground">
            {allDone
              ? t("inventory.guide.allDone")
              : t("inventory.guide.progress", { completed, total })}
          </span>
        </div>
        {completed > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => {
              if (window.confirm(t("inventory.guide.resetConfirm"))) {
                onReset();
              }
            }}
          >
            <RotateCcwIcon className="size-3.5" />
            {t("inventory.guide.reset")}
          </Button>
        )}
      </div>

      {/* Progress bar */}
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "absolute inset-y-0 start-0 rounded-full transition-all duration-700 ease-out",
            allDone
              ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
              : "bg-gradient-to-r from-primary to-primary/70"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {allDone && (
        <p className="text-xs text-muted-foreground">
          {t("inventory.guide.allDoneDescription")}
        </p>
      )}
    </div>
  );
}
