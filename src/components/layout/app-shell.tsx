"use client";

import { useTranslations } from "next-intl";
import { Fragment } from "react";

import { AppSidebar } from "@/components/layout/sidebar";
import {
  PageHeaderProvider,
  usePageHeader,
} from "@/components/layout/page-header-context";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Link, usePathname } from "@/i18n/routing";

function usePageTitle() {
  const pathname = usePathname();
  const tNav = useTranslations("nav");
  const tBook = useTranslations("book");

  if (pathname.startsWith("/books")) return tBook("details");
  if (pathname.startsWith("/dashboard")) return tNav("dashboard");
  if (pathname.startsWith("/library")) return tNav("library");
  if (pathname.startsWith("/authors")) return tNav("authors");
  if (pathname.startsWith("/series")) return tNav("series");
  if (pathname.startsWith("/statistics")) return tNav("statistics");
  if (pathname.startsWith("/settings")) return tNav("settings");
  return tNav("dashboard");
}

function AppShellHeader() {
  const pageTitle = usePageTitle();
  const { breadcrumbs } = usePageHeader();

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator
        orientation="vertical"
        className="mr-2 data-[orientation=vertical]:h-4"
      />
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <Breadcrumb className="min-w-0 flex-1">
          <BreadcrumbList>
            {breadcrumbs.map((item, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return (
                <Fragment key={`${item.label}-${index}`}>
                  {index > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem className="min-w-0">
                    {isLast || !item.href ? (
                      <BreadcrumbPage className="truncate">
                        {item.label}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink
                        render={<Link href={item.href} />}
                        className="truncate"
                      >
                        {item.label}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      ) : (
        <span className="font-heading truncate text-sm font-semibold">
          {pageTitle}
        </span>
      )}
    </header>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <PageHeaderProvider>
        <AppSidebar />
        <SidebarInset>
          <AppShellHeader />
          <div className="flex-1">{children}</div>
        </SidebarInset>
      </PageHeaderProvider>
    </SidebarProvider>
  );
}
