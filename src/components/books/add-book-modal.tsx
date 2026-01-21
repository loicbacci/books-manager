"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
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

type Author = { id: string; name: string };
type Genre = { id: string; name: string; color: string | null };
type Format = { id: string; name: string };
type Series = { id: string; name: string };

type AddBookModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

const statusOptions = [
  { value: "TO_READ", label: "To Read" },
  { value: "READING", label: "Reading" },
  { value: "READ", label: "Read" },
  { value: "DROPPED", label: "Dropped" },
];

export function AddBookModal({
  isOpen,
  onClose,
  onSuccess,
}: AddBookModalProps) {
  const t = useTranslations("book");
  const tStatus = useTranslations("status");
  const tCommon = useTranslations("common");

  const [loading, setLoading] = useState(false);
  const [_authors, setAuthors] = useState<Author[]>([]);
  const [_genres, setGenres] = useState<Genre[]>([]);
  const [formats, setFormats] = useState<Format[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

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
      Promise.all([
        fetch("/api/authors").then((r) => r.json()),
        fetch("/api/genres").then((r) => r.json()),
        fetch("/api/formats").then((r) => r.json()),
        fetch("/api/series").then((r) => r.json()),
      ]).then(([authorsData, genresData, formatsData, seriesData]) => {
        setAuthors(authorsData);
        setGenres(genresData);
        setFormats(formatsData);
        setSeries(seriesData);
      });
    }
  }, [isOpen]);

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

  const seriesCollection = createListCollection({
    items: series.map((item) => ({ value: item.id, label: item.name })),
  });

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
                  />
                </Field.Root>

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
                      <SelectTrigger>
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
                        <SelectTrigger>
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

                <Flex gap={4}>
                  {series.length > 0 && (
                    <Field.Root flex={1}>
                      <Field.Label>{t("series")}</Field.Label>
                      <SelectRoot
                        collection={seriesCollection}
                        value={formData.seriesId ? [formData.seriesId] : []}
                        onValueChange={(e) =>
                          setFormData({
                            ...formData,
                            seriesId: e.value[0] || "",
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValueText
                            placeholder={t("seriesPlaceholder")}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {seriesCollection.items.map((item) => (
                            <SelectItem key={item.value} item={item}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </SelectRoot>
                    </Field.Root>
                  )}

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
                    <Input
                      type="number"
                      min={1}
                      max={5}
                      value={formData.rating}
                      onChange={(e) =>
                        setFormData({ ...formData, rating: e.target.value })
                      }
                      placeholder="1-5"
                    />
                  </Field.Root>
                </Flex>

                <Field.Root>
                  <Field.Label>{t("summary")}</Field.Label>
                  <Textarea
                    value={formData.summary}
                    onChange={(e) =>
                      setFormData({ ...formData, summary: e.target.value })
                    }
                    placeholder="Your thoughts about the book..."
                    rows={3}
                  />
                </Field.Root>

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
