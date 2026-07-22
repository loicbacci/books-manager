"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  RiArrowRightSLine,
  RiFilterLine,
  RiQuillPenLine,
} from "@remixicon/react";

import { CreateAuthorDialog } from "@/components/authors/create-author-dialog";
import { GroupToggle } from "@/components/ui/group-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPageText,
  PaginationPrevTrigger,
  PaginationRoot,
} from "@/components/ui/pagination";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
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

  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
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
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalAuthors, setTotalAuthors] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 50;

  const fetchAuthors = useCallback(
    async (signal?: AbortSignal) => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(pageSize),
        });
        if (search.trim()) {
          params.set("query", search.trim());
        }
        const response = await fetch(`/api/authors?${params.toString()}`, {
          signal,
        });
        if (response.ok) {
          const data = (await response.json()) as PageResult<Author>;
          setAuthors(data.items);
          setTotalAuthors(data.total);
          setTotalPages(data.totalPages);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        console.error("Failed to fetch authors:", error);
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [page, pageSize, search]
  );

  useEffect(() => {
    const handle = window.setTimeout(() => {
      if (searchDraft === search) return;
      setSearch(searchDraft);
      setPage(1);
    }, 300);
    return () => window.clearTimeout(handle);
  }, [searchDraft, search]);

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

  const sortItems = useMemo(
    () => [
      { value: "name-asc", label: t("sortNameAsc") },
      { value: "name-desc", label: t("sortNameDesc") },
      { value: "count-desc", label: t("sortBooksDesc") },
      { value: "count-asc", label: t("sortBooksAsc") },
    ],
    [t]
  );

  const groupItems = useMemo(
    () => [
      { value: "none", label: t("groupNone") },
      { value: "gender", label: t("groupGender") },
      { value: "nationality", label: t("groupNationality") },
    ],
    [t]
  );

  const genderFilterItems = useMemo(
    () => [
      { value: "all", label: t("filterAll") },
      ...genderNames.map((gender) => ({ value: gender, label: gender })),
    ],
    [genderNames, t]
  );

  const nationalityFilterItems = useMemo(
    () => [
      { value: "all", label: t("filterAll") },
      ...nationalityNames.map((nat) => ({ value: nat, label: nat })),
    ],
    [nationalityNames, t]
  );

  const filteredAuthors = useMemo(() => {
    return authors.filter((author) => {
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
  }, [authors, genderFilter, nationalityFilter]);

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
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-end gap-4">
        <Button type="button" onClick={() => setIsCreateOpen(true)}>
          {t("create")}
        </Button>
      </div>

      <div className="space-y-4">
        <Input
          type="search"
          aria-label={tCommon("search")}
          placeholder={tCommon("search")}
          value={searchDraft}
          onChange={(e) => setSearchDraft(e.target.value)}
          className="max-w-[300px]"
        />

        <Card>
          <CardContent className="space-y-4">
            <Button
              type="button"
              variant="outline"
              className="inline-flex w-full md:hidden"
              onClick={() => setAreControlsOpen((prev) => !prev)}
            >
              <span>{t("filtersButton")}</span>
              <RiFilterLine />
            </Button>

            <div
              className={cn(
                areControlsOpen ? "block" : "hidden",
                "md:block"
              )}
            >
              <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-center">
                <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
                  <span className="text-sm text-muted-foreground">
                    {t("sortingLabel")}
                  </span>
                  <Select
                    items={sortItems}
                    value={sort}
                    onValueChange={(value) =>
                      setSort(value as typeof sort)
                    }
                  >
                    <SelectTrigger className="w-full md:w-[220px]">
                      <SelectValue placeholder={tCommon("sort")} />
                    </SelectTrigger>
                    <SelectContent>
                      {sortItems.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
                  <span className="text-sm text-muted-foreground">
                    {t("groupingLabel")}
                  </span>
                  <Select
                    items={groupItems}
                    value={groupBy}
                    onValueChange={(value) =>
                      setGroupBy(value as typeof groupBy)
                    }
                  >
                    <SelectTrigger className="w-full md:w-[220px]">
                      <SelectValue placeholder={t("groupBy")} />
                    </SelectTrigger>
                    <SelectContent>
                      {groupItems.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
                  <span className="text-sm text-muted-foreground">
                    {t("filteringLabel")}
                  </span>
                  <Popover open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                    <PopoverTrigger
                      render={
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full md:w-auto"
                        />
                      }
                    >
                      {t("filtersButton")}
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-64 space-y-3">
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          {t("filterGender")}
                        </p>
                        <Select
                          items={genderFilterItems}
                          value={genderFilter}
                          onValueChange={(value) =>
                            setGenderFilter(value || "all")
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={t("filterGender")} />
                          </SelectTrigger>
                          <SelectContent>
                            {genderFilterItems.map((item) => (
                              <SelectItem key={item.value} value={item.value}>
                                {item.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          {t("filterNationality")}
                        </p>
                        <Select
                          items={nationalityFilterItems}
                          value={nationalityFilter}
                          onValueChange={(value) =>
                            setNationalityFilter(value || "all")
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue
                              placeholder={t("filterNationality")}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {nationalityFilterItems.map((item) => (
                              <SelectItem key={item.value} value={item.value}>
                                {item.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <p className="text-muted-foreground">{tCommon("loading")}</p>
      ) : groupedAuthors.length === 0 ||
        groupedAuthors[0]?.authors.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10">
            <RiQuillPenLine className="size-8 text-muted-foreground" />
            <p className="text-muted-foreground">{t("empty")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="space-y-3">
            {groupedAuthors.map((group) => (
              <div key={group.key} className="space-y-2">
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
                    <Link
                      key={author.id}
                      href={`/authors/${author.id}`}
                      className="block"
                    >
                      <Card className="transition-colors hover:bg-muted/40">
                        <CardContent className="flex items-center justify-between gap-4">
                          <div className="min-w-0 space-y-0.5">
                            <p className="font-semibold">{author.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {t("booksCount", {
                                count: author._count.books,
                              })}
                            </p>
                            {(author.gender ||
                              author.nationalities.length > 0) && (
                              <p className="text-sm text-muted-foreground">
                                {[
                                  author.gender?.name,
                                  author.nationalities
                                    .map((entry) => entry.nationality.name)
                                    .join(", "),
                                ]
                                  .filter(Boolean)
                                  .join(" • ")}
                              </p>
                            )}
                          </div>
                          <RiArrowRightSLine className="size-5 shrink-0 text-muted-foreground" />
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              <PaginationRoot
                count={totalAuthors}
                pageSize={pageSize}
                page={page}
                onPageChange={(e) => setPage(e.page)}
              >
                <PaginationPrevTrigger />
                <PaginationPageText className="px-1" />
                <PaginationItems />
                <PaginationNextTrigger />
              </PaginationRoot>
            </div>
          )}
        </div>
      )}

      <CreateAuthorDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onCreated={() => {
          fetchAuthors();
        }}
      />
    </div>
  );
}
