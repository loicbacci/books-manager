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
import { signOut } from "next-auth/react";
import {
  SelectRoot,
  SelectTrigger,
  SelectValueText,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

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

const navItems: NavItem[] = [
  { href: "/dashboard", labelKey: "dashboard", icon: "📊" },
  { href: "/library", labelKey: "library", icon: "📚" },
  { href: "/authors", labelKey: "authors", icon: "🖋️" },
  { href: "/series", labelKey: "series", icon: "📖" },
  { href: "/statistics", labelKey: "statistics", icon: "📈" },
  { href: "/settings", labelKey: "settings", icon: "⚙️" },
];

export function Sidebar() {
  const t = useTranslations("nav");
  const tAuth = useTranslations("auth");
  const tSettings = useTranslations("settings");
  const pathname = usePathname();
  const router = useRouter();

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

export function MobileNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  const isActive = (href: string) => {
    const pathWithoutLocale = pathname.replace(/^\/(en|fr)/, "");
    return (
      pathWithoutLocale === href || pathWithoutLocale.startsWith(`${href}/`)
    );
  };

  return (
    <Box
      as="nav"
      position="fixed"
      bottom={0}
      left={0}
      right={0}
      bg="bg.panel"
      borderTopWidth="1px"
      py={2}
      px={4}
      display={{ base: "block", md: "none" }}
      zIndex={50}
    >
      <Flex justify="space-around">
        {navItems.map((item) => (
          <IconButton
            key={item.href}
            asChild
            variant={isActive(item.href) ? "subtle" : "ghost"}
            colorPalette={isActive(item.href) ? "brand" : undefined}
            aria-label={t(item.labelKey)}
            size="lg"
          >
            <NextLink href={item.href}>
              <Text fontSize="xl">{item.icon}</Text>
            </NextLink>
          </IconButton>
        ))}
      </Flex>
    </Box>
  );
}
