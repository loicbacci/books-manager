"use client";

import { FiChevronDown, FiChevronRight } from "react-icons/fi";
import { Button, Heading, Text, type ButtonProps } from "@chakra-ui/react";

type GroupToggleProps = {
  label: string;
  collapsed: boolean;
  onToggle: () => void;
  size?: "sm" | "md";
  color?: string;
  buttonProps?: ButtonProps;
};

export function GroupToggle({
  label,
  collapsed,
  onToggle,
  size = "md",
  color = "fg.muted",
  buttonProps,
}: GroupToggleProps) {
  return (
    <Button
      variant="ghost"
      onClick={onToggle}
      justifyContent="space-between"
      width="full"
      height="auto"
      py={2}
      {...buttonProps}
    >
      <Heading size={size} color={color}>
        {label}
      </Heading>
      <Text>{collapsed ? <FiChevronRight /> : <FiChevronDown />}</Text>
    </Button>
  );
}


