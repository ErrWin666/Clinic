import { memo } from "react";
import type { ReactNode } from "react";
import { TrendingUpIcon, TrendingDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

type StatCardColor = "primary" | "blue" | "yellow" | "green" | "red" | "purple";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  color?: StatCardColor;
  subtitle?: string;
  trend?: string;
}

const colorClasses: Record<StatCardColor, string> = {
  primary: "bg-primary/10 text-primary",
  blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  yellow: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  green: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  red: "bg-red-500/10 text-red-600 dark:text-red-400",
  purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
};

const accentClasses: Record<StatCardColor, string> = {
  primary: "from-primary/60 to-primary/10",
  blue: "from-blue-500/60 to-blue-500/10",
  yellow: "from-amber-500/60 to-amber-500/10",
  green: "from-emerald-500/60 to-emerald-500/10",
  red: "from-red-500/60 to-red-500/10",
  purple: "from-purple-500/60 to-purple-500/10",
};

const blobClasses: Record<StatCardColor, string> = {
  primary: "bg-primary",
  blue: "bg-blue-500",
  yellow: "bg-amber-500",
  green: "bg-emerald-500",
  red: "bg-red-500",
  purple: "bg-purple-500",
};

export const StatCard = memo(function StatCard({
  title,
  value,
  icon,
  color = "primary",
  subtitle,
  trend,
}: StatCardProps) {
  return (
    <Card className="group relative overflow-hidden shadow-card ring-1 ring-foreground/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-hover hover:ring-primary/20">
      {/* Gradient blob in background */}
      <div
        className={cn(
          "absolute -right-8 -top-8 size-32 rounded-full opacity-10 blur-2xl transition-opacity duration-300 group-hover:opacity-20",
          blobClasses[color]
        )}
      />
      {/* Accent bar — thicker with gradient */}
      <div className={cn("absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r", accentClasses[color])} />
      <CardContent className="relative flex flex-col gap-3 p-5">
        <div className="flex items-center justify-between">
          <div
            className={cn(
              "flex size-11 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3",
              colorClasses[color]
            )}
          >
            {icon}
          </div>
          {trend && (
            <span
              className={cn(
                "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums",
                trend.startsWith("-")
                  ? "bg-destructive/10 text-destructive"
                  : "bg-success/10 text-success"
              )}
            >
              {trend.startsWith("-") ? (
                <TrendingDownIcon className="size-3" />
              ) : (
                <TrendingUpIcon className="size-3" />
              )}
              {trend}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-0.5">
          <p className="truncate text-sm font-medium text-muted-foreground">
            {title}
          </p>
          <p className="text-3xl font-heading font-bold tracking-tight text-foreground tabular-nums">
            {value}
          </p>
          {subtitle && (
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
});
