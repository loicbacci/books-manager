"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { RiAddLine } from "@remixicon/react";

import { AddBookModal } from "@/components/books/add-book-modal";
import { BookGridView, BookGridBook } from "@/components/books/book-grid";
import type { FilterStatus } from "@/components/books/book-grid-controls";
import { Button } from "@/components/ui/button";
import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPageText,
  PaginationPrevTrigger,
  PaginationRoot,
} from "@/components/ui/pagination";
import { usePathname, useRouter } from "@/i18n/routing";
import type { PageResult } from "@/types/pagination";

type Book = BookGridBook & {
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  series: { id: string; name: string } | null;
};

function parseFilterFromParams(params: URLSearchParams): FilterStatus {
  if (params.get("wishlist") === "1" || params.get("wishlist") === "true") {
    return "WISHLIST";
  }
  const status = params.get("status");
  if (
    status === "TO_READ" ||
    status === "READING" ||
    status === "READ" ||
    status === "DROPPED"
  ) {
    return status;
  }
  return "ALL";
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

export default function LibraryPage() {
  const t = useTranslations("book");
  const tCommon = useTranslations("common");
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const urlFilter = useMemo(
    () => parseFilterFromParams(searchParams),
    [searchParams]
  );
  const urlSearch = searchParams.get("search") ?? "";
  const urlPage = Math.max(
    1,
    Number.parseInt(searchParams.get("page") ?? "1", 10) || 1
  );

  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [totalBooks, setTotalBooks] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchDraft, setSearchDraft] = useState(urlSearch);
  const [selectionBarVisible, setSelectionBarVisible] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const pageSize = 48;

  const hasActiveFilters =
    urlFilter !== "ALL" || urlSearch.trim().length > 0;

  const updateParams = useCallback(
    (updates: {
      filter?: FilterStatus;
      search?: string;
      page?: number;
    }) => {
      const next = new URLSearchParams(searchParams.toString());
      const filter = updates.filter ?? urlFilter;
      const search =
        updates.search !== undefined ? updates.search : urlSearch;
      const page = updates.page ?? 1;

      next.delete("wishlist");
      next.delete("status");
      if (filter === "WISHLIST") {
        next.set("wishlist", "1");
      } else if (filter !== "ALL") {
        next.set("status", filter);
      }

      if (search.trim()) {
        next.set("search", search.trim());
      } else {
        next.delete("search");
      }

      if (page > 1) {
        next.set("page", String(page));
      } else {
        next.delete("page");
      }

      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router, searchParams, urlFilter, urlSearch]
  );

  const fetchBooks = useCallback(
    async (signal?: AbortSignal) => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        params.set("page", String(urlPage));
        params.set("pageSize", String(pageSize));
        if (urlFilter === "WISHLIST") {
          params.set("wishlist", "true");
        } else if (urlFilter !== "ALL") {
          params.set("status", urlFilter);
        }
        if (urlSearch.trim()) {
          params.set("search", urlSearch.trim());
        }

        const response = await fetch(`/api/books?${params.toString()}`, {
          signal,
        });
        if (response.ok) {
          const data = (await response.json()) as PageResult<Book>;
          setBooks(data.items);
          setTotalBooks(data.total);
          setTotalPages(data.totalPages);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        console.error("Failed to fetch books:", error);
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [urlFilter, urlPage, urlSearch, pageSize]
  );

  useEffect(() => {
    setSearchDraft(urlSearch);
  }, [urlSearch]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      if (searchDraft === urlSearch) return;
      updateParams({ search: searchDraft, page: 1 });
    }, 300);
    return () => window.clearTimeout(handle);
  }, [searchDraft, urlSearch, updateParams]);

  useEffect(() => {
    const controller = new AbortController();
    fetchBooks(controller.signal);
    return () => {
      controller.abort();
    };
  }, [fetchBooks]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      if (isEditableTarget(event.target)) return;
      event.preventDefault();
      searchInputRef.current?.focus();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const clearFilters = () => {
    setSearchDraft("");
    updateParams({ filter: "ALL", search: "", page: 1 });
  };

  const showMobileFab = !selectionBarVisible && !isAddModalOpen;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="hidden flex-wrap items-center justify-end gap-4 md:flex">
        <Button type="button" onClick={() => setIsAddModalOpen(true)}>
          {t("addBook")}
        </Button>
      </div>

      <div className="space-y-4">
        <BookGridView
          books={books}
          cookieKey="libraryViewPrefs"
          isLoading={loading}
          serverSideFiltering
          search={searchDraft}
          onSearchChange={setSearchDraft}
          filter={urlFilter}
          onFilterChange={(value) =>
            updateParams({ filter: value, page: 1 })
          }
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
          searchInputRef={searchInputRef}
          showSearchShortcutHint
          onSelectionBarVisibleChange={setSelectionBarVisible}
          emptyAction={
            hasActiveFilters ? (
              <Button
                type="button"
                variant="outline"
                className="mt-4"
                onClick={clearFilters}
              >
                {t("clearFilters")}
              </Button>
            ) : (
              <Button
                type="button"
                className="mt-4"
                onClick={() => setIsAddModalOpen(true)}
              >
                {t("addBook")}
              </Button>
            )
          }
          emptyText={
            hasActiveFilters ? t("noResultsFound") : undefined
          }
          enableSelection
          onBooksChanged={() => fetchBooks()}
        />
        {!loading && totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            <PaginationRoot
              count={totalBooks}
              pageSize={pageSize}
              page={urlPage}
              onPageChange={(e) =>
                updateParams({ page: e.page, filter: urlFilter, search: urlSearch })
              }
            >
              <PaginationPrevTrigger />
              <PaginationPageText className="px-1" />
              <PaginationItems />
              <PaginationNextTrigger />
            </PaginationRoot>
          </div>
        )}
      </div>

      {showMobileFab && (
        <Button
          type="button"
          size="icon-lg"
          aria-label={t("addBook")}
          className="fixed right-6 bottom-6 z-40 size-14 rounded-full shadow-lg md:hidden"
          onClick={() => setIsAddModalOpen(true)}
        >
          <RiAddLine className="size-6" />
        </Button>
      )}

      <AddBookModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          setIsAddModalOpen(false);
          fetchBooks();
        }}
      />
    </div>
  );
}
