"use client";

import { Select as ChakraSelect, Portal } from "@chakra-ui/react";
import { forwardRef } from "react";

export const SelectRoot = ChakraSelect.Root;

export const SelectTrigger = forwardRef<
  HTMLButtonElement,
  ChakraSelect.TriggerProps
>(function SelectTrigger(props, ref) {
  const { bg = "bg.input", ...rest } = props;
  return (
    <ChakraSelect.Trigger ref={ref} bg={bg} {...rest}>
      {rest.children}
      <ChakraSelect.Indicator />
    </ChakraSelect.Trigger>
  );
});

export const SelectValueText = ChakraSelect.ValueText;

export const SelectContent = forwardRef<
  HTMLDivElement,
  ChakraSelect.ContentProps
>(function SelectContent(props, ref) {
  return (
    <Portal>
      <ChakraSelect.Positioner>
        <ChakraSelect.Content ref={ref} {...props} />
      </ChakraSelect.Positioner>
    </Portal>
  );
});

export const SelectItem = forwardRef<HTMLDivElement, ChakraSelect.ItemProps>(
  function SelectItem(props, ref) {
    return (
      <ChakraSelect.Item ref={ref} {...props}>
        {props.children}
        <ChakraSelect.ItemIndicator />
      </ChakraSelect.Item>
    );
  }
);


