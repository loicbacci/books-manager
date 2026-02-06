"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  Box,
  Button,
  Card,
  Container,
  Flex,
  Heading,
  Input,
  Stack,
  Text,
  PopoverRoot,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  Icon,
} from "@chakra-ui/react";
import { FiArrowRight, FiFilter, FiFeather } from "react-icons/fi";
import {
  SelectRoot,
  SelectTrigger,
  SelectValueText,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { createListCollection } from "@chakra-ui/react";
import { GroupToggle } from "@/components/ui/group-toggle";
import {
  PaginationRoot,
  PaginationPrevTrigger,
  PaginationItems,
  PaginationNextTrigger,
  PaginationPageText,
} from "@/components/ui/pagination";
import { CreateAuthorDialog } from "@/components/authors/create-author-dialog";
import type { PageResult } from "@/types/pagination";

type Author = {
  id: string;
  name: string;
  gender: { id: string; name: string } | null;
  nationalities: Array<{ nationality: { id: string; name: string } }>;
  _count: { books: number };
};

export default function AuthorsPage() {
  const t = useTranslations("author");
  const tCommon = useTranslations("common");
  const tNav = useTranslations("nav");

  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [sort, setSort] = useState<
    "name-asc" | "name-desc" | "count-desc" | "count-asc"
  >("name-asc");
  const [groupBy, setGroupBy] = useState<"none" | "gender" | "nationality">(
    "none"
  );
  const [collapsedGroups, setCollapsedGroups] = useState<
    Record<string, boolean>
  >({});
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [nationalityFilter, setNationalityFilter] = useState<string>("all");
  const [areControlsOpen, setAreControlsOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalAuthors, setTotalAuthors] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 50;
  const controlBg = { base: "white", _dark: "bg.subtle" };
  const controlBorder = { base: "border.default", _dark: "border.default" };
  const cardBg = { base: "bg.panel", _dark: "bg.card" };

  const fetchAuthors = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/authors?page=${page}&pageSize=${pageSize}`,
        signal ? { signal } : undefined
      );
      if (response.ok) {
        const data = (await response.json()) as PageResult<Author>;
        setAuthors(data.items);
        setTotalAuthors(data.total);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch authors:", error);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;
    fetchAuthors(controller.signal).catch((error) => {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      if (isActive) {
        console.error("Failed to fetch authors:", error);
      }
    });
    return () => {
      isActive = false;
      controller.abort();
    };
  }, [fetchAuthors]);

  const genderNames = useMemo(
    () =>
      Array.from(
        new Set(authors.map((author) => author.gender?.name).filter(Boolean))
      ) as string[],
    [authors]
  );
  const nationalityNames = useMemo(
    () =>
      Array.from(
        new Set(
          authors.flatMap((author) =>
            author.nationalities.map((entry) => entry.nationality.name)
          )
        )
      ),
    [authors]
  );

  const genderFilterCollection = useMemo(
    () =>
      createListCollection({
        items: [
          { value: "all", label: t("filterAll") },
          ...genderNames.map((gender) => ({ value: gender, label: gender })),
        ],
      }),
    [genderNames, t]
  );

  const nationalityFilterCollection = useMemo(
    () =>
      createListCollection({
        items: [
          { value: "all", label: t("filterAll") },
          ...nationalityNames.map((nat) => ({ value: nat, label: nat })),
        ],
      }),
    [nationalityNames, t]
  );

  const sortCollection = useMemo(
    () =>
      createListCollection({
        items: [
          { value: "name-asc", label: t("sortNameAsc") },
          { value: "name-desc", label: t("sortNameDesc") },
          { value: "count-desc", label: t("sortBooksDesc") },
          { value: "count-asc", label: t("sortBooksAsc") },
        ],
      }),
    [t]
  );

  const groupCollection = useMemo(
    () =>
      createListCollection({
        items: [
          { value: "none", label: t("groupNone") },
          { value: "gender", label: t("groupGender") },
          { value: "nationality", label: t("groupNationality") },
        ],
      }),
    [t]
  );

  const filteredAuthors = useMemo(() => {
    const query = search.trim().toLowerCase();
    return authors.filter((author) => {
      if (query && !author.name.toLowerCase().includes(query)) return false;
      if (genderFilter !== "all" && author.gender?.name !== genderFilter)
        return false;
      if (nationalityFilter !== "all") {
        const authorNationalities = author.nationalities.map(
          (entry) => entry.nationality.name
        );
        if (!authorNationalities.includes(nationalityFilter)) {
          return false;
        }
      }
      return true;
    });
  }, [authors, genderFilter, nationalityFilter, search]);

  const sortedAuthors = useMemo(() => {
    const list = [...filteredAuthors];
    return list.sort((a, b) => {
      switch (sort) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "count-asc":
          return a._count.books - b._count.books;
        case "count-desc":
          return b._count.books - a._count.books;
        default:
          return 0;
      }
    });
  }, [filteredAuthors, sort]);

  const groupedAuthors = useMemo(() => {
    if (groupBy === "none") {
      return [{ key: "all", label: "", authors: sortedAuthors }];
    }

    const groups = new Map<string, { label: string; authors: Author[] }>();
    const unknownGender = t("unknownGender");
    const unknownNationality = t("unknownNationality");

    for (const author of sortedAuthors) {
      if (groupBy === "gender") {
        const label = author.gender?.name || unknownGender;
        if (!groups.has(label)) {
          groups.set(label, { label, authors: [] });
        }
        groups.get(label)!.authors.push(author);
        continue;
      }

      const authorNationalities = author.nationalities.map(
        (entry) => entry.nationality.name
      );
      if (authorNationalities.length === 0) {
        if (!groups.has(unknownNationality)) {
          groups.set(unknownNationality, {
            label: unknownNationality,
            authors: [],
          });
        }
        groups.get(unknownNationality)!.authors.push(author);
        continue;
      }
      authorNationalities.forEach((label) => {
        if (!groups.has(label)) {
          groups.set(label, { label, authors: [] });
        }
        groups.get(label)!.authors.push(author);
      });
    }

    return Array.from(groups.entries())
      .map(([key, value]) => ({
        key,
        label: value.label,
        authors: value.authors,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [groupBy, sortedAuthors, t]);

  const toggleGroup = (key: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <Container maxW="container.lg" py={8}>
      <Stack gap={6}>
        {/* Page header + primary action */}
        <Flex
          justify={{ base: "flex-start", md: "space-between" }}
          align={{ base: "flex-start", md: "center" }}
          direction={{ base: "column", md: "row" }}
          gap={3}
        >
          <Heading as="h1" size="2xl">
            {tNav("authors")}
          </Heading>
          <Button colorPalette="brand" onClick={() => setIsCreateOpen(true)}>
            {t("create")}
          </Button>
        </Flex>

        {/* Search + filter controls */}
        <Stack gap={4}>
          <Input
            type="search"
            aria-label={tCommon("search")}
            placeholder={tCommon("search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            maxW="300px"
          />
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
                    onClick={() => setAreControlsOpen((prev) => !prev)}
                    display={{ base: "inline-flex", md: "none" }}
                  >
                    <Flex align="center" gap={2}>
                      <Text as="span">{t("filtersButton")}</Text>
                      <Box display="flex" alignItems="center">
                        <FiFilter />
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
                    <Flex
                      align={{ base: "stretch", md: "center" }}
                      gap={2}
                      direction={{ base: "column", md: "row" }}
                      width={{ base: "full", md: "auto" }}
                    >
                      <Text fontSize="sm" color="fg.muted">
                        {t("sortingLabel")}
                      </Text>
                      <SelectRoot
                        collection={sortCollection}
                        value={[sort]}
                        onValueChange={(e) => setSort(e.value[0] as typeof sort)}
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
                    </Flex>
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
                          setGroupBy(e.value[0] as typeof groupBy)
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
                      <PopoverRoot positioning={{ placement: "bottom-start" }}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            width={{ base: "full", md: "auto" }}
                          >
                            {t("filtersButton")}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent>
                          <PopoverBody>
                            <Stack gap={3}>
                              <Text fontSize="sm" color="fg.muted">
                                {t("filterGender")}
                              </Text>
                              <SelectRoot
                      collection={genderFilterCollection}
                      value={[genderFilter]}
                      onValueChange={(e) =>
                        setGenderFilter(e.value[0] || "all")
                      }
                              >
                                <SelectTrigger
                                  bg={controlBg}
                                  borderColor={controlBorder}
                                >
                                  <SelectValueText placeholder={t("filterGender")} />
                                </SelectTrigger>
                                <SelectContent>
                        {genderFilterCollection.items.map((item) => (
                          <SelectItem key={item.value} item={item}>
                            {item.label}
                          </SelectItem>
                        ))}
                                </SelectContent>
                              </SelectRoot>
                              <Text fontSize="sm" color="fg.muted">
                                {t("filterNationality")}
                              </Text>
                              <SelectRoot
                      collection={nationalityFilterCollection}
                      value={[nationalityFilter]}
                      onValueChange={(e) =>
                        setNationalityFilter(e.value[0] || "all")
                      }
                              >
                                <SelectTrigger
                                  bg={controlBg}
                                  borderColor={controlBorder}
                                >
                                  <SelectValueText
                                    placeholder={t("filterNationality")}
                                  />
                                </SelectTrigger>
                                <SelectContent>
                        {nationalityFilterCollection.items.map((item) => (
                          <SelectItem key={item.value} item={item}>
                            {item.label}
                          </SelectItem>
                        ))}
                                </SelectContent>
                              </SelectRoot>
                            </Stack>
                          </PopoverBody>
                        </PopoverContent>
                      </PopoverRoot>
                    </Flex>
                  </Flex>
                </Box>
              </Stack>
            </Card.Body>
          </Card.Root>
        </Stack>

        {/* Loading / empty / list */}
        {loading ? (
          <Text color="fg.muted">{tCommon("loading")}</Text>
        ) : groupedAuthors.length === 0 ||
          groupedAuthors[0]?.authors.length === 0 ? (
          <Card.Root>
            <Card.Body>
              <Stack align="center" py={10}>
                <Icon as={FiFeather} boxSize={8} color="brand.fg" />
                <Text color="fg.muted">{t("empty")}</Text>
              </Stack>
            </Card.Body>
          </Card.Root>
        ) : (
          <Stack gap={4}>
            {/* Grouped author list */}
            <Stack gap={3}>
              {groupedAuthors.map((group) => (
                <Stack key={group.key} gap={2}>
                  {group.label && (
                    <GroupToggle
                      label={group.label}
                      collapsed={!!collapsedGroups[group.key]}
                      onToggle={() => toggleGroup(group.key)}
                      size="sm"
                    />
                  )}
                  {!collapsedGroups[group.key] &&
                    group.authors.map((author) => (
                      <Card.Root key={author.id} asChild>
                        <Link href={`/authors/${author.id}`}>
                          <Card.Body>
                            <Flex justify="space-between" align="center" gap={4}>
                              <Box>
                                <Text fontWeight="semibold">{author.name}</Text>
                                <Text color="fg.muted" fontSize="sm">
                                  {t("booksCount", {
                                    count: author._count.books,
                                  })}
                                </Text>
                                {(author.gender || author.nationalities.length > 0) && (
                                  <Text color="fg.muted" fontSize="sm">
                                    {[
                                      author.gender?.name,
                                      author.nationalities
                                        .map((entry) => entry.nationality.name)
                                        .join(", "),
                                    ]
                                      .filter(Boolean)
                                      .join(" • ")}
                                  </Text>
                                )}
                              </Box>
                              <FiArrowRight color="var(--chakra-colors-fg-muted)" />
                            </Flex>
                          </Card.Body>
                        </Link>
                      </Card.Root>
                    ))}
                </Stack>
              ))}
            </Stack>
            {/* Pagination */}
            {totalPages > 1 && (
              <Flex justify="center">
                <PaginationRoot
                  count={totalAuthors}
                  pageSize={pageSize}
                  page={page}
                  onPageChange={(e) => setPage(e.page)}
                >
                  <PaginationPrevTrigger />
                  <PaginationItems />
                  <PaginationNextTrigger />
                  <PaginationPageText />
                </PaginationRoot>
              </Flex>
            )}
          </Stack>
        )}
      </Stack>

      <CreateAuthorDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onCreated={() => {
          fetchAuthors();
        }}
      />
    </Container>
  );
}

