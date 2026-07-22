"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type LocaleValue = "en" | "fr";

const LOCALE_ITEMS: { value: LocaleValue; label: string }[] = [
  { value: "en", label: "EN" },
  { value: "fr", label: "FR" },
];

type LanguageSwitcherProps = {
  className?: string;
  showLabel?: boolean;
};

export function LanguageSwitcher({
  className,
  showLabel = false,
}: LanguageSwitcherProps) {
  const tSettings = useTranslations("settings");
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Extract the locale segment so we can keep users on the same route.
  const localeMatch = pathname?.match(/^\/(en|fr)(?=\/|$)/);
  const currentLocale: LocaleValue = (localeMatch?.[1] as LocaleValue) ?? "en";
  const pathWithoutLocale = localeMatch
    ? (pathname?.replace(/^\/(en|fr)(?=\/|$)/, "") ?? "")
    : (pathname ?? "");

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {showLabel && (
        <span className="text-sm text-muted-foreground">
          {tSettings("language")}
        </span>
      )}
      <Select
        items={LOCALE_ITEMS}
        value={currentLocale}
        onValueChange={(value) => {
          const nextLocale = value ?? "en";
          const qs = searchParams.toString();
          const path = `/${nextLocale}${pathWithoutLocale || ""}`;
          router.push(qs ? `${path}?${qs}` : path);
        }}
      >
        <SelectTrigger size="sm" aria-label={tSettings("language")}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          {LOCALE_ITEMS.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
