"use client";

import { useTranslations } from "next-intl";
import type { ReactNode, RefObject } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RiBookOpenLine, RiCheckboxMultipleLine, RiCloseLine } from "@remixicon/react";
import { toast } from "sonner";

import { BookCard } from "@/components/books/book-card";
import {
  BookCardFields,
  BookGridControls,
  FilterOptionItem,
  FilterStatus,
  GroupOption,
  GroupOptionItem,
  SortOption,
  SortOptionItem,
} from "@/components/books/book-grid-controls";
import { BookGridSkeleton } from "@/components/books/book-grid-skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GroupToggle } from "@/components/ui/group-toggle";
import { cn } from "@/lib/utils";

type ReadingStatus = "TO_READ" | "READING" | "READ" | "DROPPED";

/**
 * Normalized book shape required by the grid.
 *
 * The grid expects fully hydrated relations used for sorting/grouping.
 */
export type BookGridBook = {
  id: string;
  slug: string;
  title: string;
  coverUrl: string | null;
  status: string;
  currentPage: number;
  totalPages: number | null;
  rating: number | null;
  isWishlist: boolean;
  startDate?: string | null;
  endDate?: string | null;
  createdAt?: string;
  updatedAt?: string;
  series?: { id: string; name: string } | null;
  authors: Array<{ author: { id: string; name: string } }>;
  genres: Array<{ genre: { id: string; name: string; color: string | null } }>;
  format: { id: string; name: string } | null;
};

/**
 * Defaults for the card display toggles.
 */
export const slimBookGridFields: BookCardFields = {
  cover: true,
  title: true,
  author: true,
  genres: false,
  rating: false,
  status: false,
  format: false,
};

const defaultFields: BookCardFields = slimBookGridFields;

type BookGridViewProps = {
  books: BookGridBook[];
  defaultFields?: BookCardFields;
  cookieKey?: string;
  emptyAction?: ReactNode;
  emptyText?: string;
  isLoading?: boolean;
  /** Overrides the initial filter (e.g. from a deep link) and skips restoring
   * the saved filter from the preferences cookie. */
  initialFilter?: FilterStatus;
  search?: string;
  onSearchChange?: (value: string) => void;
  filter?: FilterStatus;
  onFilterChange?: (value: FilterStatus) => void;
  serverSideFiltering?: boolean;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
  enableSelection?: boolean;
  onBooksChanged?: () => void;
  searchInputRef?: RefObject<HTMLInputElement | null>;
  onSelectionBarVisibleChange?: (visible: boolean) => void;
  showSearchShortcutHint?: boolean;
};

/**
 * Book grid with filtering, sorting, grouping, and persisted preferences.
 *
 * `cookieKey` persists UI state across sessions for each page.
 */
