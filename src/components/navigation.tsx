"use client";

import { Box, Container, HStack, Button, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";

export function Navigation({ isAuthenticated }: { isAuthenticated: boolean }) {
  const tAuth = useTranslations("auth");
  const tCommon = useTranslations("common");
  const params = useParams();
  const locale = params.locale as string;

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
          <HStack gap={2}>
            <Button asChild variant="ghost" size="sm" color="fg.default">
              <Link href={`/${locale}/login`}>{tAuth("login")}</Link>
            </Button>
            <Button asChild colorPalette="brand" size="sm">
              <Link href={`/${locale}/register`}>{tAuth("register")}</Link>
            </Button>
          </HStack>
        </HStack>
      </Container>
    </Box>
  );
}
