"use client";

import { Box } from "@chakra-ui/react";
import { Sidebar, MobileNav } from "./sidebar";

type AppShellProps = {
  children: React.ReactNode;
};

/**
 * Layout wrapper for authenticated pages.
 *
 * Renders the desktop sidebar and the mobile top bar/drawer,
 * then offsets the main content to account for the sidebar width.
 */
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
