"use client";

import {
  Card,
  Grid,
  Icon,
  Input,
  Stack,
  Text,
  createListCollection,
} from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { FiBookOpen } from "react-icons/fi";

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
import { GroupToggle } from "@/components/ui/group-toggle";

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
const defaultFields: BookCardFields = {
  cover: true,
  title: true,
  author: true,
  genres: false,
  rating: true,
  status: true,
  format: false,
};

type BookGridViewProps = {
  books: BookGridBook[];
  defaultFields?: BookCardFields;
  cookieKey?: string;
  emptyAction?: ReactNode;
  emptyText?: string;
  isLoading?: boolean;
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
}: BookGridViewProps) {
  const t = useTranslations("book");
  const tStatus = useTranslations("status");
  const tCommon = useTranslations("common");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("ALL");
  const [sort, setSort] = useState<SortOption>("title-asc");
  const [groupBy, setGroupBy] = useState<GroupOption>("none");
  const [collapsedGroups, setCollapsedGroups] = useState<
    Record<string, boolean>
  >({});
  const [isDisplayOpen, setIsDisplayOpen] = useState(false);
  const [cardFields, setCardFields] = useState<BookCardFields>(initialFields);
  const [areControlsOpen, setAreControlsOpen] = useState(false);

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
      if (prefs.filter) setFilter(prefs.filter);
      if (prefs.sort) setSort(prefs.sort);
      if (prefs.groupBy) setGroupBy(prefs.groupBy);
      if (prefs.cardFields)
        setCardFields((prev) => ({ ...prev, ...prefs.cardFields }));
    } catch {
      // ignore invalid cookie payload
    }
  }, [cookieKey]);

  useEffect(() => {
    if (!cookieKey) return;
    writeCookie(
      cookieKey,
      JSON.stringify({
        filter,
        sort,
        groupBy,
        cardFields,
      })
    );
  }, [cookieKey, filter, sort, groupBy, cardFields]);

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

  const sortCollection = useMemo(
    () =>
      createListCollection<SortOptionItem>({
        items: sortOptions.map((option) => ({
          value: option.value,
          label: option.label,
        })),
      }),
    [sortOptions]
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

  const groupCollection = useMemo(
    () =>
      createListCollection<GroupOptionItem>({
        items: groupOptions.map((option) => ({
          value: option.value,
          label: option.label,
        })),
      }),
    [groupOptions]
  );

  const filterCollection = useMemo(
    () =>
      createListCollection<FilterOptionItem>({
        items: filterOptions.map((option) => ({
          value: option.value,
          label: option.label,
        })),
      }),
    [filterOptions]
  );

  // Apply search and status/wishlist filters.
  const filteredBooks = useMemo(() => {
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
        book.title.toLowerCase().includes(query) || authorText.includes(query)
      );
    });
  }, [books, filter, search]);

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
          const stars = Math.min(5, Math.round(book.rating));
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

  return (
    <Stack gap={4}>
      <Stack gap={4}>
        <Input
          type="search"
          aria-label={tCommon("search")}
          placeholder={tCommon("search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          maxW={{ base: "full", md: "300px" }}
        />
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
          sortCollection={sortCollection}
          groupBy={groupBy}
          onGroupByChange={(value) => setGroupBy(value)}
          groupCollection={groupCollection}
          filter={filter}
          onFilterChange={(value) => setFilter(value)}
          filterCollection={filterCollection}
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
      </Stack>

      {isLoading ? (
        <BookGridSkeleton />
      ) : sortedBooks.length === 0 ? (
        <Card.Root>
          <Card.Body>
            <Stack align="center" py={12}>
              <Icon as={FiBookOpen} boxSize={10} color="brand.fg" />
              <Text color="fg.muted" fontSize="lg">
                {emptyText ?? t("noBooks")}
              </Text>
              {emptyAction}
            </Stack>
          </Card.Body>
        </Card.Root>
      ) : (
        <Stack gap={6}>
          {groupedBooks.map((group) => (
            <Stack key={group.key} gap={3}>
              {group.label && (
                <GroupToggle
                  label={group.label}
                  collapsed={!!collapsedGroups[group.key]}
                  onToggle={() => toggleGroup(group.key)}
                  size="sm"
                />
              )}
              {!collapsedGroups[group.key] && (
                <Grid
                  templateColumns={{
                    base: "repeat(2, 1fr)",
                    sm: "repeat(3, 1fr)",
                    md: "repeat(4, 1fr)",
                    lg: "repeat(5, 1fr)",
                    xl: "repeat(6, 1fr)",
                  }}
                  gap={4}
                >
                  {group.books.map((book) => (
                    <BookCard key={book.id} book={book} fields={cardFields} />
                  ))}
                </Grid>
              )}
            </Stack>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
