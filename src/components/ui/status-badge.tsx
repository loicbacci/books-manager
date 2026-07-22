"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

export type ReadingStatus = "TO_READ" | "READING" | "READ" | "DROPPED";

export interface StatusBadgeProps {
  status: ReadingStatus | string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const statusClassNames: Record<ReadingStatus, string> = {
  TO_READ: "bg-muted text-muted-foreground",
  READING: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  READ: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300",
  DROPPED: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
};

const statusLabelKeys: Record<ReadingStatus, string> = {
  TO_READ: "toRead",
  READING: "reading",
  READ: "read",
  DROPPED: "dropped",
};

const sizeClassNames = {
  sm: "px-1.5 py-0.5 text-xs",
  md: "px-2 py-0.5 text-xs",
  lg: "px-2.5 py-1 text-sm",
};

export function StatusBadge({ status, size = "md", className }: StatusBadgeProps) {
  const tStatus = useTranslations("status");
  const normalized = (status in statusClassNames ? status : "TO_READ") as ReadingStatus;

  return (
    <span
      data-testid={`status-badge-${status.toString().toLowerCase()}`}
      className={cn(
        "inline-flex w-fit shrink-0 items-center justify-center rounded-2xl font-medium whitespace-nowrap",
        statusClassNames[normalized],
        sizeClassNames[size],
        className
      )}
    >
      {tStatus(statusLabelKeys[normalized])}
    </span>
  );
}
