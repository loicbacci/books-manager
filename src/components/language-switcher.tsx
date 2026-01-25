"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  createListCollection,
  Stack,
  Text,
  type StackProps,
  type TextProps,
} from "@chakra-ui/react";
import {
  SelectRoot,
  SelectTrigger,
  SelectValueText,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

type LanguageSwitcherProps = {
  align?: StackProps["align"];
  labelAlign?: TextProps["textAlign"];
  size?: "xs" | "sm" | "md" | "lg";
};

export function LanguageSwitcher({
  align = "center",
  labelAlign,
  size = "sm",
}: LanguageSwitcherProps) {
  const tSettings = useTranslations("settings");
  const pathname = usePathname();
  const router = useRouter();

  // Extract the locale segment so we can keep users on the same route.
  const localeMatch = pathname?.match(/^\/(en|fr)(?=\/|$)/);
  const currentLocale = localeMatch?.[1] ?? "en";
  const pathWithoutLocale = localeMatch
    ? pathname?.replace(/^\/(en|fr)(?=\/|$)/, "") ?? ""
    : pathname ?? "";

  const localeCollection = createListCollection({
    items: [
      { value: "en", label: "🇬🇧 English" },
      { value: "fr", label: "🇫🇷 Français" },
    ],
  });

  return (
    <Stack gap={2} align={align}>
      <Text fontSize="sm" color="text.secondary" textAlign={labelAlign}>
        {tSettings("language")}
      </Text>
      <SelectRoot
        size={size}
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
  );
}
