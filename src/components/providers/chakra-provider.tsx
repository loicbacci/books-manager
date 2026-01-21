"use client";

import { ChakraProvider as BaseChakraProvider } from "@chakra-ui/react";
import { system } from "@/lib/theme";

export function ChakraProvider({ children }: { children: React.ReactNode }) {
  return <BaseChakraProvider value={system}>{children}</BaseChakraProvider>;
}
