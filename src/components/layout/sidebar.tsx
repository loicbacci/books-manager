"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import NextLink from "next/link";
import {
  Box,
  Flex,
  Stack,
  Text,
  IconButton,
  Button,
  createListCollection,
} from "@chakra-ui/react";
import { FiMenu } from "react-icons/fi";
import { signOut } from "next-auth/react";
import {
  SelectRoot,
  SelectTrigger,
  SelectValueText,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
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
  icon: string;
};

/**
 * Primary navigation entries for authenticated users.
 */
const navItems: NavItem[] = [
  { href: "/dashboard", labelKey: "dashboard", icon: "📊" },
  { href: "/library", labelKey: "library", icon: "📚" },
  { href: "/authors", labelKey: "authors", icon: "🖋️" },
  { href: "/series", labelKey: "series", icon: "📖" },
  { href: "/statistics", labelKey: "statistics", icon: "📈" },
  { href: "/settings", labelKey: "settings", icon: "⚙️" },
];

/**
 * Desktop sidebar navigation for authenticated routes.
 */
export function Sidebar() {
  const t = useTranslations("nav");
  const tAuth = useTranslations("auth");
  const tSettings = useTranslations("settings");
  const pathname = usePathname();
  const router = useRouter();

  // Extract the locale segment so we can switch languages without losing path.
  const localeMatch = pathname.match(/^\/(en|fr)(?=\/|$)/);
  const currentLocale = localeMatch?.[1] ?? "en";
  const pathWithoutLocale = localeMatch
    ? pathname.replace(/^\/(en|fr)(?=\/|$)/, "")
    : pathname;

  const localeCollection = createListCollection({
    items: [
      { value: "en", label: "English" },
      { value: "fr", label: "Français" },
    ],
  });

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
          <Text fontSize="xl" fontWeight="bold" color="brand.fg">
            📖 Books Manager
          </Text>
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
              <NextLink href={item.href}>
                <Text as="span" mr={3}>
                  {item.icon}
                </Text>
                {t(item.labelKey)}
              </NextLink>
            </Button>
          ))}
        </Stack>

        <Box px={3} pt={4} borderTopWidth="1px">
          <Stack gap={3} mb={3}>
            <Text fontSize="xs" color="fg.muted" px={2}>
              {tSettings("language")}
            </Text>
            <SelectRoot
              collection={localeCollection}
              value={[currentLocale]}
              onValueChange={(e) => {
                const nextLocale = e.value[0] || "en";
                const nextPath = `/${nextLocale}${pathWithoutLocale || ""}`;
                router.push(nextPath);
              }}
            >
              <SelectTrigger>
                <SelectValueText placeholder={tSettings("language")} />
              </SelectTrigger>
              <SelectContent>
                {localeCollection.items.map((item) => (
                  <SelectItem key={item.value} item={item}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </SelectRoot>
          </Stack>
          <Button
            variant="ghost"
            width="full"
            justifyContent="flex-start"
            size="lg"
            px={4}
            // Sign out and return to the public login page.
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <Text as="span" mr={3}>
              🚪
            </Text>
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
  const tSettings = useTranslations("settings");
  const pathname = usePathname();
  const router = useRouter();

  // Extract the locale segment so we can keep users on the same route.
  const localeMatch = pathname.match(/^\/(en|fr)(?=\/|$)/);
  const currentLocale = localeMatch?.[1] ?? "en";
  const pathWithoutLocale = localeMatch
    ? pathname.replace(/^\/(en|fr)(?=\/|$)/, "")
    : pathname;

  const localeCollection = createListCollection({
    items: [
      { value: "en", label: "English" },
      { value: "fr", label: "Français" },
    ],
  });

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
        <Text fontSize="lg" fontWeight="bold" color="brand.fg">
          📖 {tCommon("appName")}
        </Text>
        <Drawer.Root placement="end">
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
              // borderLeftWidth="1px"
              display="flex"
              flexDirection="column"
              bg="bg.panel"
              >
                <Drawer.Header>
                  <Drawer.Title>
                    <Text fontWeight="semibold">{tCommon("appName")}</Text>
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
                        >
                          <NextLink href={item.href}>
                            <Text as="span" mr={3}>
                              {item.icon}
                            </Text>
                            {t(item.labelKey)}
                          </NextLink>
                        </Button>
                      ))}
                    </Stack>

                  <Box pt={4} mt="auto" borderTopWidth="1px">
                    <Stack gap={3} mb={3}>
                      <Text fontSize="xs" color="fg.muted" px={1}>
                        {tSettings("language")}
                      </Text>
                      <SelectRoot
                        collection={localeCollection}
                        value={[currentLocale]}
                          onValueChange={(e) => {
                            const nextLocale = e.value[0] || "en";
                            const nextPath = `/${nextLocale}${pathWithoutLocale || ""}`;
                            router.push(nextPath);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValueText
                              placeholder={tSettings("language")}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {localeCollection.items.map((item) => (
                              <SelectItem key={item.value} item={item}>
                                {item.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </SelectRoot>
                      </Stack>
                      <Button
                        variant="ghost"
                        width="full"
                        justifyContent="flex-start"
                        size="lg"
                        px={4}
                        onClick={() => signOut({ callbackUrl: "/login" })}
                      >
                        <Text as="span" mr={3}>
                          🚪
                        </Text>
                        {tAuth("logout")}
                      </Button>
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
