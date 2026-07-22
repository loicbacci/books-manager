"use client";

import * as React from "react";
import { RiCloseLine } from "@remixicon/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type MultiSelectOption = {
  value: string;
  label: string;
  description?: string;
  badgeClassName?: string;
};

type MultiSelectProps = {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  emptyText?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  searchValue?: string;
  onSearchValueChange?: (value: string) => void;
};

/**
 * Multi-select combobox built from `Popover` + `Command`, with selected
 * items rendered as removable badges below the trigger.
 */
export function MultiSelect({
  options,
  value,
  onChange,
  placeholder,
  emptyText = "No results found.",
  disabled = false,
  className,
  triggerClassName,
  searchValue,
  onSearchValueChange,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const selected = options.filter((option) => value.includes(option.value));

  const toggleValue = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          disabled={disabled}
          render={
            <Button
              type="button"
              variant="outline"
              className={cn(
                "w-full justify-between font-normal",
                triggerClassName
              )}
            />
          }
        >
          <span
            className={cn(
              "truncate text-left",
              selected.length === 0 && "text-muted-foreground"
            )}
          >
            {selected.length > 0
              ? selected.map((option) => option.label).join(", ")
              : placeholder}
          </span>
        </PopoverTrigger>
        <PopoverContent className="w-(--anchor-width) min-w-56 p-0" align="start">
          <Command shouldFilter={onSearchValueChange === undefined}>
            <CommandInput
              placeholder={placeholder}
              value={searchValue}
              onValueChange={onSearchValueChange}
            />
            <CommandList>
              <CommandEmpty>{emptyText}</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    data-checked={value.includes(option.value)}
                    onSelect={() => toggleValue(option.value)}
                  >
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate">{option.label}</span>
                      {option.description && (
                        <span className="truncate text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      )}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((option) => (
            <Badge
              key={option.value}
              variant="secondary"
              className={cn("gap-1 pr-1", option.badgeClassName)}
            >
              {option.label}
              <button
                type="button"
                onClick={() => toggleValue(option.value)}
                className="ml-0.5 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                aria-label={`Remove ${option.label}`}
              >
                <RiCloseLine className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
