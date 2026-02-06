"use client";

import { useMemo, useState, useEffect } from "react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import {
  Box,
  Button,
  Input,
  Stack,
  Textarea,
  Field,
  Flex,
  createListCollection,
  Text,
  HStack,
  Icon,
} from "@chakra-ui/react";
import { FiFileText, FiSearch } from "react-icons/fi";
import { Tag } from "@/components/ui/tag";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  ComboboxRoot,
  ComboboxControl,
  ComboboxInput,
  ComboboxContent,
  ComboboxItem,
  ComboboxItemText,
} from "@/components/ui/combobox";
import { CreateGenreDialog } from "@/components/genres/create-genre-dialog";
import { CreateAuthorDialog } from "@/components/authors/create-author-dialog";
import { BookSearchModal, type SearchResult } from "./book-search-modal";
import { AuthorSelect } from "./author-select";
import { SeriesSelect } from "./series-select";
import { resolvePalette } from "@/lib/color-palettes";
import type { PageResult } from "@/types/pagination";

type Author = {
  id: string;
  name: string;
  gender?: { id: string; name: string } | null;
  nationalities?: Array<{ nationality: { id: string; name: string } }>;
};
type Genre = { id: string; name: string; color: string | null };
type Format = { id: string; name: string };
type Series = { id: string; name: string };

/**
 * Props for the AddBookModal dialog.
 *
 * `onSuccess` is called after the server confirms creation so the parent
 * can refresh lists.
 */
type AddBookModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

/**
 * Static status values; labels are localized at render time.
 */
const statusOptions = ["TO_READ", "READING", "READ", "DROPPED"] as const;

/**
 * Dialog for creating a new book, with optional metadata lookup
 * and inline creation of related entities (authors/series).
 */
