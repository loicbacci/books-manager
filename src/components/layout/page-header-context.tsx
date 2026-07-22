"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type PageBreadcrumbItem = {
  label: string;
  href?: string;
};

type PageHeaderContextValue = {
  breadcrumbs: PageBreadcrumbItem[] | null;
  setBreadcrumbs: (items: PageBreadcrumbItem[] | null) => void;
};

const PageHeaderContext = createContext<PageHeaderContextValue | null>(null);

export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [breadcrumbs, setBreadcrumbs] = useState<PageBreadcrumbItem[] | null>(
    null
  );

  const value = useMemo(
    () => ({ breadcrumbs, setBreadcrumbs }),
    [breadcrumbs]
  );

  return (
    <PageHeaderContext.Provider value={value}>
      {children}
    </PageHeaderContext.Provider>
  );
}

export function usePageHeader() {
  const context = useContext(PageHeaderContext);
  if (!context) {
    throw new Error("usePageHeader must be used within PageHeaderProvider");
  }
  return context;
}

/** Sets header breadcrumbs for detail pages; clears on unmount. */
export function useSetPageBreadcrumbs(items: PageBreadcrumbItem[] | null) {
  const { setBreadcrumbs } = usePageHeader();

  useEffect(() => {
    setBreadcrumbs(items);
    return () => setBreadcrumbs(null);
  }, [items, setBreadcrumbs]);
}