export function BookGridView({
  books,
  defaultFields: initialFields = defaultFields,
  cookieKey,
  emptyAction,
  emptyText,
  isLoading = false,
  initialFilter,
  search: searchProp,
  onSearchChange,
  filter: filterProp,
  onFilterChange,
  serverSideFiltering = false,
  hasActiveFilters = false,
  onClearFilters,
  enableSelection = false,
  onBooksChanged,
  searchInputRef: searchInputRefProp,
  onSelectionBarVisibleChange,
  showSearchShortcutHint = false,
}: BookGridViewProps) {
  const t = useTranslations("book");
  const tStatus = useTranslations("status");
  const tCommon = useTranslations("common");

  const isSearchControlled = searchProp !== undefined;
  const isFilterControlled = filterProp !== undefined;
  const skipFilterCookie =
    isFilterControlled || !!initialFilter || serverSideFiltering;

  const [internalSearch, setInternalSearch] = useState("");
  const [internalFilter, setInternalFilter] = useState<FilterStatus>(
    initialFilter ?? "ALL"
  );
  const search = isSearchControlled ? searchProp : internalSearch;
  const filter = isFilterControlled ? filterProp : internalFilter;

  const handleSearchChange = (value: string) => {
    if (onSearchChange) onSearchChange(value);
    else setInternalSearch(value);
  };

  const handleFilterChange = (value: FilterStatus) => {
    if (onFilterChange) onFilterChange(value);
    else setInternalFilter(value);
  };

  const [sort, setSort] = useState<SortOption>("title-asc");
  const [groupBy, setGroupBy] = useState<GroupOption>("none");
  const [collapsedGroups, setCollapsedGroups] = useState<
    Record<string, boolean>
  >({});
  const [isDisplayOpen, setIsDisplayOpen] = useState(false);
  const [cardFields, setCardFields] = useState<BookCardFields>(initialFields);
  const [areControlsOpen, setAreControlsOpen] = useState(false);

  const [selectionMode, setSelectionMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const internalSearchInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = searchInputRefProp ?? internalSearchInputRef;

  const bookText = useCallback(
    (key: string, fallback: string, values?: Record<string, string | number>) => {
      if (t.has(key as Parameters<typeof t>[0])) {
        return values
          ? t(key as Parameters<typeof t>[0], values as never)
          : t(key as Parameters<typeof t>[0]);
      }
      if (values) {
        return Object.entries(values).reduce(
          (text, [name, value]) => text.replace(`{${name}}`, String(value)),
          fallback
        );
      }
      return fallback;
    },
    [t]
  );

  const readCookie = (key: string) => {
    const match = document.cookie
      .split("; ")
      .find((item) => item.startsWith(`${key}=`));
    return match ? decodeURIComponent(match.split("=")[1]) : null;
  };

  // Persist user preferences to a long-lived cookie.
  const writeCookie = (key: string, value: string) => {
    const maxAge = 60 * 60 * 24 * 365;
    document.cookie = `${key}=${encodeURIComponent(value)}; max-age=${maxAge}; path=/; samesite=lax`;
  };

  useEffect(() => {
    if (!cookieKey) return;
    const raw = readCookie(cookieKey);
    if (!raw) return;
    try {
      const prefs = JSON.parse(raw) as {
        filter?: FilterStatus;
        sort?: SortOption;
        groupBy?: GroupOption;
        cardFields?: BookCardFields;
      };
      if (prefs.filter && !skipFilterCookie) {
        handleFilterChange(prefs.filter);
      }
      if (prefs.sort) setSort(prefs.sort);
      if (prefs.groupBy) setGroupBy(prefs.groupBy);
      if (prefs.cardFields)
        setCardFields((prev) => ({ ...prev, ...prefs.cardFields }));
    } catch {
      // ignore invalid cookie payload
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cookieKey, skipFilterCookie]);

  useEffect(() => {
    if (!cookieKey) return;
    const prefs: Record<string, unknown> = {
      sort,
      groupBy,
      cardFields,
    };
    if (!skipFilterCookie) {
      prefs.filter = filter;
    }
    writeCookie(cookieKey, JSON.stringify(prefs));
  }, [cookieKey, filter, sort, groupBy, cardFields, skipFilterCookie]);

  const filterOptions = useMemo(
    () =>
      [
        { value: "ALL", label: t("filterAllBooks") },
        { value: "TO_READ", label: t("filterStatusToRead") },
        { value: "READING", label: t("filterStatusReading") },
        { value: "READ", label: t("filterStatusRead") },
        { value: "DROPPED", label: t("filterStatusDropped") },
        { value: "WISHLIST", label: t("filterWishlist") },
      ] as const,
    [t]
  );

  const sortOptions = useMemo(
    () =>
      [
        { value: "title-asc", label: t("sortTitleAsc") },
        { value: "title-desc", label: t("sortTitleDesc") },
        { value: "author-asc", label: t("sortAuthorAsc") },
        { value: "author-desc", label: t("sortAuthorDesc") },
        { value: "created-asc", label: t("sortCreatedAsc") },
        { value: "created-desc", label: t("sortCreatedDesc") },
        { value: "start-asc", label: t("sortStartAsc") },
        { value: "start-desc", label: t("sortStartDesc") },
        { value: "end-asc", label: t("sortEndAsc") },
        { value: "end-desc", label: t("sortEndDesc") },
        { value: "updated-asc", label: t("sortUpdatedAsc") },
        { value: "updated-desc", label: t("sortUpdatedDesc") },
        { value: "progress-asc", label: t("sortProgressAsc") },
        { value: "progress-desc", label: t("sortProgressDesc") },
      ] as const,
    [t]
  );

  const groupOptions = useMemo(
    () =>
      [
        { value: "none", label: t("groupNone") },
        { value: "series", label: t("groupSeries") },
        { value: "author", label: t("groupAuthor") },
        { value: "status", label: t("groupStatus") },
        { value: "rating", label: t("groupRating") },
        { value: "format", label: t("groupFormat") },
      ] as const,
    [t]
  );

  const filterItems: FilterOptionItem[] = [...filterOptions];
  const sortItems: SortOptionItem[] = [...sortOptions];
  const groupItems: GroupOptionItem[] = [...groupOptions];

  const bulkStatusOptions = useMemo(
    () =>
      [
        { value: "TO_READ", label: tStatus("toRead") },
        { value: "READING", label: tStatus("reading") },
        { value: "READ", label: tStatus("read") },
        { value: "DROPPED", label: tStatus("dropped") },
      ] as const,
    [tStatus]
  );

  // Apply search and status/wishlist filters (skipped when server-side filtered).
  const filteredBooks = useMemo(() => {
    if (serverSideFiltering) return books;

    const query = search.trim().toLowerCase();

    return books.filter((book) => {
      if (filter === "WISHLIST" && !book.isWishlist) return false;
      if (filter !== "ALL" && filter !== "WISHLIST" && book.status !== filter)
        return false;
      if (!query) return true;

      const authorText = book.authors
        .map((a) => a.author.name.toLowerCase())
        .join(" ");
      return (
        book.title.toLowerCase().includes(query) ||
        authorText.includes(query)
      );
    });
  }, [books, filter, search, serverSideFiltering]);

  // Sort books by the selected sort key.
  const sortedBooks = useMemo(() => {
    const getAuthorName = (book: BookGridBook) =>
      book.authors[0]?.author.name.toLowerCase() || "";
    const getProgress = (book: BookGridBook) =>
      book.totalPages ? book.currentPage / book.totalPages : 0;
    const getDateValue = (date?: string | null) =>
      date ? new Date(date).getTime() : null;

    const compareStrings = (a: string, b: string) => a.localeCompare(b);
    const compareNumbers = (a: number, b: number) => a - b;
    const compareDates = (a?: string | null, b?: string | null) => {
      const aValue = getDateValue(a);
      const bValue = getDateValue(b);
      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return 1;
      if (bValue === null) return -1;
      return aValue - bValue;
    };

    const list = [...filteredBooks];
    switch (sort) {
      case "title-asc":
        return list.sort((a, b) => compareStrings(a.title, b.title));
      case "title-desc":
        return list.sort((a, b) => compareStrings(b.title, a.title));
      case "author-asc":
        return list.sort((a, b) =>
          compareStrings(getAuthorName(a), getAuthorName(b))
        );
      case "author-desc":
        return list.sort((a, b) =>
          compareStrings(getAuthorName(b), getAuthorName(a))
        );
      case "created-asc":
        return list.sort((a, b) => compareDates(a.createdAt, b.createdAt));
      case "created-desc":
        return list.sort((a, b) => compareDates(b.createdAt, a.createdAt));
      case "start-asc":
        return list.sort((a, b) => compareDates(a.startDate, b.startDate));
      case "start-desc":
        return list.sort((a, b) => compareDates(b.startDate, a.startDate));
      case "end-asc":
        return list.sort((a, b) => compareDates(a.endDate, b.endDate));
      case "end-desc":
        return list.sort((a, b) => compareDates(b.endDate, a.endDate));
      case "updated-asc":
        return list.sort((a, b) => compareDates(a.updatedAt, b.updatedAt));
      case "updated-desc":
        return list.sort((a, b) => compareDates(b.updatedAt, a.updatedAt));
      case "progress-asc":
        return list.sort((a, b) =>
          compareNumbers(getProgress(a), getProgress(b))
        );
      case "progress-desc":
        return list.sort((a, b) =>
          compareNumbers(getProgress(b), getProgress(a))
        );
      default:
        return list;
    }
  }, [filteredBooks, sort]);

  // Group sorted books based on the current grouping choice.
  const groupedBooks = useMemo(() => {
    if (groupBy === "none") {
      return [{ key: "all", label: "", books: sortedBooks }];
    }

    const groups = new Map<
      string,
      { label: string; books: BookGridBook[]; order: number }
    >();
    const statusOrder: Record<string, number> = {
      TO_READ: 1,
      READING: 2,
      READ: 3,
      DROPPED: 4,
    };

    const getGroupInfo = (book: BookGridBook) => {
      switch (groupBy) {
        case "series": {
          const label = book.series?.name || t("groupNoSeries");
          return {
            key: label,
            label,
            order: label === t("groupNoSeries") ? 999 : 0,
          };
        }
        case "author": {
          const label = book.authors[0]?.author.name || t("groupUnknownAuthor");
          return {
            key: label,
            label,
            order: label === t("groupUnknownAuthor") ? 999 : 0,
          };
        }
        case "status": {
          const label = tStatus(
            book.status === "TO_READ"
              ? "toRead"
              : book.status === "READING"
                ? "reading"
                : book.status === "READ"
                  ? "read"
                  : "dropped"
          );
          return {
            key: book.status,
            label,
            order: statusOrder[book.status] ?? 999,
          };
        }
        case "rating": {
          if (!book.rating) {
            return { key: "no-rating", label: t("groupNoRating"), order: 999 };
          }
          const stars = Math.min(5, Math.max(1, Math.ceil(book.rating / 2)));
          return {
            key: `rating-${stars}`,
            label: t("groupRatingStars", { stars }),
            order: 5 - stars,
          };
        }
        case "format": {
          const label = book.format?.name || t("groupNoFormat");
          return {
            key: label,
            label,
            order: label === t("groupNoFormat") ? 999 : 0,
          };
        }
        default:
          return { key: "all", label: "", order: 0 };
      }
    };

    for (const book of sortedBooks) {
      const { key, label, order } = getGroupInfo(book);
      if (!groups.has(key)) {
        groups.set(key, { label, books: [], order });
      }
      groups.get(key)!.books.push(book);
    }

    const entries = Array.from(groups.entries()).map(([key, value]) => ({
      key,
      label: value.label,
      books: value.books,
      order: value.order,
    }));

    if (groupBy === "status" || groupBy === "rating") {
      return entries.sort((a, b) => a.order - b.order);
    }

    if (groupBy === "author") {
      return entries.sort((a, b) => {
        if (a.order !== b.order) return a.order - b.order;
        return a.label.localeCompare(b.label);
      });
    }

    return entries.sort((a, b) => a.label.localeCompare(b.label));
  }, [sortedBooks, groupBy, t, tStatus]);

  const toggleGroup = (key: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleSelect = (bookId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(bookId)) next.delete(bookId);
      else next.add(bookId);
      return next;
    });
  };

  const selectAllVisible = () => {
    setSelected(new Set(sortedBooks.map((book) => book.id)));
  };

  const clearSelection = () => {
    setSelected(new Set());
  };

  const toggleSelectionMode = () => {
    setSelectionMode((prev) => {
      if (prev) clearSelection();
      return !prev;
    });
  };

  const bulkPatch = async (payload: {
    status?: ReadingStatus;
    isWishlist?: boolean;
  }) => {
    if (selected.size === 0) return;

    setIsBulkLoading(true);
    try {
      const response = await fetch("/api/books/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: Array.from(selected),
          ...payload,
        }),
      });

      if (!response.ok) {
        toast.error(tCommon("saveFailed"));
        return;
      }

      toast.success(
        bookText("bulkUpdated", "Books updated", { count: selected.size })
      );
      clearSelection();
      onBooksChanged?.();
    } catch {
      toast.error(tCommon("saveFailed"));
    } finally {
      setIsBulkLoading(false);
    }
  };

  const bulkDelete = async () => {
    if (selected.size === 0) return;

    setIsBulkLoading(true);
    try {
      const response = await fetch("/api/books/bulk", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });

      if (!response.ok) {
        toast.error(tCommon("deleteFailed"));
        return;
      }

      toast.success(
        bookText("bulkDeleted", "Books deleted", { count: selected.size })
      );
      setIsDeleteDialogOpen(false);
      clearSelection();
      onBooksChanged?.();
    } catch {
      toast.error(tCommon("deleteFailed"));
    } finally {
      setIsBulkLoading(false);
    }
  };

  const showBulkBar = enableSelection && selectionMode && selected.size > 0;

  useEffect(() => {
    onSelectionBarVisibleChange?.(showBulkBar);
  }, [onSelectionBarVisibleChange, showBulkBar]);

  const activeFilterChips = useMemo(() => {
    const chips: Array<{ key: string; label: string; onClear: () => void }> = [];

    if (filter !== "ALL" && filter !== "WISHLIST") {
      const option = filterOptions.find((item) => item.value === filter);
      chips.push({
        key: "status",
        label: option?.label ?? filter,
        onClear: () => handleFilterChange("ALL"),
      });
    }

    if (filter === "WISHLIST") {
      chips.push({
        key: "wishlist",
        label: t("filterWishlist"),
        onClear: () => handleFilterChange("ALL"),
      });
    }

    if (search.trim()) {
      chips.push({
        key: "search",
        label: `"${search.trim()}"`,
        onClear: () => handleSearchChange(""),
      });
    }

    return chips;
  }, [filter, filterOptions, handleFilterChange, handleSearchChange, search, t]);

  return (
    <div className={cn("space-y-4", showBulkBar && "pb-24")}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1 sm:max-w-[300px]">
            <Input
              ref={searchInputRef}
              type="search"
              aria-label={tCommon("search")}
              placeholder={tCommon("search")}
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="max-w-full"
            />
            {showSearchShortcutHint && (
              <p className="hidden text-xs text-muted-foreground md:block">
                {t("pressSlashToSearch")}
              </p>
            )}
          </div>
          {enableSelection && (
            <Button
              type="button"
              variant={selectionMode ? "default" : "outline"}
              size="sm"
              onClick={toggleSelectionMode}
            >
              <RiCheckboxMultipleLine className="size-4" />
              {bookText("selectMode", "Select")}
            </Button>
          )}
        </div>
        {hasActiveFilters && activeFilterChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {activeFilterChips.map((chip) => (
              <Badge
                key={chip.key}
                variant="secondary"
                className="gap-1 pr-1 font-normal"
              >
                {chip.label}
                <button
                  type="button"
                  aria-label={tCommon("clear")}
                  onClick={chip.onClear}
                  className="rounded-full p-0.5 hover:bg-muted-foreground/20"
                >
                  <RiCloseLine className="size-3" />
                </button>
              </Badge>
            ))}
            {onClearFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
              >
                {bookText("clearFilters", "Clear filters")}
              </Button>
            )}
          </div>
        )}
        <BookGridControls
          areControlsOpen={areControlsOpen}
          onToggleControls={() => setAreControlsOpen((prev) => !prev)}
          isDisplayOpen={isDisplayOpen}
          onToggleDisplay={() => setIsDisplayOpen((prev) => !prev)}
          cardFields={cardFields}
          onToggleCardField={(field) =>
            setCardFields((prev) => ({ ...prev, [field]: !prev[field] }))
          }
          sort={sort}
          onSortChange={(value) => setSort(value)}
          sortItems={sortItems}
          groupBy={groupBy}
          onGroupByChange={(value) => setGroupBy(value)}
          groupItems={groupItems}
          filter={filter}
          onFilterChange={handleFilterChange}
          filterItems={filterItems}
          showGroupActions={groupBy !== "none" && groupedBooks.length > 0}
          onCollapseAll={() => {
            const nextState: Record<string, boolean> = {};
            groupedBooks.forEach((group) => {
              nextState[group.key] = true;
            });
            setCollapsedGroups(nextState);
          }}
          onExpandAll={() => setCollapsedGroups({})}
        />
      </div>

      {isLoading ? (
        <BookGridSkeleton />
      ) : sortedBooks.length === 0 ? (
        <div className="rounded-2xl bg-card p-12 text-center shadow-sm ring-1 ring-foreground/5 dark:ring-foreground/10">
          <div className="flex flex-col items-center gap-3">
            <RiBookOpenLine className="size-10 text-primary" />
            <p className="text-lg text-muted-foreground">
              {emptyText ?? t("noBooks")}
            </p>
            {emptyAction}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedBooks.map((group) => (
            <div key={group.key} className="space-y-3">
              {group.label && (
                <GroupToggle
                  label={group.label}
                  collapsed={!!collapsedGroups[group.key]}
                  onToggle={() => toggleGroup(group.key)}
                  size="sm"
                />
              )}
              {!collapsedGroups[group.key] && (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {group.books.map((book) => (
                    <BookCard
                      key={book.id}
                      book={book}
                      fields={cardFields}
                      selectionMode={selectionMode}
                      selected={selected.has(book.id)}
                      onToggleSelect={toggleSelect}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showBulkBar && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 p-4 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 sm:px-6 lg:px-8">
            <span className="text-sm font-medium">
              {bookText("selectedCount", "{count} selected", {
                count: selected.size,
              })}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isBulkLoading}
              onClick={selectAllVisible}
            >
              {bookText("selectAllVisible", "Select all visible")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isBulkLoading}
              onClick={clearSelection}
            >
              {tCommon("clear")}
            </Button>
            <Select
              disabled={isBulkLoading}
              onValueChange={(value) =>
                bulkPatch({ status: value as ReadingStatus })
              }
            >
              <SelectTrigger size="sm" className="w-[160px]">
                <SelectValue
                  placeholder={bookText("bulkChangeStatus", "Change status")}
                />
              </SelectTrigger>
              <SelectContent>
                {bulkStatusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isBulkLoading}
              onClick={() => bulkPatch({ isWishlist: true })}
            >
              {bookText("bulkAddWishlist", "Add to wishlist")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isBulkLoading}
              onClick={() => bulkPatch({ isWishlist: false })}
            >
              {bookText("bulkRemoveWishlist", "Remove from wishlist")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isBulkLoading}
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              {tCommon("delete")}
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tCommon("delete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {bookText(
                "bulkDeleteConfirm",
                "Are you sure you want to delete the selected books?",
                { count: selected.size }
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkLoading}>
              {tCommon("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isBulkLoading}
              onClick={(event) => {
                event.preventDefault();
                void bulkDelete();
              }}
            >
              {tCommon("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
