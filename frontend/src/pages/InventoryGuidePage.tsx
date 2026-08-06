import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import {
  Package,
  Truck,
  Boxes,
  ShoppingCart,
  PackageCheck,
  Receipt,
  TrendingDown,
  ClipboardCheck,
  BookOpenIcon,
  ArrowRightIcon,
  SparklesIcon,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RoadmapStepper } from "@/components/inventory/guide/RoadmapStepper";
import { RoadmapProgress } from "@/components/inventory/guide/RoadmapProgress";
import { RoadmapStepCard, type RoadmapStep } from "@/components/inventory/guide/RoadmapStepCard";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "inventory_guide_progress";

const STEPS: RoadmapStep[] = [
  { number: 1, icon: Package, route: "/inventory", routeLabel: "products" },
  { number: 2, icon: Truck, route: "/suppliers", routeLabel: "suppliers" },
  { number: 3, icon: Boxes, route: "/inventory", routeLabel: "movements" },
  { number: 4, icon: ShoppingCart, route: "/purchase-orders", routeLabel: "purchaseOrders" },
  { number: 5, icon: PackageCheck, route: "/purchase-orders", routeLabel: "purchaseOrders" },
  { number: 6, icon: Receipt, route: "/invoices", routeLabel: "invoices" },
  { number: 7, icon: TrendingDown, route: "/inventory", routeLabel: "movements" },
  { number: 8, icon: ClipboardCheck, route: "/inventory", routeLabel: "stocktaking" },
];

interface GuideProgress {
  completedSteps: number[];
  lastVisited: string;
}

function loadProgress(): GuideProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as GuideProgress;
      if (Array.isArray(parsed.completedSteps)) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return { completedSteps: [], lastVisited: new Date().toISOString() };
}

function saveProgress(progress: GuideProgress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // ignore
  }
}

export function InventoryGuidePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRtl = i18n.language === "ar";

  const [progress, setProgress] = useState<GuideProgress>(() => loadProgress());
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  // Determine the first incomplete step on mount
  useEffect(() => {
    const firstIncomplete = STEPS.find((s) => !progress.completedSteps.includes(s.number));
    setExpandedStep(firstIncomplete?.number ?? STEPS[0].number);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const completedCount = progress.completedSteps.length;
  const totalCount = STEPS.length;
  const allDone = completedCount === totalCount;

  const currentStep = useMemo(() => {
    const firstIncomplete = STEPS.find((s) => !progress.completedSteps.includes(s.number));
    return firstIncomplete?.number ?? totalCount;
  }, [progress.completedSteps, totalCount]);

  const toggleComplete = useCallback((stepNumber: number) => {
    setProgress((prev) => {
      const isCompleted = prev.completedSteps.includes(stepNumber);
      const completedSteps = isCompleted
        ? prev.completedSteps.filter((n) => n !== stepNumber)
        : [...prev.completedSteps, stepNumber].sort((a, b) => a - b);
      const next = { completedSteps, lastVisited: new Date().toISOString() };
      saveProgress(next);
      return next;
    });
  }, []);

  const resetProgress = useCallback(() => {
    const next = { completedSteps: [] as number[], lastVisited: new Date().toISOString() };
    saveProgress(next);
    setProgress(next);
    setExpandedStep(1);
  }, []);

  const handleStepClick = useCallback((step: number) => {
    setExpandedStep(step);
  }, []);

  const stepIcons = STEPS.map((s) => s.icon);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        icon={BookOpenIcon}
        title={t("inventory.guide.title")}
        description={t("inventory.guide.description")}
        actions={
          <Button size="sm" className="gap-1.5" onClick={() => navigate("/inventory")}>
            {t("inventory.guide.startNow")}
            <ArrowRightIcon className={cn("size-4", isRtl && "rotate-180")} />
          </Button>
        }
      />

      {/* Progress card */}
      <Card className="shadow-card border-border/60 transition-all duration-300 hover:shadow-hover">
        <CardContent className="p-5">
          <RoadmapProgress
            completed={completedCount}
            total={totalCount}
            onReset={resetProgress}
          />
        </CardContent>
      </Card>

      {/* Stepper (desktop) */}
      <Card className="shadow-card border-border/60 hidden overflow-hidden sm:block">
        <CardContent className="p-5">
          <RoadmapStepper
            total={totalCount}
            completedSteps={progress.completedSteps}
            currentStep={currentStep}
            icons={stepIcons}
            onStepClick={handleStepClick}
          />
        </CardContent>
      </Card>

      {/* All done banner */}
      {allDone && (
        <Card className="shadow-card border-emerald-500/30 bg-emerald-500/5 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/15">
              <SparklesIcon className="size-5" />
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-semibold text-foreground">
                {t("inventory.guide.allDone")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("inventory.guide.allDoneDescription")}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step cards */}
      <div className="flex flex-col gap-3">
        {STEPS.map((step) => (
          <RoadmapStepCard
            key={step.number}
            step={step}
            isCompleted={progress.completedSteps.includes(step.number)}
            isCurrent={step.number === currentStep}
            defaultExpanded={expandedStep === step.number}
            onToggleComplete={toggleComplete}
          />
        ))}
      </div>
    </div>
  );
}
