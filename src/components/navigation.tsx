"use client";

import { useTranslations } from "next-intl";
import { RiBook2Line } from "@remixicon/react";

import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Link } from "@/i18n/routing";

/**
 * Public navigation bar shown on unauthenticated pages.
 *
 * Authenticated views use the sidebar/mobile drawer instead.
 */
export function Navigation({ isAuthenticated }: { isAuthenticated: boolean }) {
  const tCommon = useTranslations("common");

  // Only show navigation for non-authenticated users.
  // Authenticated users use the sidebar instead.
  if (isAuthenticated) {
    return null;
  }

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <RiBook2Line className="size-5 text-primary" />
          <span className="font-heading text-lg font-semibold">
            {tCommon("appName")}
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
