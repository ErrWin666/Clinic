import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface LoadingStateProps {
  variant?: "full-page" | "card" | "inline";
  skeleton?: ReactNode;
  className?: string;
}

export function LoadingState({ variant = "card", skeleton, className }: LoadingStateProps) {
  if (skeleton) {
    return <div className={cn(className)}>{skeleton}</div>;
  }

  if (variant === "full-page") {
    return (
      <div className={cn("flex min-h-screen items-center justify-center", className)}>
        <div className="flex flex-col items-center gap-5">
          <Skeleton className="size-14 rounded-2xl" />
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-3.5 w-28" />
        </div>
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div className={cn("flex items-center justify-center gap-3 py-10", className)}>
        <Skeleton className="size-7 rounded-lg" />
        <Skeleton className="h-4 w-28" />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-5 p-6", className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="size-11 rounded-xl" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>
      <Skeleton className="h-px w-full" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
