"use client";

import { Box, Container, HStack, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";

/**
 * Public navigation bar shown on unauthenticated pages.
 *
 * Authenticated views use the sidebar/mobile drawer instead.
 */
export function Navigation({ isAuthenticated }: { isAuthenticated: boolean }) {
  const tCommon = useTranslations("common");
  // Only show navigation for non-authenticated users
  // Authenticated users use the Sidebar/MobileNav instead
  if (isAuthenticated) {
    return null;
  }

  return (
    <Box
      bg="bg.panel"
      borderBottom="1px"
      borderColor="border.default"
      py={4}
    >
      <Container maxW="container.xl">
        <HStack justify="space-between">
          <Text fontSize="xl" fontWeight="bold" color="brand.fg">
            {tCommon("appName")}
          </Text>
        </HStack>
      </Container>
    </Box>
  );
}


