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
import { FiArrowRight } from "react-icons/fi";
import { MdFilterList } from "react-icons/md";
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogCloseTrigger,
} from "@/components/ui/dialog";
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
  const tSettings = useTranslations("settings");
  const tNav = useTranslations("nav");

  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [genders, setGenders] = useState<Array<{ id: string; name: string }>>(
    []
  );
  const [nationalities, setNationalities] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [genderId, setGenderId] = useState("none");
  const [nationalityId, setNationalityId] = useState("none");
  const [isMetaLoading, setIsMetaLoading] = useState(false);
  const [isAddingGender, setIsAddingGender] = useState(false);
  const [newGenderName, setNewGenderName] = useState("");
  const [isAddingNationality, setIsAddingNationality] = useState(false);
  const [newNationalityName, setNewNationalityName] = useState("");
  const [savingGender, setSavingGender] = useState(false);
  const [savingNationality, setSavingNationality] = useState(false);
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
  const controlBg = { base: "white", _dark: "bg.subtle" };
  const controlBorder = { base: "border.default", _dark: "border.default" };
  const cardBg = { base: "bg.panel", _dark: "bg.card" };

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

  useEffect(() => {
    if (!isCreateOpen) return;
    setIsMetaLoading(true);
    Promise.all([
      fetch("/api/genders").then((r) => r.json()),
      fetch("/api/nationalities").then((r) => r.json()),
    ])
      .then(([gendersData, nationalitiesData]) => {
        setGenders(gendersData);
        setNationalities(nationalitiesData);
      })
      .catch((error) => {
        console.error("Failed to fetch metadata:", error);
      })
      .finally(() => setIsMetaLoading(false));
  }, [isCreateOpen]);

  const genderNames = Array.from(
    new Set(authors.map((author) => author.gender?.name).filter(Boolean))
  ) as string[];
  const nationalityNames = Array.from(
    new Set(authors.map((author) => author.nationality?.name).filter(Boolean))
  ) as string[];

  const genderFilterCollection = createListCollection({
    items: [
      { value: "all", label: t("filterAll") },
      ...genderNames.map((gender) => ({ value: gender, label: gender })),
    ],
  });

  const nationalityFilterCollection = createListCollection({
    items: [
      { value: "all", label: t("filterAll") },
      ...nationalityNames.map((nat) => ({ value: nat, label: nat })),
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

  const genderCollection = createListCollection({
    items: [
      { value: "none", label: t("unknownGender") },
      ...genders.map((gender) => ({ value: gender.id, label: gender.name })),
    ],
  });

  const nationalityCollection = createListCollection({
    items: [
      { value: "none", label: t("unknownNationality") },
      ...nationalities.map((nat) => ({ value: nat.id, label: nat.name })),
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
        body: JSON.stringify({
          name: name.trim(),
          genderId: genderId === "none" ? null : genderId,
          nationalityId: nationalityId === "none" ? null : nationalityId,
        }),
      });
      if (response.ok) {
        setName("");
        setGenderId("none");
        setNationalityId("none");
        await fetchAuthors();
        setIsCreateOpen(false);
      }
    } catch (error) {
      console.error("Failed to create author:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateGender = async () => {
    const trimmed = newGenderName.trim();
    if (!trimmed) return;
    setSavingGender(true);
    try {
      const response = await fetch("/api/genders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (response.ok) {
        const created = await response.json();
        setGenders((prev) =>
          [...prev, created].sort((a, b) => a.name.localeCompare(b.name))
        );
        setGenderId(created.id);
        setNewGenderName("");
        setIsAddingGender(false);
      }
    } catch (error) {
      console.error("Failed to create gender:", error);
    } finally {
      setSavingGender(false);
    }
  };

  const handleCreateNationality = async () => {
    const trimmed = newNationalityName.trim();
    if (!trimmed) return;
    setSavingNationality(true);
    try {
      const response = await fetch("/api/nationalities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (response.ok) {
        const created = await response.json();
        setNationalities((prev) =>
          [...prev, created].sort((a, b) => a.name.localeCompare(b.name))
        );
        setNationalityId(created.id);
        setNewNationalityName("");
        setIsAddingNationality(false);
      }
    } catch (error) {
      console.error("Failed to create nationality:", error);
    } finally {
      setSavingNationality(false);
    }
  };

  return (
    <Container maxW="container.lg" py={8}>
      <Stack gap={6}>
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

        <Stack gap={4}>
          <Input
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
                            <FiArrowRight color="var(--chakra-colors-fg-muted)" />
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

      <DialogRoot
        open={isCreateOpen}
        onOpenChange={(e) => !e.open && setIsCreateOpen(false)}
      >
        <DialogContent maxW="md">
          <DialogHeader>
            <DialogTitle>{t("createTitle")}</DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>
          <DialogBody>
            <Stack gap={3}>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("namePlaceholder")}
              />
              <Stack gap={2}>
                <Text fontSize="sm" color="fg.muted">
                  {t("gender")}
                </Text>
                <SelectRoot
                  collection={genderCollection}
                  value={[genderId]}
                  onValueChange={(e) => setGenderId(e.value[0] || "none")}
                >
                  <SelectTrigger>
                    <SelectValueText placeholder={t("gender")} />
                  </SelectTrigger>
                  <SelectContent>
                    {genderCollection.items.map((item) => (
                      <SelectItem key={item.value} item={item}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </SelectRoot>
                {isMetaLoading && (
                  <Text fontSize="sm" color="fg.muted">
                    {tCommon("loading")}
                  </Text>
                )}
                {!isAddingGender ? (
                  <Button
                    variant="outline"
                    size="sm"
                    width="fit-content"
                    onClick={() => setIsAddingGender(true)}
                  >
                    {tSettings("addGender")}
                  </Button>
                ) : (
                  <Flex gap={2} wrap="wrap">
                    <Input
                      value={newGenderName}
                      onChange={(e) => setNewGenderName(e.target.value)}
                      placeholder={tSettings("addGender")}
                      flex={1}
                      minW="200px"
                    />
                    <Button
                      size="sm"
                      colorPalette="brand"
                      onClick={handleCreateGender}
                      loading={savingGender}
                      loadingText={tCommon("loading")}
                    >
                      {tCommon("add")}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setIsAddingGender(false);
                        setNewGenderName("");
                      }}
                    >
                      {tCommon("cancel")}
                    </Button>
                  </Flex>
                )}
              </Stack>
              <Stack gap={2}>
                <Text fontSize="sm" color="fg.muted">
                  {t("nationality")}
                </Text>
                <SelectRoot
                  collection={nationalityCollection}
                  value={[nationalityId]}
                  onValueChange={(e) =>
                    setNationalityId(e.value[0] || "none")
                  }
                >
                  <SelectTrigger>
                    <SelectValueText placeholder={t("nationality")} />
                  </SelectTrigger>
                  <SelectContent>
                    {nationalityCollection.items.map((item) => (
                      <SelectItem key={item.value} item={item}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </SelectRoot>
                {isMetaLoading && (
                  <Text fontSize="sm" color="fg.muted">
                    {tCommon("loading")}
                  </Text>
                )}
                {!isAddingNationality ? (
                  <Button
                    variant="outline"
                    size="sm"
                    width="fit-content"
                    onClick={() => setIsAddingNationality(true)}
                  >
                    {tSettings("addNationality")}
                  </Button>
                ) : (
                  <Flex gap={2} wrap="wrap">
                    <Input
                      value={newNationalityName}
                      onChange={(e) => setNewNationalityName(e.target.value)}
                      placeholder={tSettings("addNationality")}
                      flex={1}
                      minW="200px"
                    />
                    <Button
                      size="sm"
                      colorPalette="brand"
                      onClick={handleCreateNationality}
                      loading={savingNationality}
                      loadingText={tCommon("loading")}
                    >
                      {tCommon("add")}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setIsAddingNationality(false);
                        setNewNationalityName("");
                      }}
                    >
                      {tCommon("cancel")}
                    </Button>
                  </Flex>
                )}
              </Stack>
            </Stack>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>
              {tCommon("cancel")}
            </Button>
            <Button
              colorPalette="brand"
              onClick={handleCreate}
              loading={saving}
              loadingText={tCommon("loading")}
            >
              {t("create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </Container>
  );
}
