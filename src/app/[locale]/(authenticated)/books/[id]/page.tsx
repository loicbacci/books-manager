"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import NextLink from "next/link";
import { GoStarFill } from "react-icons/go";
import { FiArrowLeft } from "react-icons/fi";
import {
  Box,
  Container,
  Grid,
  Heading,
  Text,
  Stack,
  Card,
  Flex,
  Button,
  Link as ChakraLink,
  Input,
  Textarea,
  Spinner,
  Field,
  Badge,
  createListCollection,
} from "@chakra-ui/react";
import { Tag } from "@/components/ui/tag";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatusBadge } from "@/components/ui/status-badge";
import { BookCover } from "@/components/ui/book-cover";
import { resolvePalette } from "@/lib/color-palettes";
import { SeriesSelect } from "@/components/books/series-select";
import { AuthorSelect } from "@/components/books/author-select";
import {
  ComboboxRoot,
  ComboboxControl,
  ComboboxInput,
  ComboboxContent,
  ComboboxItem,
  ComboboxItemText,
} from "@/components/ui/combobox";
import {
  SelectRoot,
  SelectTrigger,
  SelectValueText,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
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
  BookSearchModal,
  type SearchResult,
} from "@/components/books/book-search-modal";
import { CreateGenreDialog } from "@/components/genres/create-genre-dialog";
import { CreateAuthorDialog } from "@/components/authors/create-author-dialog";
import { toaster } from "@/components/ui/toaster";
import type { PageResult } from "@/types/pagination";

type Book = {
  id: string;
  title: string;
  coverUrl: string | null;
  status: string;
  currentPage: number;
  totalPages: number | null;
  rating: number | null;
  summary: string | null;
  favoriteQuote: string | null;
  favoriteMoment: string | null;
  startDate: string | null;
  endDate: string | null;
  isWishlist: boolean;
  seriesId: string | null;
  seriesOrder: number | null;
  series: { id: string; name: string; slug: string } | null;
  authors: Array<{
    author: {
      id: string;
      name: string;
      gender: { id: string; name: string } | null;
      nationalities: Array<{ nationality: { id: string; name: string } }>;
    };
  }>;
  genres: Array<{ genre: { id: string; name: string; color: string | null } }>;
  format: { id: string; name: string } | null;
};

type Format = { id: string; name: string };
type Series = { id: string; name: string };
type Genre = { id: string; name: string; color: string | null };
type Author = {
  id: string;
  name: string;
  gender?: { id: string; name: string } | null;
  nationalities?: Array<{ nationality: { id: string; name: string } }>;
};

