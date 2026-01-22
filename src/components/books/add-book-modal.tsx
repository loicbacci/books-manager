"use client";

import { useState, useEffect } from "react";
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
} from "@chakra-ui/react";
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
import { BookSearchModal, type SearchResult } from "./book-search-modal";
import { AuthorSelect } from "./author-select";
import { SeriesSelect } from "./series-select";

type Author = {
  id: string;
  name: string;
  gender?: { id: string; name: string } | null;
  nationality?: { id: string; name: string } | null;
};
type Genre = { id: string; name: string; color: string | null };
type Format = { id: string; name: string };
type Series = { id: string; name: string };
type Gender = { id: string; name: string };
type Nationality = { id: string; name: string };

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
const statusOptions = [
  { value: "TO_READ", label: "To Read" },
  { value: "READING", label: "Reading" },
  { value: "READ", label: "Read" },
  { value: "DROPPED", label: "Dropped" },
];

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

  const [loading, setLoading] = useState(false);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [_genres, setGenres] = useState<Genre[]>([]);
  const [formats, setFormats] = useState<Format[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [genders, setGenders] = useState<Gender[]>([]);
  const [nationalities, setNationalities] = useState<Nationality[]>([]);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isAuthorsLoading, setIsAuthorsLoading] = useState(false);
  const [isSeriesLoading, setIsSeriesLoading] = useState(false);

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
    authorIds: [] as string[],
    genreIds: [] as string[],
  });

  useEffect(() => {
    if (isOpen) {
      setIsAuthorsLoading(true);
      setIsSeriesLoading(true);
      // Load reference data needed by select controls.
      Promise.all([
        fetch("/api/authors").then((r) => r.json()),
        fetch("/api/genres").then((r) => r.json()),
        fetch("/api/formats").then((r) => r.json()),
        fetch("/api/series").then((r) => r.json()),
        fetch("/api/genders").then((r) => r.json()),
        fetch("/api/nationalities").then((r) => r.json()),
      ])
        .then(
          ([
            authorsData,
            genresData,
            formatsData,
            seriesData,
            gendersData,
            nationalitiesData,
          ]) => {
            setAuthors(authorsData);
            setGenres(genresData);
            setFormats(formatsData);
            setSeries(seriesData);
            setGenders(gendersData);
            setNationalities(nationalitiesData);
          }
        )
        .catch((error) => {
          console.error("Failed to load metadata:", error);
        })
        .finally(() => {
          setIsAuthorsLoading(false);
          setIsSeriesLoading(false);
        });
    }
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

  const statusCollection = createListCollection({
    items: statusOptions.map((opt) => ({
      value: opt.value,
      label: tStatus(
        opt.value === "TO_READ"
          ? "toRead"
          : opt.value === "READING"
            ? "reading"
            : opt.value === "READ"
              ? "read"
              : "dropped"
      ),
    })),
  });

  const formatCollection = createListCollection({
    items: formats.map((f) => ({ value: f.id, label: f.name })),
  });

  /**
   * Fill in fields from the external book search modal.
   */
  const handleBookSelect = (book: SearchResult) => {
    setFormData({
      ...formData,
      title: book.title,
      coverUrl: book.coverUrl || "",
      totalPages: book.totalPages?.toString() || "",
      summary: book.description || formData.summary,
    });
  };

  return (
    <>
      <BookSearchModal
        open={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSelect={handleBookSelect}
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
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsSearchModalOpen(true)}
                  >
                    🔍 {t("searchOnline")}
                  </Button>
                </Flex>

                <Field.Root required>
                  <Field.Label>{t("title")}</Field.Label>
                  <Input
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="Enter book title"
                    bg={{ base: "white", _dark: "bg.muted" }}
                  />
                </Field.Root>

                <Field.Root>
                  <Field.Label>{t("cover")} URL</Field.Label>
                  <Input
                    value={formData.coverUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, coverUrl: e.target.value })
                    }
                    placeholder="https://..."
                    bg={{ base: "white", _dark: "bg.muted" }}
                  />
                </Field.Root>

                <Box borderTopWidth="1px" borderColor="border.muted" />

                <Field.Root>
                  <Field.Label>{t("authors")}</Field.Label>
                  <AuthorSelect
                    authors={authors}
                    genders={genders}
                    nationalities={nationalities}
                    value={formData.authorIds[0] ?? null}
                    onChange={(authorId) =>
                      setFormData({
                        ...formData,
                        authorIds: authorId ? [authorId] : [],
                      })
                    }
                    onAuthorCreated={(created) =>
                      setAuthors((prev) =>
                        [...prev, created].sort((a, b) =>
                          a.name.localeCompare(b.name)
                        )
                      )
                    }
                    placeholder={t("authors")}
                    isLoading={isAuthorsLoading}
                    triggerProps={{
                      bg: { base: "white", _dark: "bg.muted" },
                    }}
                    inputProps={{
                      bg: { base: "white", _dark: "bg.muted" },
                    }}
                  />
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
                      <SelectTrigger bg={{ base: "white", _dark: "bg.muted" }}>
                        <SelectValueText placeholder="Select status" />
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
                        <SelectTrigger bg={{ base: "white", _dark: "bg.muted" }}>
                          <SelectValueText placeholder="Select format" />
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
                        bg: { base: "white", _dark: "bg.muted" },
                      }}
                      inputProps={{
                        bg: { base: "white", _dark: "bg.muted" },
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
                      bg={{ base: "white", _dark: "bg.muted" }}
                    />
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
                      placeholder="e.g., 350"
                      bg={{ base: "white", _dark: "bg.muted" }}
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
                      bg={{ base: "white", _dark: "bg.muted" }}
                    />
                  </Field.Root>

                  <Field.Root flex={1}>
                    <Field.Label>{t("rating")} (1-5)</Field.Label>
                    <Input
                      type="number"
                      min={1}
                      max={5}
                      value={formData.rating}
                      onChange={(e) =>
                        setFormData({ ...formData, rating: e.target.value })
                      }
                      placeholder="1-5"
                      bg={{ base: "white", _dark: "bg.muted" }}
                    />
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
                    placeholder="Your thoughts about the book..."
                    rows={3}
                    bg={{ base: "white", _dark: "bg.muted" }}
                  />
                </Field.Root>

                <Box borderTopWidth="1px" borderColor="border.muted" />

                <Field.Root>
                  <Flex align="center" gap={2}>
                    <input
                      type="checkbox"
                      id="isWishlist"
                      checked={formData.isWishlist}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          isWishlist: e.target.checked,
                        })
                      }
                    />
                    <label htmlFor="isWishlist">{t("wishlist")}</label>
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
