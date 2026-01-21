"use client";

import { Box, Text, HStack } from "@chakra-ui/react";

export interface ProgressBarProps {
  value?: number;
  current?: number;
  total?: number | null;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  colorScheme?: string;
}

export function ProgressBar({
  value,
  current,
  total,
  showLabel = false,
  size = "md",
  colorScheme = "blue",
}: ProgressBarProps) {
  const percentage =
    value ??
    (total && total > 0 ? Math.round(((current ?? 0) / total) * 100) : 0);
  const clampedPercentage = Math.min(100, Math.max(0, percentage));

  const heights = {
    sm: "8px",
    md: "12px",
    lg: "16px",
  };

  return (
    <Box width="100%">
      <Box
        height={heights[size]}
        bg="gray.200"
        borderRadius="full"
        overflow="hidden"
        role="progressbar"
        aria-valuenow={clampedPercentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Reading progress: ${clampedPercentage}%`}
      >
        <Box
          height="100%"
          width={`${clampedPercentage}%`}
          bg={`${colorScheme}.500`}
          borderRadius="full"
          transition="width 0.3s ease"
          data-testid="progress-fill"
        />
      </Box>
      {showLabel && (
        <HStack justify="space-between" mt={1}>
          <Text fontSize="sm" color="gray.600">
            {current} / {total ?? "?"} pages
          </Text>
          <Text fontSize="sm" fontWeight="medium" color={`${colorScheme}.600`}>
            {clampedPercentage}%
          </Text>
        </HStack>
      )}
    </Box>
  );
}
