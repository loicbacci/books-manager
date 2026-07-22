"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { RiArrowLeftSLine, RiArrowRightSLine } from "@remixicon/react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PaginationContextValue = {
  page: number;
  totalPages: number;
  count: number;
  pageSize: number;
  setPage: (page: number) => void;
};

const PaginationContext = React.createContext<PaginationContextValue | null>(
  null
);

function usePaginationContext() {
  const ctx = React.useContext(PaginationContext);
  if (!ctx) {
    throw new Error(
      "Pagination components must be used within a PaginationRoot"
    );
  }
  return ctx;
}

export type PaginationRootProps = {
  page: number;
  count: number;
  pageSize: number;
  onPageChange: (details: { page: number }) => void;
  className?: string;
  children: React.ReactNode;
};

export function PaginationRoot({
  page,
  count,
  pageSize,
  onPageChange,
  className,
  children,
}: PaginationRootProps) {
  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  const value = React.useMemo<PaginationContextValue>(
    () => ({
      page,
      totalPages,
      count,
      pageSize,
      setPage: (nextPage: number) => {
        const clamped = Math.min(Math.max(1, nextPage), totalPages);
        if (clamped !== page) {
          onPageChange({ page: clamped });
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      },
    }),
    [page, totalPages, count, pageSize, onPageChange]
  );

  const tCommon = useTranslations("common");

  return (
    <PaginationContext.Provider value={value}>
      <nav
        aria-label={tCommon("pagination")}
        className={cn("flex items-center gap-1", className)}
      >
        {children}
      </nav>
    </PaginationContext.Provider>
  );
}

export function PaginationPrevTrigger() {
  const { page, setPage } = usePaginationContext();
  const tCommon = useTranslations("common");
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      disabled={page <= 1}
      onClick={() => setPage(page - 1)}
      aria-label={tCommon("paginationPrevious")}
    >
      <RiArrowLeftSLine />
    </Button>
  );
}

export function PaginationNextTrigger() {
  const { page, totalPages, setPage } = usePaginationContext();
  const tCommon = useTranslations("common");
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      disabled={page >= totalPages}
      onClick={() => setPage(page + 1)}
      aria-label={tCommon("paginationNext")}
    >
      <RiArrowRightSLine />
    </Button>
  );
}

/**
 * Compute a windowed list of page numbers with ellipses, e.g.
 * [1, "ellipsis", 4, 5, 6, "ellipsis", 10].
 */
function getPageNumbers(
  page: number,
  totalPages: number
): (number | "ellipsis")[] {
  const siblingCount = 1;
  const totalSlots = siblingCount * 2 + 5;

  if (totalPages <= totalSlots) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const left = Math.max(2, page - siblingCount);
  const right = Math.min(totalPages - 1, page + siblingCount);

  const pages: (number | "ellipsis")[] = [1];
  if (left > 2) pages.push("ellipsis");
  for (let p = left; p <= right; p += 1) pages.push(p);
  if (right < totalPages - 1) pages.push("ellipsis");
  pages.push(totalPages);

  return pages;
}

export function PaginationItems() {
  const { page, totalPages, setPage } = usePaginationContext();
  const pages = getPageNumbers(page, totalPages);

  return (
    <>
      {pages.map((p, index) =>
        p === "ellipsis" ? (
          <span
            key={`ellipsis-${index}`}
            className="flex size-7 items-center justify-center text-sm text-muted-foreground"
          >
            &#8230;
          </span>
        ) : (
          <Button
            key={p}
            type="button"
            variant={p === page ? "outline" : "ghost"}
            size="icon-sm"
            aria-current={p === page ? "page" : undefined}
            onClick={() => setPage(p)}
          >
            {p}
          </Button>
        )
      )}
    </>
  );
}

type PaginationPageTextProps = {
  format?: "short" | "compact" | "long";
  className?: string;
};

export function PaginationPageText({
  format = "compact",
  className,
}: PaginationPageTextProps) {
  const { page, totalPages, count, pageSize } = usePaginationContext();
  const tCommon = useTranslations("common");

  const content = React.useMemo(() => {
    if (format === "long") {
      const start = (page - 1) * pageSize + 1;
      const end = Math.min(page * pageSize, count);
      return `${start} - ${end} / ${count}`;
    }
    return tCommon("pageOf", { page, totalPages });
  }, [format, page, totalPages, pageSize, count, tCommon]);

  return (
    <span className={cn("text-sm font-medium", className)}>{content}</span>
  );
}
