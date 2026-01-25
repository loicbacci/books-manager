"use client";

import { Badge } from "@chakra-ui/react";

export type ReadingStatus = "TO_READ" | "READING" | "READ" | "DROPPED";

export interface StatusBadgeProps {
  status: ReadingStatus | string;
  size?: "sm" | "md" | "lg";
}

const statusConfig: Record<
  ReadingStatus,
  { label: string; colorPalette: string }
> = {
  TO_READ: { label: "To Read", colorPalette: "gray" },
  READING: { label: "Reading", colorPalette: "blue" },
  READ: { label: "Read", colorPalette: "green" },
  DROPPED: { label: "Dropped", colorPalette: "red" },
};

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const config = statusConfig[status as ReadingStatus] ?? statusConfig.TO_READ;

  const fontSizes = {
    sm: "xs",
    md: "sm",
    lg: "md",
  };

  const paddings = {
    sm: "1",
    md: "2",
    lg: "3",
  };

  return (
    <Badge
      colorPalette={config.colorPalette}
      fontSize={fontSizes[size]}
      px={paddings[size]}
      py={1}
      borderRadius="md"
      textTransform="capitalize"
      data-testid={`status-badge-${status.toLowerCase()}`}
    >
      {config.label}
    </Badge>
  );
}


