"use client";

import { signOut } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import {
  RiBarChartBoxLine,
  RiBook2Line,
  RiBookOpenLine,
  RiDashboardLine,
  RiLogoutBoxRLine,
  RiSettings3Line,
  RiStackLine,
  RiUserLine,
} from "@remixicon/react";

import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Link, usePathname } from "@/i18n/routing";

const navItems = [
  { href: "/dashboard", labelKey: "dashboard" as const, icon: RiDashboardLine },
  { href: "/library", labelKey: "library" as const, icon: RiBookOpenLine },
  { href: "/authors", labelKey: "authors" as const, icon: RiUserLine },
  { href: "/series", labelKey: "series" as const, icon: RiStackLine },
  {
    href: "/statistics",
    labelKey: "statistics" as const,
    icon: RiBarChartBoxLine,
  },
  { href: "/settings", labelKey: "settings" as const, icon: RiSettings3Line },
];

export function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const t = useTranslations("nav");
  const tAuth = useTranslations("auth");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip={tCommon("appName")}
              render={<Link href="/dashboard" />}
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <RiBook2Line className="size-4" />
              </div>
              <span className="font-heading font-semibold">
                {tCommon("appName")}
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={isActive(item.href)}
                    tooltip={t(item.labelKey)}
                    render={<Link href={item.href} />}
                  >
                    <item.icon />
                    <span>{t(item.labelKey)}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarSeparator />
        <div className="flex items-center gap-1 px-1 group-data-[collapsible=icon]:justify-center">
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <LanguageSwitcher />
          </div>
          <ThemeToggle />
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={tAuth("logout")}
              onClick={() => signOut({ callbackUrl: `/${locale}/login` })}
            >
              <RiLogoutBoxRLine />
              <span>{tAuth("logout")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
