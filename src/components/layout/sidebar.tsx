"use client";

import { usePathname } from "@/i18n/routing";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Box, Flex, Stack, Text, IconButton, Button, HStack, Icon } from "@chakra-ui/react";
import {
  FiMenu,
  FiGrid,
  FiBookOpen,
  FiUsers,
  FiLayers,
  FiBarChart2,
  FiSettings,
  FiLogOut,
} from "react-icons/fi";
import { signOut } from "next-auth/react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ColorModeButton } from "@/components/ui/color-mode";
import { Drawer, Portal, CloseButton } from "@chakra-ui/react";

type NavItem = {
  href: string;
  labelKey:
    | "dashboard"
    | "library"
    | "authors"
    | "series"
    | "statistics"
    | "settings";
  icon: "FiGrid" | "FiBookOpen" | "FiUsers" | "FiLayers" | "FiBarChart2" | "FiSettings";
};

/**
 * Primary navigation entries for authenticated users.
 */
const navItems: NavItem[] = [
  { href: "/dashboard", labelKey: "dashboard", icon: "FiGrid" },
  { href: "/library", labelKey: "library", icon: "FiBookOpen" },
  { href: "/authors", labelKey: "authors", icon: "FiUsers" },
  { href: "/series", labelKey: "series", icon: "FiLayers" },
  { href: "/statistics", labelKey: "statistics", icon: "FiBarChart2" },
  { href: "/settings", labelKey: "settings", icon: "FiSettings" },
];

/**
 * Desktop sidebar navigation for authenticated routes.
 */
export function Sidebar() {
  const t = useTranslations("nav");
  const tAuth = useTranslations("auth");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const pathname = usePathname();

  // Active if the current path matches or is a child route.
  const isActive = (href: string) => {
    const pathWithoutLocale = pathname.replace(/^\/(en|fr)/, "");
    return (
      pathWithoutLocale === href || pathWithoutLocale.startsWith(`${href}/`)
    );
  };

  return (
    <Box
      as="aside"
      position="fixed"
      left={0}
      top={0}
      bottom={0}
      width="240px"
      bg="bg.panel"
      borderRightWidth="1px"
      py={6}
      display={{ base: "none", md: "block" }}
    >
      <Flex direction="column" height="100%">
        <Box px={6} mb={8}>
          <HStack gap={2}>
            <Icon as={FiBookOpen} color="brand.fg" />
            <Text fontSize="xl" fontWeight="bold" color="brand.fg">
              {tCommon("appName")}
            </Text>
          </HStack>
        </Box>

        <Stack gap={1} px={3} flex={1}>
          {navItems.map((item) => (
            <Button
              key={item.href}
              asChild
              variant={isActive(item.href) ? "subtle" : "ghost"}
              colorPalette={isActive(item.href) ? "brand" : undefined}
              justifyContent="flex-start"
              size="lg"
              px={4}
            >
              <Link href={item.href}>
                <Icon
                  as={
                    item.icon === "FiGrid"
                      ? FiGrid
                      : item.icon === "FiBookOpen"
                        ? FiBookOpen
                        : item.icon === "FiUsers"
                          ? FiUsers
                          : item.icon === "FiLayers"
                            ? FiLayers
                            : item.icon === "FiBarChart2"
                              ? FiBarChart2
                              : FiSettings
                  }
                  mr={3}
                />
                {t(item.labelKey)}
              </Link>
            </Button>
          ))}
        </Stack>

        <Box px={3} pt={4} borderTopWidth="1px">
          <Box mb={3}>
            <LanguageSwitcher align="flex-start" labelAlign="left" size="sm" />
          </Box>
          <Button
            variant="ghost"
            width="full"
            justifyContent="flex-start"
            size="lg"
            px={4}
            // Sign out and return to the public login page.
            onClick={() => signOut({ callbackUrl: `/${locale}/login` })}
          >
            <Icon as={FiLogOut} mr={3} />
            {tAuth("logout")}
          </Button>
        </Box>
      </Flex>
    </Box>
  );
}

/**
 * Mobile top bar with a hamburger-triggered drawer.
 */