export default function BookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const t = useTranslations("book");
  const tAuthor = useTranslations("author");
  const tStatus = useTranslations("status");
  const tCommon = useTranslations("common");
  const tSettings = useTranslations("settings");
  const locale = useLocale();

  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [_formats, setFormats] = useState<Format[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [isSeriesLoading, setIsSeriesLoading] = useState(false);
  const [isAuthorsLoading, setIsAuthorsLoading] = useState(false);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [editGenreIds, setEditGenreIds] = useState<string[]>([]);
  const [genreQuery, setGenreQuery] = useState("");
  const [isCreateGenreOpen, setIsCreateGenreOpen] = useState(false);
  const [editData, setEditData] = useState<Partial<Book>>({});
  const [editAuthorIds, setEditAuthorIds] = useState<string[]>([]);
  const [isCreateAuthorOpen, setIsCreateAuthorOpen] = useState(false);

  useEffect(() => {
    async function fetchBook() {
      setIsAuthorsLoading(true);
      setIsSeriesLoading(true);
      try {
        const [
          bookRes,
          formatsRes,
          seriesRes,
          genresRes,
          authorsRes,
        ] = await Promise.all([
          fetch(`/api/books/${id}`),
          fetch("/api/formats"),
          fetch("/api/series?page=1&pageSize=200"),
          fetch("/api/genres"),
          fetch("/api/authors?page=1&pageSize=200"),
        ]);

        if (bookRes.ok) {
          const bookData = await bookRes.json();
          setBook(bookData);
          setEditData(bookData);
          setEditAuthorIds(
            bookData.authors.map((entry: { author: { id: string } }) => entry.author.id)
          );
          setEditGenreIds(
            bookData.genres.map(
              (g: { genre: { id: string } }) => g.genre.id
            )
          );
        } else if (bookRes.status === 404) {
          router.push("/library");
        }

        if (formatsRes.ok) {
          const formatsData = await formatsRes.json();
          setFormats(formatsData);
        }

        if (seriesRes.ok) {
          const seriesData = await seriesRes.json();
          const seriesItems = Array.isArray(seriesData)
            ? seriesData
            : (seriesData as PageResult<Series>).items;
          setSeries(seriesItems ?? []);
        }

        if (authorsRes.ok) {
          const authorsData = await authorsRes.json();
          const authorItems = Array.isArray(authorsData)
            ? authorsData
            : (authorsData as PageResult<Author>).items;
          setAuthors(authorItems ?? []);
        }

        if (genresRes.ok) {
          const genresData = await genresRes.json();
          setGenres(genresData);
        }
      } catch (error) {
        console.error("Failed to fetch book:", error);
      } finally {
        setIsSeriesLoading(false);
        setIsAuthorsLoading(false);
        setLoading(false);
      }
    }
    fetchBook();
  }, [id, router]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const normalizedStartDate = editData.startDate
        ? new Date(editData.startDate).toISOString()
        : null;
      let normalizedEndDate = editData.endDate
        ? new Date(editData.endDate).toISOString()
        : null;
      const totalPages = editData.totalPages ?? book?.totalPages ?? null;
      const shouldMaxPages = !!normalizedEndDate && !!totalPages;
      const shouldForceRead = shouldMaxPages || editData.status === "READ";

      if (shouldForceRead && !normalizedEndDate) {
        normalizedEndDate = new Date().toISOString();
      }

      const response = await fetch(`/api/books/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editData.title,
          coverUrl: editData.coverUrl,
          status: shouldForceRead ? "READ" : editData.status,
          totalPages: editData.totalPages,
          currentPage: shouldMaxPages ? totalPages : editData.currentPage,
          rating: editData.rating,
          summary: editData.summary,
          favoriteQuote: editData.favoriteQuote,
          favoriteMoment: editData.favoriteMoment,
          isWishlist: editData.isWishlist,
          seriesId: editData.seriesId || null,
          seriesOrder: editData.seriesOrder ?? null,
          startDate: normalizedStartDate,
          endDate: normalizedEndDate,
          authorIds: editAuthorIds,
          genreIds: editGenreIds,
        }),
      });

      if (response.ok) {
        const updatedBook = await response.json();
        setBook(updatedBook);
        setEditData(updatedBook);
        setEditAuthorIds(
          updatedBook.authors.map((entry: { author: { id: string } }) => entry.author.id)
        );
        setEditGenreIds(
          updatedBook.genres.map(
            (g: { genre: { id: string } }) => g.genre.id
          )
        );
        setIsEditing(false);
        toaster.create({ title: tCommon("changesSaved"), type: "success" });
      } else {
        toaster.create({ title: tCommon("saveFailed"), type: "error" });
      }
    } catch (error) {
      console.error("Failed to save book:", error);
      toaster.create({ title: tCommon("saveFailed"), type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/books/${id}`, { method: "DELETE" });
      if (response.ok) {
        toaster.create({ title: tCommon("deleteSuccess"), type: "success" });
        router.push("/library");
      } else {
        toaster.create({ title: tCommon("deleteFailed"), type: "error" });
      }
    } catch (error) {
      console.error("Failed to delete book:", error);
      toaster.create({ title: tCommon("deleteFailed"), type: "error" });
    }
  };

  const handleProgressUpdate = async (newPage: number) => {
    try {
      const hasTotalPages = !!book?.totalPages;
      const isComplete = hasTotalPages && newPage === book?.totalPages;
      const shouldClearEndDate =
        hasTotalPages &&
        newPage < (book?.totalPages || 0) &&
        book?.status === "READ";

      const response = await fetch(`/api/books/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPage: newPage,
          status: isComplete
            ? "READ"
            : shouldClearEndDate
              ? "READING"
              : undefined,
          endDate: isComplete
            ? new Date().toISOString()
            : shouldClearEndDate
              ? null
              : undefined,
        }),
      });

      if (response.ok) {
        const updatedBook = await response.json();
        setBook(updatedBook);
        setEditData(updatedBook);
      }
    } catch (error) {
      console.error("Failed to update progress:", error);
    }
  };

  // Loading state
  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <Flex justify="center" align="center" minH="400px">
          <Spinner size="xl" color="brand.500" />
        </Flex>
      </Container>
    );
  }

  if (!book) {
    return null;
  }

  const formatInputDate = (value: string | null) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 10);
  };

  const formatRelative = (value: string | null) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    const diffMs = date.getTime() - Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const diffDays = Math.round(diffMs / dayMs);
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

    const absDays = Math.abs(diffDays);
    if (absDays >= 365) {
      return rtf.format(Math.round(diffDays / 365), "year");
    }
    if (absDays >= 30) {
      return rtf.format(Math.round(diffDays / 30), "month");
    }
    if (absDays >= 7) {
      return rtf.format(Math.round(diffDays / 7), "week");
    }
    return rtf.format(diffDays, "day");
  };

  const progress = book.totalPages
    ? Math.round((book.currentPage / book.totalPages) * 100)
    : 0;

  const statusCollection = createListCollection({
    items: [
      { value: "TO_READ", label: tStatus("toRead") },
      { value: "READING", label: tStatus("reading") },
      { value: "READ", label: tStatus("read") },
      { value: "DROPPED", label: tStatus("dropped") },
    ],
  });

  const paletteForGenre = (name: string, storedColor: string | null) => {
    return resolvePalette(name, storedColor);
  };

  const filteredGenres = genres.filter((genre) =>
    genre.name.toLowerCase().includes(genreQuery.trim().toLowerCase())
  );
  const genreCollection = createListCollection({
    items: filteredGenres.map((genre) => ({
      value: genre.id,
      label: genre.name,
    })),
  });
  const selectedGenres = genres.filter((genre) =>
    editGenreIds.includes(genre.id)
  );

  const handleBookSelect = (searchBook: SearchResult) => {
    setEditData({
      ...editData,
      title: searchBook.title,
      coverUrl: searchBook.coverUrl || editData.coverUrl,
      totalPages: searchBook.totalPages || editData.totalPages,
      summary: searchBook.description || editData.summary,
    });
  };

  // Create search query from book title and authors for pre-filling search modal
  const searchQuery = book
    ? `${book.title} ${book.authors.map((a) => a.author.name).join(" ")}`
    : "";

  return (
    <>
      {/* External book search modal */}
      <BookSearchModal
        open={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSelect={handleBookSelect}
        initialQuery={searchQuery}
      />
      <CreateGenreDialog
        open={isCreateGenreOpen}
        onOpenChange={setIsCreateGenreOpen}
        onCreated={(created) => {
          setGenres((prev) =>
            [...prev, created].sort((a, b) => a.name.localeCompare(b.name))
          );
          setEditGenreIds((prev) =>
            Array.from(new Set([...prev, created.id]))
          );
        }}
      />
      <CreateAuthorDialog
        open={isCreateAuthorOpen}
        onOpenChange={setIsCreateAuthorOpen}
        onCreated={(created) => {
          setAuthors((prev) =>
            [...prev, created].sort((a, b) => a.name.localeCompare(b.name))
          );
          setEditAuthorIds((prev) =>
            Array.from(new Set([...prev, created.id]))
          );
        }}
      />
      <Container maxW="container.xl" py={8}>
        <Stack gap={6}>
          {/* Header */}
          <Flex justify="space-between" align="flex-start" wrap="wrap" gap={4}>
            <Button variant="ghost" onClick={() => router.push("/library")}>
              <FiArrowLeft /> {tCommon("back")}
            </Button>
            <Flex gap={2}>
              {isEditing ? (
                <>
                  <Button variant="ghost" onClick={() => setIsEditing(false)}>
                    {tCommon("cancel")}
                  </Button>
                  <Button
                    colorPalette="brand"
                    onClick={handleSave}
                    loading={saving}
                  >
                    {tCommon("save")}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditData(book);
                      setEditAuthorIds(
                        book.authors.map((entry) => entry.author.id)
                      );
                      setIsEditing(true);
                    }}
                  >
                    {tCommon("edit")}
                  </Button>
                  <Button
                    colorPalette="red"
                    variant="outline"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    {tCommon("delete")}
                  </Button>
                </>
              )}
            </Flex>
          </Flex>

          {/* Main Content */}
          <Grid templateColumns={{ base: "1fr", md: "250px 1fr" }} gap={8}>
            {/* Cover */}
            <Box>
              <Box boxShadow="lg" borderRadius="lg" overflow="hidden">
                <BookCover
                  coverUrl={book.coverUrl}
                  title={book.title}
                  size="lg"
                />
              </Box>
              {book.isWishlist && (
                <Badge colorPalette="yellow" mt={2}>
                  ⭐ {t("wishlist")}
                </Badge>
              )}
            </Box>

            {/* Details */}
            <Stack gap={6}>
              {isEditing && (
                <Flex
                  p={3}
                  bg="bg.muted"
                  borderRadius="md"
                  align="center"
                  justify="space-between"
                >
                  <Text fontSize="sm" color="fg.muted">
                    {t("addManually")}
                  </Text>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsSearchModalOpen(true)}
                  >
                    🔍 {t("searchOnline")}
                  </Button>
                </Flex>
              )}

              {isEditing ? (
                <>
                  <Field.Root>
                  <Field.Label>{t("title")}</Field.Label>
                  <Input
                    value={editData.title || ""}
                    onChange={(e) =>
                      setEditData({ ...editData, title: e.target.value })
                    }
                    size="lg"
                  />
                  </Field.Root>

                  <Field.Root>
                  <Field.Label>{t("cover")} URL</Field.Label>
                  <Input
                    value={editData.coverUrl || ""}
                    onChange={(e) =>
                      setEditData({ ...editData, coverUrl: e.target.value })
                    }
                    placeholder={t("coverUrlPlaceholder")}
                  />
                  </Field.Root>
                </>
              ) : (
                <Stack gap={2}>
                  <Heading as="h1" size="2xl">
                    {book.title}
                  </Heading>
                  {(book.series || isEditing) && (
                    <Flex gap={3} align="center" wrap="wrap">
                      {book.series && (
                        <Card.Root
                          asChild
                          transition="background-color 0.2s ease"
                          _hover={{ bg: "bg.muted" }}
                        >
                          <NextLink href={`/series/${book.series.slug}`}>
                            <Card.Body py={2} px={3}>
                              <Flex align="center" gap={3}>
                                <Text fontWeight="semibold">
                                  {book.series.name}
                                </Text>
                                {book.seriesOrder !== null && (
                                  <Badge variant="subtle" colorPalette="blue">
                                    {t("seriesOrderBadge", {
                                      order: book.seriesOrder,
                                    })}
                                  </Badge>
                                )}
                              </Flex>
                            </Card.Body>
                          </NextLink>
                        </Card.Root>
                      )}
                    </Flex>
                  )}
                </Stack>
              )}

              <Flex gap={2} wrap="wrap" align="center">
                {isEditing ? (
                  <SelectRoot
                    collection={statusCollection}
                    value={[editData.status || book.status]}
                    onValueChange={(e) =>
                      setEditData({ ...editData, status: e.value[0] })
                    }
                    width="200px"
                  >
                    <SelectTrigger>
                      <SelectValueText placeholder={t("statusPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {statusCollection.items.map((item) => (
                        <SelectItem key={item.value} item={item}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </SelectRoot>
                ) : (
                  <StatusBadge status={book.status} size="lg" />
                )}
                {book.format && (
                  <Badge colorPalette="purple" size="lg">
                    {book.format.name}
                  </Badge>
                )}
              </Flex>

              {isEditing ? (
                <Field.Root>
                  <Field.Label>{t("authors")}</Field.Label>
                  <AuthorSelect
                    authors={authors}
                    value={editAuthorIds}
                    onChange={setEditAuthorIds}
                    placeholder={t("authors")}
                    isLoading={isAuthorsLoading}
                    onOpenCreateDialog={() => setIsCreateAuthorOpen(true)}
                  />
                </Field.Root>
              ) : (
                <Flex direction="column" gap={2}>
                  {book.authors.length > 0 ? (
                    book.authors.map(({ author }) => {
                      const gender =
                        author.gender?.name || tAuthor("unknownGender");
                      const nationalityLabel =
                        author.nationalities && author.nationalities.length > 0
                          ? author.nationalities
                              .map((entry) => entry.nationality.name)
                              .join(", ")
                          : tAuthor("unknownNationality");

                      return (
                        <Flex key={author.id} align="center" gap={2} wrap="wrap">
                          <ChakraLink variant="underline" asChild>
                            <NextLink href={`/authors/${author.id}`}>
                              {author.name}
                            </NextLink>
                          </ChakraLink>
                          <Text color="fg.muted" fontSize="sm">
                            ({gender} · {nationalityLabel})
                          </Text>
                        </Flex>
                      );
                    })
                  ) : (
                    <Text color="fg.muted" fontSize="lg">
                      {t("groupUnknownAuthor")}
                    </Text>
                  )}
                </Flex>
              )}

              {isEditing && (
                <Flex gap={3} align="center" wrap="wrap">
                  <Box minW="240px" flex={1}>
                    <SeriesSelect
                      series={series}
                      value={editData.seriesId || null}
                      onChange={(seriesId) =>
                        setEditData({
                          ...editData,
                          seriesId,
                        })
                      }
                      onSeriesCreated={(created) =>
                        setSeries((prev) =>
                          [...prev, created].sort((a, b) =>
                            a.name.localeCompare(b.name)
                          )
                        )
                      }
                      isLoading={isSeriesLoading}
                      placeholder={t("seriesPlaceholder")}
                    />
                  </Box>
                  <Input
                    type="number"
                    min={0}
                    step="0.1"
                    value={editData.seriesOrder ?? ""}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        seriesOrder: e.target.value
                          ? parseFloat(e.target.value)
                          : null,
                      })
                    }
                    width="120px"
                    placeholder={t("seriesOrderPlaceholder")}
                  />
                </Flex>
              )}

              {isEditing ? (
                <Field.Root>
                  <Field.Label>{t("genres")}</Field.Label>
                  <ComboboxRoot
                    collection={genreCollection}
                    value={editGenreIds}
                    multiple
                    selectionBehavior="clear"
                    closeOnSelect={false}
                    inputValue={genreQuery}
                    onValueChange={(details) => setEditGenreIds(details.value)}
                    onInputValueChange={(details) =>
                      setGenreQuery(details.inputValue)
                    }
                  >
                    <ComboboxControl clearable>
                      <ComboboxInput placeholder={t("genresPlaceholder")} />
                    </ComboboxControl>
                    <ComboboxContent>
                      {genreCollection.items.map((item) => (
                        <ComboboxItem key={item.value} item={item}>
                          <ComboboxItemText>{item.label}</ComboboxItemText>
                        </ComboboxItem>
                      ))}
                    </ComboboxContent>
                  </ComboboxRoot>
                  {selectedGenres.length > 0 && (
                    <Flex wrap="wrap" gap={2} mt={2}>
                      {selectedGenres.map((genre) => (
                        <Tag
                          key={genre.id}
                          size="sm"
                          colorPalette={paletteForGenre(
                            genre.name,
                            genre.color
                          )}
                          closable
                          onClose={() =>
                            setEditGenreIds((prev) =>
                              prev.filter((id) => id !== genre.id)
                            )
                          }
                        >
                          {genre.name}
                        </Tag>
                      ))}
                    </Flex>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    width="fit-content"
                    mt={2}
                    onClick={() => setIsCreateGenreOpen(true)}
                  >
                    {tSettings("addGenre")}
                  </Button>
                </Field.Root>
              ) : (
                book.genres.length > 0 && (
                  <Flex gap={2} wrap="wrap">
                    {book.genres.map(({ genre }) => (
                      <Badge
                        key={genre.id}
                        colorPalette={paletteForGenre(genre.name, genre.color)}
                        variant="subtle"
                      >
                        {genre.name}
                      </Badge>
                    ))}
                  </Flex>
                )
              )}

              {/* Progress Section */}
              {book.totalPages && (
                <Card.Root>
                  <Card.Body>
                    <Stack gap={4}>
                      <Flex justify="space-between" align="center">
                        <Text fontWeight="semibold">{t("progress")}</Text>
                        <Text fontWeight="bold" color="brand.fg">
                          {progress}%
                        </Text>
                      </Flex>
                      <ProgressBar value={progress} colorScheme="brand" />
                      <Flex justify="space-between" align="center" gap={4}>
                        <Text color="fg.muted">
                          {book.currentPage} / {book.totalPages} {t("pages")}
                        </Text>
                        <Flex gap={2} align="center">
                          <Input
                            type="number"
                            min={0}
                            max={book.totalPages}
                            value={book.currentPage}
                            onChange={(e) => {
                              const newPage = Math.min(
                                parseInt(e.target.value) || 0,
                                book.totalPages || 0
                              );
                              handleProgressUpdate(newPage);
                            }}
                            width="100px"
                            size="sm"
                          />
                        </Flex>
                      </Flex>
                    </Stack>
                  </Card.Body>
                </Card.Root>
              )}

              {/* Rating */}
              <Card.Root>
                <Card.Body>
                  <Flex justify="space-between" align="center">
                    <Text fontWeight="semibold">{t("rating")}</Text>
                    {isEditing ? (
                      <Input
                        type="number"
                        min={1}
                        max={5}
                        value={editData.rating || ""}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            rating: parseInt(e.target.value) || null,
                          })
                        }
                        width="80px"
                      />
                    ) : book.rating !== null ? (
                      <Flex gap={1}>
                        {Array.from({ length: 5 }).map((_, index) => {
                          const rating = book.rating ?? 0;
                          return (
                            <GoStarFill
                              key={index}
                              size={22}
                              color={
                                index < rating
                                  ? "var(--chakra-colors-yellow-400)"
                                  : "var(--chakra-colors-gray-300)"
                              }
                              style={{ stroke: "black", strokeWidth: 1.75 }}
                            />
                          );
                        })}
                      </Flex>
                    ) : (
                      <Text color="fg.muted">{t("notRated")}</Text>
                    )}
                  </Flex>
                </Card.Body>
              </Card.Root>

              <Card.Root>
                <Card.Body>
                  <Grid
                    templateColumns={{ base: "1fr", md: "1fr 1fr" }}
                    gap={6}
                  >
                    <Stack gap={3}>
                      <Text fontWeight="semibold">{t("startDate")}</Text>
                      {isEditing ? (
                        <Input
                          type="date"
                          value={formatInputDate(
                            editData.startDate ?? book.startDate
                          )}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              startDate: e.target.value
                                ? new Date(e.target.value).toISOString()
                                : null,
                            })
                          }
                        />
                      ) : book.startDate ? (
                        <Text color="fg.muted">
                          {new Date(book.startDate).toLocaleDateString()}{" "}
                          {formatRelative(book.startDate) && (
                            <Text as="span">
                              ({formatRelative(book.startDate)})
                            </Text>
                          )}
                        </Text>
                      ) : (
                        <Text color="fg.muted">{t("startDateMissing")}</Text>
                      )}
                    </Stack>
                    <Stack gap={3}>
                      <Text fontWeight="semibold">{t("endDate")}</Text>
                      {isEditing ? (
                        <Input
                          type="date"
                          value={formatInputDate(
                            editData.endDate ?? book.endDate
                          )}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              endDate: e.target.value
                                ? new Date(e.target.value).toISOString()
                                : null,
                            })
                          }
                        />
                      ) : book.endDate ? (
                        <Text color="fg.muted">
                          {new Date(book.endDate).toLocaleDateString()}{" "}
                          {formatRelative(book.endDate) && (
                            <Text as="span">
                              ({formatRelative(book.endDate)})
                            </Text>
                          )}
                        </Text>
                      ) : (
                        <Text color="fg.muted">{t("endDateNotFinished")}</Text>
                      )}
                    </Stack>
                  </Grid>
                </Card.Body>
              </Card.Root>

              {/* Summary */}
              {(book.summary || isEditing) && (
                <Card.Root>
                  <Card.Body>
                    <Stack gap={2}>
                      <Text fontWeight="semibold">{t("summary")}</Text>
                      {isEditing ? (
                        <Textarea
                          value={editData.summary || ""}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              summary: e.target.value,
                            })
                          }
                          rows={4}
                        />
                      ) : (
                        <Text color="fg.muted" whiteSpace="pre-wrap">
                          {book.summary}
                        </Text>
                      )}
                    </Stack>
                  </Card.Body>
                </Card.Root>
              )}

              {/* Favorite Quote */}
              {(book.favoriteQuote || isEditing) && (
                <Card.Root>
                  <Card.Body>
                    <Stack gap={2}>
                      <Text fontWeight="semibold">{t("favoriteQuote")}</Text>
                      {isEditing ? (
                        <Textarea
                          value={editData.favoriteQuote || ""}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              favoriteQuote: e.target.value,
                            })
                          }
                          rows={2}
                        />
                      ) : (
                        <Text fontStyle="italic" color="fg.muted">
                          &ldquo;{book.favoriteQuote}&rdquo;
                        </Text>
                      )}
                    </Stack>
                  </Card.Body>
                </Card.Root>
              )}

              {/* Favorite Moment */}
              {(book.favoriteMoment || isEditing) && (
                <Card.Root>
                  <Card.Body>
                    <Stack gap={2}>
                      <Text fontWeight="semibold">{t("favoriteMoment")}</Text>
                      {isEditing ? (
                        <Textarea
                          value={editData.favoriteMoment || ""}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              favoriteMoment: e.target.value,
                            })
                          }
                          rows={2}
                        />
                      ) : (
                        <Text color="fg.muted" whiteSpace="pre-wrap">
                          {book.favoriteMoment}
                        </Text>
                      )}
                    </Stack>
                  </Card.Body>
                </Card.Root>
              )}
            </Stack>
          </Grid>
        </Stack>

        {/* Delete Confirmation Dialog */}
        <DialogRoot
          open={showDeleteDialog}
          onOpenChange={(e) => setShowDeleteDialog(e.open)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("deleteBook")}</DialogTitle>
              <DialogCloseTrigger />
            </DialogHeader>
            <DialogBody>
              <Text>{t("deleteConfirm")}</Text>
            </DialogBody>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setShowDeleteDialog(false)}
              >
                {tCommon("cancel")}
              </Button>
              <Button colorPalette="red" onClick={handleDelete}>
                {tCommon("delete")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </DialogRoot>
      </Container>
    </>
  );
}

