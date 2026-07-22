"use client";

import { RiStarFill, RiStarHalfFill, RiStarLine } from "@remixicon/react";
import { STAR_COUNT, fullStarToStored, halfStarToStored, starFill } from "@/lib/rating";
import { cn } from "@/lib/utils";

type StarRatingProps = {
  value: number | null | undefined;
  onChange?: (value: number | null) => void;
  size?: number;
  className?: string;
  readOnly?: boolean;
  /** Allow clearing by clicking the same full value again when interactive. */
  clearable?: boolean;
};

export function StarRating({
  value,
  onChange,
  size = 18,
  className,
  readOnly,
  clearable = true,
}: StarRatingProps) {
  const rating = value ?? 0;
  const interactive = Boolean(onChange) && !readOnly;

  return (
    <div
      className={cn("inline-flex items-center gap-0.5", className)}
      role={interactive ? "slider" : "img"}
      aria-label={rating ? `Rating ${rating} out of 10` : "No rating"}
      aria-valuemin={interactive ? 1 : undefined}
      aria-valuemax={interactive ? 10 : undefined}
      aria-valuenow={interactive ? rating || undefined : undefined}
    >
      {Array.from({ length: STAR_COUNT }).map((_, i) => {
        const fill = starFill(rating, i);
        const Icon =
          fill === "full"
            ? RiStarFill
            : fill === "half"
              ? RiStarHalfFill
              : RiStarLine;

        if (!interactive) {
          return (
            <Icon
              key={i}
              size={size}
              className={cn(
                fill === "empty" ? "text-muted-foreground/40" : "text-amber-500"
              )}
            />
          );
        }

        return (
          <span key={i} className="relative inline-flex">
            <button
              type="button"
              className="absolute inset-y-0 left-0 z-10 w-1/2 cursor-pointer"
              aria-label={`Rate ${halfStarToStored(i + 1)} out of 10`}
              onClick={() => {
                const next = halfStarToStored(i + 1);
                if (clearable && value === next) {
                  onChange?.(null);
                } else {
                  onChange?.(next);
                }
              }}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 z-10 w-1/2 cursor-pointer"
              aria-label={`Rate ${fullStarToStored(i + 1)} out of 10`}
              onClick={() => {
                const next = fullStarToStored(i + 1);
                if (clearable && value === next) {
                  onChange?.(null);
                } else {
                  onChange?.(next);
                }
              }}
            />
            <Icon
              size={size}
              className={cn(
                "pointer-events-none",
                fill === "empty" ? "text-muted-foreground/40" : "text-amber-500"
              )}
            />
          </span>
        );
      })}
    </div>
  );
}
