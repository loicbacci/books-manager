"use client";

import { RiArrowDownSLine, RiArrowRightSLine } from "@remixicon/react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type GroupToggleProps = {
  label: string;
  collapsed: boolean;
  onToggle: () => void;
  size?: "sm" | "md";
  className?: string;
};

export function GroupToggle({
  label,
  collapsed,
  onToggle,
  size = "md",
  className,
}: GroupToggleProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onToggle}
      className={cn("h-auto w-full justify-between py-2", className)}
    >
      <span
        className={cn(
          "font-heading font-semibold text-foreground",
          size === "sm" ? "text-sm" : "text-base"
        )}
      >
        {label}
      </span>
      {collapsed ? (
        <RiArrowRightSLine className="text-muted-foreground" />
      ) : (
        <RiArrowDownSLine className="text-muted-foreground" />
      )}
    </Button>
  );
}