export function AddBookModal({
  isOpen,
  onClose,
  onSuccess,
}: AddBookModalProps) {
  const t = useTranslations("book");
  const tStatus = useTranslations("status");
  const tCommon = useTranslations("common");
  const tSettings = useTranslations("settings");

  const [loading, setLoading] = useState(false);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [formats, setFormats] = useState<Format[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isCreateAuthorOpen, setIsCreateAuthorOpen] = useState(false);
  const [isCreateGenreOpen, setIsCreateGenreOpen] = useState(false);
  const [isAuthorsLoading, setIsAuthorsLoading] = useState(false);
  const [isSeriesLoading, setIsSeriesLoading] = useState(false);
  const [genreQuery, setGenreQuery] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    coverUrl: "",
    status: "TO_READ",
    totalPages: "",
    currentPage: "0",
    rating: "",
    summary: "",
    favoriteQuote: "",
    favoriteMoment: "",
    isWishlist: false,
    formatId: "",
    seriesId: "",
    seriesOrder: "",
    startDate: "",
    endDate: "",
    authorIds: [] as string[],
    genreIds: [] as string[],
  });

  useEffect(() => {
    if (isOpen) {
      const controller = new AbortController();
      let isActive = true;
      setIsAuthorsLoading(true);
      setIsSeriesLoading(true);
      // Load reference data needed by select controls.
      Promise.all([
        fetch("/api/authors?page=1&pageSize=200", {
          signal: controller.signal,
        }).then((r) => r.json()),
        fetch("/api/genres", { signal: controller.signal }).then((r) =>
          r.json()
        ),
        fetch("/api/formats", { signal: controller.signal }).then((r) =>
          r.json()
        ),
        fetch("/api/series?page=1&pageSize=200", {
          signal: controller.signal,
        }).then((r) => r.json()),
      ])
        .then(
          ([
            authorsData,
            genresData,
            formatsData,
            seriesData,
          ]) => {
            if (!isActive) return;
            const authorsItems = Array.isArray(authorsData)
              ? authorsData
              : (authorsData as PageResult<Author>).items;
            const seriesItems = Array.isArray(seriesData)
              ? seriesData
              : (seriesData as PageResult<Series>).items;
            setAuthors(authorsItems ?? []);
            setGenres(genresData);
            setFormats(formatsData);
            setSeries(seriesItems ?? []);
          }
        )
        .catch((error) => {
          if (error instanceof DOMException && error.name === "AbortError") {
            return;
          }
          console.error("Failed to load metadata:", error);
        })
        .finally(() => {
          if (!isActive) return;
          setIsAuthorsLoading(false);
          setIsSeriesLoading(false);
        });
      return () => {
        isActive = false;
        controller.abort();
      };
    }
    return undefined;
  }, [isOpen]);

  /**
   * Submit the form to the API, then reset state and notify the parent.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        title: formData.title,
        coverUrl: formData.coverUrl || null,
        status: formData.status,
        totalPages: formData.totalPages ? parseInt(formData.totalPages) : null,
        currentPage: parseInt(formData.currentPage) || 0,
        rating: formData.rating ? parseInt(formData.rating) : null,
        summary: formData.summary || null,
        favoriteQuote: formData.favoriteQuote || null,
        favoriteMoment: formData.favoriteMoment || null,
        isWishlist: formData.isWishlist,
        formatId: formData.formatId || null,
        seriesId: formData.seriesId || null,
        seriesOrder: formData.seriesOrder
          ? parseFloat(formData.seriesOrder)
          : null,
        startDate: formData.startDate
          ? new Date(formData.startDate).toISOString()
          : null,
        endDate: formData.endDate
          ? new Date(formData.endDate).toISOString()
          : null,
        authorIds: formData.authorIds,
        genreIds: formData.genreIds,
      };

      const response = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        // Reset the form so the next open starts clean.
        setFormData({
          title: "",
          coverUrl: "",
          status: "TO_READ",
          totalPages: "",
          currentPage: "0",
          rating: "",
          summary: "",
          favoriteQuote: "",
          favoriteMoment: "",
          isWishlist: false,
          formatId: "",
          seriesId: "",
          seriesOrder: "",
          startDate: "",
          endDate: "",
          authorIds: [],
          genreIds: [],
        });
        onSuccess();
      }
    } catch (error) {
      console.error("Failed to create book:", error);
    } finally {
      setLoading(false);
    }
  };

  const statusCollection = useMemo(
    () =>
      createListCollection({
        items: statusOptions.map((value) => ({
          value,
          label: tStatus(
            value === "TO_READ"
              ? "toRead"
              : value === "READING"
                ? "reading"
                : value === "READ"
                  ? "read"
                  : "dropped"
          ),
        })),
      }),
    [tStatus]
  );

  const formatCollection = useMemo(
    () =>
      createListCollection({
        items: formats.map((f) => ({ value: f.id, label: f.name })),
      }),
    [formats]
  );
  const ratingCollection = useMemo(
    () =>
      createListCollection({
        items: Array.from({ length: 5 }, (_, index) => {
          const value = String(index + 1);
          const label = "★".repeat(index + 1);
          return { value, label };
        }),
      }),
    []
  );

  const filteredGenres = useMemo(() => {
    const query = genreQuery.trim().toLowerCase();
    return genres.filter((genre) => genre.name.toLowerCase().includes(query));
  }, [genreQuery, genres]);
  const genreCollection = useMemo(
    () =>
      createListCollection({
        items: filteredGenres.map((genre) => ({
          value: genre.id,
          label: genre.name,
          color: genre.color ?? null,
        })),
      }),
    [filteredGenres]
  );
  const selectedGenres = useMemo(
    () => genres.filter((genre) => formData.genreIds.includes(genre.id)),
    [formData.genreIds, genres]
  );

  const paletteForGenre = (name: string, storedColor: string | null) => {
    return resolvePalette(name, storedColor);
  };

  /**
   * Fill in fields from the external book search modal.
   */
  const handleBookSelect = (book: SearchResult) => {
    setFormData((prev) => ({
      ...prev,
      title: book.title,
      coverUrl: book.coverUrl || "",
      totalPages: book.totalPages?.toString() || "",
      summary: book.description || prev.summary,
    }));
  };

  return (
    <>
      <BookSearchModal
        open={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSelect={handleBookSelect}
        initialQuery={`${formData.title} ${authors
          .filter((author) => formData.authorIds.includes(author.id))
          .map((author) => author.name)
          .join(" ")}`.trim()}
      />
      <CreateAuthorDialog
        open={isCreateAuthorOpen}
        onOpenChange={setIsCreateAuthorOpen}
        onCreated={(created) => {
          setAuthors((prev) =>
            [...prev, created].sort((a, b) => a.name.localeCompare(b.name))
          );
          setFormData((prev) => ({
            ...prev,
            authorIds: Array.from(new Set([...prev.authorIds, created.id])),
          }));
        }}
      />
      <CreateGenreDialog
        open={isCreateGenreOpen}
        onOpenChange={setIsCreateGenreOpen}
        onCreated={(created) => {
          setGenres((prev) =>
            [...prev, created].sort((a, b) => a.name.localeCompare(b.name))
          );
          setFormData((prev) => ({
            ...prev,
            genreIds: Array.from(new Set([...prev.genreIds, created.id])),
          }));
        }}
      />
      <DialogRoot open={isOpen} onOpenChange={(e) => !e.open && onClose()}>
        <DialogContent maxW="lg">
          <DialogHeader>
            <DialogTitle>{t("addBook")}</DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <DialogBody>
              <Stack gap={4}>
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
                  <Flex gap={2} wrap="wrap" justify="flex-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsSearchModalOpen(true)}
                    >
                      <HStack gap={2}>
                        <Icon as={FiSearch} />
                        <Text as="span">{t("searchOnline")}</Text>
                      </HStack>
                    </Button>
                    <Button size="sm" variant="ghost" asChild>
                      <Link href="/sheet-import">
                        <HStack gap={2}>
                          <Icon as={FiFileText} />
                          <Text as="span">{t("importFromSheet")}</Text>
                        </HStack>
                      </Link>
                    </Button>
                  </Flex>
                </Flex>

                <Field.Root required>
                  <Field.Label>{t("title")}</Field.Label>
                  <Input
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder={t("titlePlaceholder")}
                  />
                </Field.Root>

                <Field.Root>
                  <Field.Label>{t("cover")} URL</Field.Label>
                  <Input
                    value={formData.coverUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, coverUrl: e.target.value })
                    }
                    placeholder={t("coverUrlPlaceholder")}
                  />
                </Field.Root>

                <Box borderTopWidth="1px" borderColor="border.muted" />

                <Field.Root>
                  <Field.Label>{t("authors")}</Field.Label>
                    <AuthorSelect
                      authors={authors}
                      value={formData.authorIds}
                    onChange={(authorIds) =>
                      setFormData({
                        ...formData,
                        authorIds,
                      })
                    }
                    placeholder={t("authors")}
                    isLoading={isAuthorsLoading}
                    onOpenCreateDialog={() => setIsCreateAuthorOpen(true)}
                    triggerProps={{
                      bg: "bg.input",
                    }}
                  />
                </Field.Root>

                <Box borderTopWidth="1px" borderColor="border.muted" />

                <Field.Root>
                  <Field.Label>{t("genres")}</Field.Label>
                  <ComboboxRoot
                    collection={genreCollection}
                    value={formData.genreIds}
                    multiple
                    selectionBehavior="clear"
                    closeOnSelect={false}
                    inputValue={genreQuery}
                    onValueChange={(e) =>
                      setFormData({ ...formData, genreIds: e.value })
                    }
                    onInputValueChange={(e) => setGenreQuery(e.inputValue)}
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
                            setFormData((prev) => ({
                              ...prev,
                              genreIds: prev.genreIds.filter(
                                (id) => id !== genre.id
                              ),
                            }))
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

                <Box borderTopWidth="1px" borderColor="border.muted" />

                <Flex gap={4}>
                  <Field.Root flex={1}>
                    <Field.Label>{t("status")}</Field.Label>
                    <SelectRoot
                      collection={statusCollection}
                      value={[formData.status]}
                      onValueChange={(e) =>
                        setFormData({ ...formData, status: e.value[0] })
                      }
                    >
                      <SelectTrigger bg="bg.input">
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
                  </Field.Root>

                  {formats.length > 0 && (
                    <Field.Root flex={1}>
                      <Field.Label>{t("format")}</Field.Label>
                      <SelectRoot
                        collection={formatCollection}
                        value={formData.formatId ? [formData.formatId] : []}
                        onValueChange={(e) =>
                          setFormData({
                            ...formData,
                            formatId: e.value[0] || "",
                          })
                        }
                      >
                      <SelectTrigger bg="bg.input">
                        <SelectValueText placeholder={t("formatPlaceholder")} />
                      </SelectTrigger>
                        <SelectContent>
                          {formatCollection.items.map((item) => (
                            <SelectItem key={item.value} item={item}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </SelectRoot>
                    </Field.Root>
                  )}
                </Flex>

                <Box borderTopWidth="1px" borderColor="border.muted" />

                <Flex gap={4}>
                  <Field.Root flex={1}>
                    <Field.Label>{t("series")}</Field.Label>
                    <SeriesSelect
                      series={series}
                      value={formData.seriesId || null}
                      onChange={(seriesId) =>
                        setFormData({
                          ...formData,
                          seriesId: seriesId || "",
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
                      triggerProps={{
                        bg: "bg.input",
                      }}
                      inputProps={{
                        bg: "bg.input",
                      }}
                    />
                  </Field.Root>

                  <Field.Root flex={1}>
                    <Field.Label>{t("seriesOrder")}</Field.Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.1"
                      value={formData.seriesOrder}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          seriesOrder: e.target.value,
                        })
                      }
                      placeholder={t("seriesOrderPlaceholder")}
                    />
                  </Field.Root>
                </Flex>

                <Box borderTopWidth="1px" borderColor="border.muted" />

                <Flex gap={4} direction={{ base: "column", md: "row" }}>
                  <Field.Root flex={1}>
                    <Field.Label>{t("startDate")}</Field.Label>
                    <Input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          startDate: e.target.value,
                        })
                      }
                    />
                    {formData.startDate && (
                      <Button
                        variant="ghost"
                        size="xs"
                        mt={2}
                        onClick={() =>
                          setFormData({ ...formData, startDate: "" })
                        }
                      >
                        {tCommon("clear")}
                      </Button>
                    )}
                  </Field.Root>
                  <Field.Root flex={1}>
                    <Field.Label>{t("endDate")}</Field.Label>
                    <Input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          endDate: e.target.value,
                        })
                      }
                    />
                    {formData.endDate && (
                      <Button
                        variant="ghost"
                        size="xs"
                        mt={2}
                        onClick={() =>
                          setFormData({ ...formData, endDate: "" })
                        }
                      >
                        {tCommon("clear")}
                      </Button>
                    )}
                  </Field.Root>
                </Flex>

                <Box borderTopWidth="1px" borderColor="border.muted" />

                <Flex gap={4}>
                  <Field.Root flex={1}>
                    <Field.Label>{t("totalPages")}</Field.Label>
                    <Input
                      type="number"
                      min={1}
                      value={formData.totalPages}
                      onChange={(e) =>
                        setFormData({ ...formData, totalPages: e.target.value })
                      }
                      placeholder={t("totalPagesPlaceholder")}
                    />
                  </Field.Root>

                  <Field.Root flex={1}>
                    <Field.Label>{t("currentPage")}</Field.Label>
                    <Input
                      type="number"
                      min={0}
                      value={formData.currentPage}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          currentPage: e.target.value,
                        })
                      }
                      placeholder="0"
                    />
                  </Field.Root>

                  <Field.Root flex={1}>
                    <Field.Label>{t("rating")} (1-5)</Field.Label>
                    <SelectRoot
                      collection={ratingCollection}
                      value={formData.rating ? [formData.rating] : []}
                      onValueChange={(e) =>
                        setFormData({
                          ...formData,
                          rating: e.value[0] || "",
                        })
                      }
                    >
                      <SelectTrigger bg="bg.input">
                        <SelectValueText placeholder={t("notRated")} />
                      </SelectTrigger>
                      <SelectContent>
                        {ratingCollection.items.map((item) => (
                          <SelectItem key={item.value} item={item}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </SelectRoot>
                  </Field.Root>
                </Flex>

                <Box borderTopWidth="1px" borderColor="border.muted" />

                <Field.Root>
                  <Field.Label>{t("summary")}</Field.Label>
                  <Textarea
                    value={formData.summary}
                    onChange={(e) =>
                      setFormData({ ...formData, summary: e.target.value })
                    }
                    placeholder={t("summaryPlaceholder")}
                    rows={3}
                    bg="bg.input"
                  />
                </Field.Root>

                <Box borderTopWidth="1px" borderColor="border.muted" />

                <Field.Root>
                  <Flex align="center" gap={2}>
                    <Checkbox
                      checked={formData.isWishlist}
                      onCheckedChange={(details) =>
                        setFormData({
                          ...formData,
                          isWishlist: Boolean(details.checked),
                        })
                      }
                    >
                      {t("wishlist")}
                    </Checkbox>
                  </Flex>
                </Field.Root>
              </Stack>
            </DialogBody>
            <DialogFooter>
              <Button variant="ghost" onClick={onClose}>
                {tCommon("cancel")}
              </Button>
              <Button
                type="submit"
                colorPalette="brand"
                loading={loading}
                loadingText={tCommon("loading")}
              >
                {tCommon("add")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </DialogRoot>
    </>
  );
}


