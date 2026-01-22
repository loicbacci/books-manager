"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import NextLink from "next/link";
import { useTranslations } from "next-intl";
import { GoStarFill } from "react-icons/go";
import { MdFilterList } from "react-icons/md";
import {
  Box,
  Grid,
  Text,
  Stack,
  Card,
  Flex,
  Badge,
  Button,
  Input,
  type ListCollection,
} from "@chakra-ui/react";
import { StatusBadge } from "@/components/ui/status-badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { BookCover } from "@/components/ui/book-cover";
import { resolvePalette } from "@/lib/color-palettes";
import {
  SelectRoot,
  SelectTrigger,
  SelectValueText,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { createListCollection } from "@chakra-ui/react";
import { GroupToggle } from "@/components/ui/group-toggle";

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

export type BookCardFields = {
  cover: boolean;
  title: boolean;
  author: boolean;
  genres: boolean;
  rating: boolean;
  status: boolean;
  format: boolean;
};

const defaultFields: BookCardFields = {
  cover: true,
  title: true,
  author: true,
  genres: false,
  rating: true,
  status: true,
  format: false,
};

type FilterStatus =
  | "ALL"
  | "TO_READ"
  | "READING"
  | "READ"
  | "DROPPED"
  | "WISHLIST";
type SortOption =
  | "title-asc"
  | "title-desc"
  | "author-asc"
  | "author-desc"
  | "created-asc"
  | "created-desc"
  | "start-asc"
  | "start-desc"
  | "end-asc"
  | "end-desc"
  | "updated-asc"
  | "updated-desc"
  | "progress-asc"
  | "progress-desc";
type GroupOption =
  | "none"
  | "series"
  | "author"
  | "status"
  | "rating"
  | "format";

type SortOptionItem = { value: SortOption; label: string };
type GroupOptionItem = { value: GroupOption; label: string };
type FilterOptionItem = { value: FilterStatus; label: string };

type BookGridControlsProps = {
  areControlsOpen: boolean;
  onToggleControls: () => void;
  isDisplayOpen: boolean;
  onToggleDisplay: () => void;
  cardFields: BookCardFields;
  onToggleCardField: (field: keyof BookCardFields) => void;
  sort: SortOption;
  onSortChange: (value: SortOption) => void;
  sortCollection: ListCollection<SortOptionItem>;
  groupBy: GroupOption;
  onGroupByChange: (value: GroupOption) => void;
  groupCollection: ListCollection<GroupOptionItem>;
  filter: FilterStatus;
  onFilterChange: (value: FilterStatus) => void;
  filterCollection: ListCollection<FilterOptionItem>;
  showGroupActions: boolean;
  onCollapseAll: () => void;
  onExpandAll: () => void;
};

function BookGridControls({
  areControlsOpen,
  onToggleControls,
  isDisplayOpen,
  onToggleDisplay,
  cardFields,
  onToggleCardField,
  sort,
  onSortChange,
  sortCollection,
  groupBy,
  onGroupByChange,
  groupCollection,
  filter,
  onFilterChange,
  filterCollection,
  showGroupActions,
  onCollapseAll,
  onExpandAll,
}: BookGridControlsProps) {
  const t = useTranslations("book");
  const tCommon = useTranslations("common");
  const controlBg = { base: "white", _dark: "bg.muted" };
  const controlBorder = { base: "border.default", _dark: "border.default" };
  const cardBg = { base: "bg.panel", _dark: "bg.card" };

  return (
    <Card.Root bg={cardBg}>
      <Card.Body>
        <Stack gap={4}>
          <Flex
            gap={4}
            wrap="wrap"
            direction={{ base: "column", md: "row" }}
            align={{ base: "stretch", md: "center" }}
          >
            <Button
              variant="outline"
              width={{ base: "full", md: "auto" }}
              onClick={onToggleControls}
              display={{ base: "inline-flex", md: "none" }}
            >
              <Flex align="center" gap={2}>
                <Text as="span">{t("filtersButton")}</Text>
                <Box display="flex" alignItems="center">
                  <MdFilterList />
                </Box>
              </Flex>
            </Button>
          </Flex>

          <Box
            display={{
              base: areControlsOpen ? "block" : "none",
              md: "block",
            }}
          >
            <Flex
              gap={4}
              wrap="wrap"
              direction={{ base: "column", md: "row" }}
              align={{ base: "stretch", md: "center" }}
            >
              <Box position="relative">
                <Button
                  variant="outline"
                  onClick={onToggleDisplay}
                  width={{ base: "full", md: "auto" }}
                >
                  {t("cardDisplay")}
                </Button>
                {isDisplayOpen && (
                  <Box
                    position="absolute"
                    mt={2}
                    right={{ base: "auto", md: 0 }}
                    left={{ base: 0, md: "auto" }}
                    zIndex={10}
                    bg="bg.panel"
                    borderWidth="1px"
                    borderRadius="md"
                    boxShadow="md"
                    p={3}
                    minW={{ base: "full", md: "220px" }}
                    maxW="90vw"
                  >
                    <Stack gap={2}>
                      {[
                        { key: "cover", label: t("cardDisplayCover") },
                        { key: "title", label: t("cardDisplayTitle") },
                        { key: "author", label: t("cardDisplayAuthor") },
                        { key: "genres", label: t("cardDisplayGenres") },
                        { key: "rating", label: t("cardDisplayRating") },
                        { key: "status", label: t("cardDisplayStatus") },
                        { key: "format", label: t("cardDisplayFormat") },
                      ].map((item) => (
                        <Flex key={item.key} align="center" gap={2}>
                          <input
                            type="checkbox"
                            checked={cardFields[item.key as keyof BookCardFields]}
                            onChange={() =>
                              onToggleCardField(item.key as keyof BookCardFields)
                            }
                          />
                          <Text fontSize="sm">{item.label}</Text>
                        </Flex>
                      ))}
                    </Stack>
                  </Box>
                )}
              </Box>
              <SelectRoot
                collection={sortCollection}
                value={[sort]}
                onValueChange={(e) => onSortChange(e.value[0] as SortOption)}
                width={{ base: "full", md: "220px" }}
              >
                <SelectTrigger bg={controlBg} borderColor={controlBorder}>
                  <SelectValueText placeholder={tCommon("sort")} />
                </SelectTrigger>
                <SelectContent>
                  {sortCollection.items.map((item) => (
                    <SelectItem key={item.value} item={item}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </SelectRoot>
              <Flex
                align={{ base: "stretch", md: "center" }}
                gap={2}
                direction={{ base: "column", md: "row" }}
                width={{ base: "full", md: "auto" }}
              >
                <Text fontSize="sm" color="fg.muted">
                  {t("groupingLabel")}
                </Text>
                <SelectRoot
                  collection={groupCollection}
                  value={[groupBy]}
                  onValueChange={(e) =>
                    onGroupByChange(e.value[0] as GroupOption)
                  }
                  width={{ base: "full", md: "220px" }}
                >
                  <SelectTrigger bg={controlBg} borderColor={controlBorder}>
                    <SelectValueText placeholder={t("groupBy")} />
                  </SelectTrigger>
                  <SelectContent>
                    {groupCollection.items.map((item) => (
                      <SelectItem key={item.value} item={item}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </SelectRoot>
              </Flex>
              <Flex
                align={{ base: "stretch", md: "center" }}
                gap={2}
                direction={{ base: "column", md: "row" }}
                width={{ base: "full", md: "auto" }}
              >
                <Text fontSize="sm" color="fg.muted">
                  {t("filteringLabel")}
                </Text>
                <SelectRoot
                  collection={filterCollection}
                  value={[filter]}
                  onValueChange={(e) =>
                    onFilterChange(e.value[0] as FilterStatus)
                  }
                  width={{ base: "full", md: "220px" }}
                >
                  <SelectTrigger bg={controlBg} borderColor={controlBorder}>
                    <SelectValueText placeholder={t("filterBy")} />
                  </SelectTrigger>
                  <SelectContent>
                    {filterCollection.items.map((item) => (
                      <SelectItem key={item.value} item={item}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </SelectRoot>
              </Flex>
              {showGroupActions && (
                <Flex gap={2} width={{ base: "full", md: "auto" }}>
                  <Button
                    size="sm"
                    variant="outline"
                    width={{ base: "full", md: "auto" }}
                    onClick={onCollapseAll}
                  >
                    {t("groupCollapseAll")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    width={{ base: "full", md: "auto" }}
                    onClick={onExpandAll}
                  >
                    {t("groupExpandAll")}
                  </Button>
                </Flex>
              )}
            </Flex>
          </Box>
        </Stack>
      </Card.Body>
    </Card.Root>
  );
}

type BookGridViewProps = {
  books: BookGridBook[];
  defaultFields?: BookCardFields;
  cookieKey?: string;
  emptyAction?: ReactNode;
  emptyText?: string;
};

export function BookGridView({
  books,
  defaultFields: initialFields = defaultFields,
  cookieKey,
  emptyAction,
  emptyText,
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

  const filterOptions: { value: FilterStatus; label: string }[] = [
    { value: "ALL", label: t("filterAllBooks") },
    { value: "TO_READ", label: t("filterStatusToRead") },
    { value: "READING", label: t("filterStatusReading") },
    { value: "READ", label: t("filterStatusRead") },
    { value: "DROPPED", label: t("filterStatusDropped") },
    { value: "WISHLIST", label: t("filterWishlist") },
  ];

  const sortOptions = [
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
  ] as const;

  const sortCollection = createListCollection<SortOptionItem>({
    items: sortOptions.map((option) => ({
      value: option.value,
      label: option.label,
    })),
  });

  const groupOptions = [
    { value: "none", label: t("groupNone") },
    { value: "series", label: t("groupSeries") },
    { value: "author", label: t("groupAuthor") },
    { value: "status", label: t("groupStatus") },
    { value: "rating", label: t("groupRating") },
    { value: "format", label: t("groupFormat") },
  ] as const;

  const groupCollection = createListCollection<GroupOptionItem>({
    items: groupOptions.map((option) => ({
      value: option.value,
      label: option.label,
    })),
  });

  const filterCollection = createListCollection<FilterOptionItem>({
    items: filterOptions.map((option) => ({
      value: option.value,
      label: option.label,
    })),
  });

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
          const stars = Math.min(5, Math.round(book.rating / 2));
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

      {sortedBooks.length === 0 ? (
        <Card.Root>
          <Card.Body>
            <Stack align="center" py={12}>
              <Text fontSize="5xl">📚</Text>
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

function BookCard({
  book,
  fields,
}: {
  book: BookGridBook;
  fields: BookCardFields;
}) {
  const progress = book.totalPages
    ? Math.round((book.currentPage / book.totalPages) * 100)
    : 0;

  return (
    <Card.Root asChild>
      <NextLink href={`/books/${book.slug}`}>
        <Card.Body p={3}>
          <Stack gap={2}>
            {fields.cover && (
              <Box position="relative">
                <BookCover coverUrl={book.coverUrl} title={book.title} />
                {book.isWishlist && (
                  <Box
                    position="absolute"
                    top={1}
                    right={1}
                    bg="yellow.400"
                    borderRadius="full"
                    p={1}
                    fontSize="sm"
                  >
                    ⭐
                  </Box>
                )}
              </Box>
            )}
            <Box>
              {fields.title && (
                <Text fontSize="sm" fontWeight="semibold" lineClamp={2}>
                  {book.title}
                </Text>
              )}
              {fields.author && (
                <Text fontSize="xs" color="fg.muted" lineClamp={1}>
                  {book.authors.map((a) => a.author.name).join(", ") ||
                    "Unknown"}
                </Text>
              )}
              {fields.genres && book.genres.length > 0 && (
                <Flex gap={1} wrap="wrap">
                  {book.genres.map(({ genre }) => (
                    <Badge
                      key={genre.id}
                      colorPalette={resolvePalette(genre.name, genre.color)}
                      variant="subtle"
                      size="sm"
                    >
                      {genre.name}
                    </Badge>
                  ))}
                </Flex>
              )}
              {fields.format && book.format && (
                <Text fontSize="xs" color="fg.muted" lineClamp={1}>
                  {book.format.name}
                </Text>
              )}
            </Box>
            {book.status === "READING" && book.totalPages && (
              <Box>
                <ProgressBar value={progress} size="sm" />
                <Text fontSize="xs" color="fg.muted" mt={1}>
                  {progress}%
                </Text>
              </Box>
            )}
            {fields.rating && book.rating !== null && (
              <Flex gap={1}>
                {Array.from({ length: 5 }).map((_, index) => {
                  const rating = book.rating ?? 0;
                  const filledCount = Math.min(5, Math.round(rating / 2));
                  const fillColor =
                    index < filledCount
                      ? "var(--chakra-colors-yellow-400)"
                      : "var(--chakra-colors-gray-300)";
                  return (
                    <GoStarFill
                      key={index}
                      size={14}
                      color={fillColor}
                      style={{ stroke: "black", strokeWidth: 1.75 }}
                    />
                  );
                })}
              </Flex>
            )}
            {fields.status && <StatusBadge status={book.status} size="sm" />}
          </Stack>
        </Card.Body>
      </NextLink>
    </Card.Root>
  );
}
