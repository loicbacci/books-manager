"use client";

import { Dialog as ChakraDialog, Portal, CloseButton } from "@chakra-ui/react";
import { forwardRef } from "react";

export const DialogRoot = ChakraDialog.Root;

export const DialogTrigger = ChakraDialog.Trigger;

export const DialogContent = forwardRef<
  HTMLDivElement,
  ChakraDialog.ContentProps
>(function DialogContent(props, ref) {
  return (
    <Portal>
      <ChakraDialog.Backdrop />
      <ChakraDialog.Positioner>
        <ChakraDialog.Content ref={ref} {...props} />
      </ChakraDialog.Positioner>
    </Portal>
  );
});

export const DialogHeader = ChakraDialog.Header;
export const DialogTitle = ChakraDialog.Title;
export const DialogBody = ChakraDialog.Body;
export const DialogFooter = ChakraDialog.Footer;

export const DialogCloseTrigger = forwardRef<
  HTMLButtonElement,
  ChakraDialog.CloseTriggerProps
>(function DialogCloseTrigger(props, ref) {
  return (
    <ChakraDialog.CloseTrigger asChild ref={ref} {...props}>
      <CloseButton size="sm" position="absolute" top={2} right={2} />
    </ChakraDialog.CloseTrigger>
  );
});


