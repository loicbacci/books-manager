"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import NextLink from "next/link";
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
} from "@chakra-ui/react";
import {
  SelectRoot,
  SelectTrigger,
  SelectValueText,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { createListCollection } from "@chakra-ui/react";
import { GroupToggle } from "@/components/ui/group-toggle";

type Author = {
  id: string;
  name: string;
  gender: { id: string; name: string } | null;
  nationality: { id: string; name: string } | null;
  _count: { books: number };
};

export default function AuthorsPage() {
  const t = useTranslations("author");
  const tCommon = useTranslations("common");
  const tNav = useTranslations("nav");

  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
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

  const fetchAuthors = async () => {
    try {
      const response = await fetch("/api/authors");
      if (response.ok) {
        setAuthors(await response.json());
      }
    } catch (error) {
      console.error("Failed to fetch authors:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuthors();
  }, []);

  const genders = Array.from(
    new Set(authors.map((author) => author.gender?.name).filter(Boolean))
  ) as string[];
  const nationalities = Array.from(
    new Set(authors.map((author) => author.nationality?.name).filter(Boolean))
  ) as string[];

  const genderCollection = createListCollection({
    items: [
      { value: "all", label: t("filterAll") },
      ...genders.map((gender) => ({ value: gender, label: gender })),
    ],
  });

  const nationalityCollection = createListCollection({
    items: [
      { value: "all", label: t("filterAll") },
      ...nationalities.map((nat) => ({ value: nat, label: nat })),
    ],
  });

  const sortCollection = createListCollection({
    items: [
      { value: "name-asc", label: t("sortNameAsc") },
      { value: "name-desc", label: t("sortNameDesc") },
      { value: "count-desc", label: t("sortBooksDesc") },
      { value: "count-asc", label: t("sortBooksAsc") },
    ],
  });

  const groupCollection = createListCollection({
    items: [
      { value: "none", label: t("groupNone") },
      { value: "gender", label: t("groupGender") },
      { value: "nationality", label: t("groupNationality") },
    ],
  });

  const filteredAuthors = authors.filter((author) => {
    const query = search.trim().toLowerCase();
    if (query && !author.name.toLowerCase().includes(query)) return false;
    if (genderFilter !== "all" && author.gender?.name !== genderFilter)
      return false;
    if (
      nationalityFilter !== "all" &&
      author.nationality?.name !== nationalityFilter
    )
      return false;
    return true;
  });

  const sortedAuthors = [...filteredAuthors].sort((a, b) => {
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

  const groupedAuthors = (() => {
    if (groupBy === "none") {
      return [{ key: "all", label: "", authors: sortedAuthors }];
    }

    const groups = new Map<string, { label: string; authors: Author[] }>();
    const unknownGender = t("unknownGender");
    const unknownNationality = t("unknownNationality");

    for (const author of sortedAuthors) {
      const label =
        groupBy === "gender"
          ? author.gender?.name || unknownGender
          : author.nationality?.name || unknownNationality;
      if (!groups.has(label)) {
        groups.set(label, { label, authors: [] });
      }
      groups.get(label)!.authors.push(author);
    }

    return Array.from(groups.entries())
      .map(([key, value]) => ({
        key,
        label: value.label,
        authors: value.authors,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  })();

  const toggleGroup = (key: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const response = await fetch("/api/authors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (response.ok) {
        setName("");
        await fetchAuthors();
      }
    } catch (error) {
      console.error("Failed to create author:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container maxW="container.lg" py={8}>
      <Stack gap={6}>
        <Heading as="h1" size="2xl">
          {tNav("authors")}
        </Heading>

        <Card.Root>
          <Card.Body>
            <Stack gap={3}>
              <Text fontWeight="semibold">{t("createTitle")}</Text>
              <Flex gap={3} wrap="wrap">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("namePlaceholder")}
                  maxW="400px"
                />
                <Button
                  colorPalette="brand"
                  onClick={handleCreate}
                  loading={saving}
                  loadingText={tCommon("loading")}
                >
                  {t("create")}
                </Button>
              </Flex>
            </Stack>
          </Card.Body>
        </Card.Root>

        <Flex gap={4} wrap="wrap" align="center">
          <Input
            placeholder={tCommon("search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            maxW="300px"
          />
          <Flex align="center" gap={2}>
            <Text fontSize="sm" color="fg.muted">
              {t("sortingLabel")}
            </Text>
            <SelectRoot
              collection={sortCollection}
              value={[sort]}
              onValueChange={(e) => setSort(e.value[0] as typeof sort)}
              width="220px"
            >
              <SelectTrigger>
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
          <Flex align="center" gap={2}>
            <Text fontSize="sm" color="fg.muted">
              {t("groupingLabel")}
            </Text>
            <SelectRoot
              collection={groupCollection}
              value={[groupBy]}
              onValueChange={(e) => setGroupBy(e.value[0] as typeof groupBy)}
              width="220px"
            >
              <SelectTrigger>
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
          <Flex align="center" gap={2}>
            <Text fontSize="sm" color="fg.muted">
              {t("filteringLabel")}
            </Text>
            <PopoverRoot positioning={{ placement: "bottom-start" }}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
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
                      collection={genderCollection}
                      value={[genderFilter]}
                      onValueChange={(e) =>
                        setGenderFilter(e.value[0] || "all")
                      }
                    >
                      <SelectTrigger>
                        <SelectValueText placeholder={t("filterGender")} />
                      </SelectTrigger>
                      <SelectContent>
                        {genderCollection.items.map((item) => (
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
                      collection={nationalityCollection}
                      value={[nationalityFilter]}
                      onValueChange={(e) =>
                        setNationalityFilter(e.value[0] || "all")
                      }
                    >
                      <SelectTrigger>
                        <SelectValueText placeholder={t("filterNationality")} />
                      </SelectTrigger>
                      <SelectContent>
                        {nationalityCollection.items.map((item) => (
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

        {loading ? (
          <Text color="fg.muted">{tCommon("loading")}</Text>
        ) : groupedAuthors.length === 0 ||
          groupedAuthors[0]?.authors.length === 0 ? (
          <Card.Root>
            <Card.Body>
              <Stack align="center" py={10}>
                <Text fontSize="4xl">🖋️</Text>
                <Text color="fg.muted">{t("empty")}</Text>
              </Stack>
            </Card.Body>
          </Card.Root>
        ) : (
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
                      <NextLink href={`/authors/${author.id}`}>
                        <Card.Body>
                          <Flex justify="space-between" align="center" gap={4}>
                            <Box>
                              <Text fontWeight="semibold">{author.name}</Text>
                              <Text color="fg.muted" fontSize="sm">
                                {t("booksCount", {
                                  count: author._count.books,
                                })}
                              </Text>
                              {(author.gender || author.nationality) && (
                                <Text color="fg.muted" fontSize="sm">
                                  {[
                                    author.gender?.name,
                                    author.nationality?.name,
                                  ]
                                    .filter(Boolean)
                                    .join(" • ")}
                                </Text>
                              )}
                            </Box>
                            <Text color="fg.muted">→</Text>
                          </Flex>
                        </Card.Body>
                      </NextLink>
                    </Card.Root>
                  ))}
              </Stack>
            ))}
          </Stack>
        )}
      </Stack>
    </Container>
  );
}