export function MobileNav() {
  const t = useTranslations("nav");
  const tAuth = useTranslations("auth");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Active if the current path matches or is a child route.
  const isActive = (href: string) => {
    const pathWithoutLocale = pathname.replace(/^\/(en|fr)/, "");
    return (
      pathWithoutLocale === href || pathWithoutLocale.startsWith(`${href}/`)
    );
  };

  return (
    <Box
      as="nav"
      position="sticky"
      top={0}
      left={0}
      right={0}
      bg="bg.panel"
      borderBottomWidth="1px"
      py={3}
      px={4}
      display={{ base: "block", md: "none" }}
      zIndex={50}
    >
      <Flex align="center" justify="space-between">
        <HStack gap={2}>
          <Icon as={FiBookOpen} color="brand.fg" />
          <Text fontSize="lg" fontWeight="bold" color="brand.fg">
            {tCommon("appName")}
          </Text>
        </HStack>
        <Drawer.Root
          placement="end"
          open={isOpen}
          onOpenChange={(details) => setIsOpen(details.open)}
        >
          <Drawer.Trigger asChild>
            <IconButton aria-label="Open menu" variant="ghost" size="lg">
              <FiMenu />
            </IconButton>
          </Drawer.Trigger>

          <Portal>
            <Drawer.Backdrop />
            <Drawer.Positioner>
            <Drawer.Content
              // width="80vw"
              // maxW="360px"
              height="100vh"
              // borderRadius={0}
              borderLeftWidth="1px"
              display="flex"
              flexDirection="column"
              bg="surface.base"
              bgGradient="linear(to-b, surface.raised, surface.base)"
              borderLeftColor="border.muted"
              boxShadow="elevated"
              >
                <Drawer.Header
                  bg="surface.raised"
                  borderBottomWidth="1px"
                  borderBottomColor="border.muted"
                >
                  <Drawer.Title>
                    <Text fontWeight="semibold" color="brand.fg">
                      {tCommon("appName")}
                    </Text>
                  </Drawer.Title>
                </Drawer.Header>

                <Drawer.Body px={4} pb={4} pt={3} flex="1" overflowY="auto">
                  <Box display="flex" flexDirection="column" minH="100%">
                    <Stack gap={2}>
                      {navItems.map((item) => (
                        <Button
                          asChild
                          variant={isActive(item.href) ? "subtle" : "ghost"}
                          colorPalette={
                            isActive(item.href) ? "brand" : undefined
                          }
                          justifyContent="flex-start"
                          size="lg"
                          width="full"
                          px={4}
                          key={item.href}
                          onClick={() => setIsOpen(false)}
                        >
                          <Link href={item.href}>
                            <Icon
                              as={
                                item.icon === "FiGrid"
                                  ? FiGrid
                                  : item.icon === "FiBookOpen"
                                    ? FiBookOpen
                                    : item.icon === "FiUsers"
                                      ? FiUsers
                                      : item.icon === "FiLayers"
                                        ? FiLayers
                                        : item.icon === "FiBarChart2"
                                          ? FiBarChart2
                                          : FiSettings
                              }
                              mr={3}
                            />
                            {t(item.labelKey)}
                          </Link>
                        </Button>
                      ))}
                    </Stack>

                  <Box pt={4} mt="auto">
                    <Box
                      bg="surface.raised"
                      borderRadius="md"
                      borderWidth="1px"
                      borderColor="border.muted"
                      p={3}
                    >
                      <HStack justify="space-between" mb={3}>
                        <LanguageSwitcher
                          align="center"
                          direction="row"
                          showLabel={false}
                          size="sm"
                        />
                        <ColorModeButton />
                      </HStack>
                      <Button
                        variant="ghost"
                        width="full"
                        justifyContent="flex-start"
                        size="lg"
                        px={4}
                        onClick={() =>
                          signOut({ callbackUrl: `/${locale}/login` })
                        }
                      >
                        <Icon as={FiLogOut} mr={3} />
                        {tAuth("logout")}
                      </Button>
                    </Box>
                  </Box>
                  </Box>
                </Drawer.Body>

                <Drawer.CloseTrigger asChild>
                  <CloseButton size="sm" />
                </Drawer.CloseTrigger>
              </Drawer.Content>
            </Drawer.Positioner>
          </Portal>
        </Drawer.Root>
      </Flex>
    </Box>
  );
}


