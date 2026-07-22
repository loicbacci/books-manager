"use client";

import { cn } from "@/lib/utils";

export interface ProgressBarProps {
  value?: number;
  current?: number;
  total?: number | null;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const heightClassNames = {
  sm: "h-2",
  md: "h-3",
  lg: "h-4",
};

export function ProgressBar({
  value,
  current,
  total,
  showLabel = false,
  size = "md",
  className,
}: ProgressBarProps) {
  const percentage =
    value ??
    (total && total > 0 ? Math.round(((current ?? 0) / total) * 100) : 0);
  const clampedPercentage = Math.min(100, Math.max(0, percentage));

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "overflow-hidden rounded-full bg-muted",
          heightClassNames[size]
        )}
        role="progressbar"
        aria-valuenow={clampedPercentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Reading progress: ${clampedPercentage}%`}
      >
        <div
          data-testid="progress-fill"
          className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
          style={{ width: `${clampedPercentage}%` }}
        />
      </div>
      {showLabel && (
        <div className="mt-1 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {current} / {total ?? "?"} pages
          </span>
          <span className="text-sm font-medium text-primary">
            {clampedPercentage}%
          </span>
        </div>
      )}
    </div>
  );
}
