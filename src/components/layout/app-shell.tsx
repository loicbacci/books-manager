"use client";

import { Box } from "@chakra-ui/react";
import { Sidebar, MobileNav } from "./sidebar";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <Box minH="100vh">
      <Sidebar />
      <MobileNav />
      <Box
        ml={{ base: 0, md: "240px" }}
        pb={{ base: 0, md: 0 }}
        minH="100vh"
      >
        {children}
      </Box>
    </Box>
  );
}
