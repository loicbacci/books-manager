"use client";

import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  RiArrowLeftLine,
  RiBookmarkFill,
  RiBookmarkLine,
  RiHeartFill,
  RiHeartLine,
  RiSearchLine,
} from "@remixicon/react";
import { toast } from "sonner";

import { CreateAuthorDialog } from "@/components/authors/create-author-dialog";
import { AuthorSelect } from "@/components/books/author-select";
import {
  BookSearchModal,
  type SearchResult,
} from "@/components/books/book-search-modal";
import { SeriesSelect } from "@/components/books/series-select";
import { StarRating } from "@/components/books/star-rating";
import { CreateGenreDialog } from "@/components/genres/create-genre-dialog";
import { useSetPageBreadcrumbs } from "@/components/layout/page-header-context";
import { Badge } from "@/components/ui/badge";
import { BookCover } from "@/components/ui/book-cover";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/ui/multi-select";
import { ProgressBar } from "@/components/ui/progress-bar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { Textarea } from "@/components/ui/textarea";
import { Link, useRouter } from "@/i18n/routing";
import { paletteBadgeClassName } from "@/lib/color-palettes";
import { cn } from "@/lib/utils";
import type { PageResult } from "@/types/pagination";

type Book = {
  id: string;
  slug?: string;
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
  formatId: string | null;
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

const statusOptions = ["TO_READ", "READING", "READ", "DROPPED"] as const;
const NO_FORMAT = "__none__";

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
  const tNav = useTranslations("nav");
  const locale = useLocale();

  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [formats, setFormats] = useState<Format[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [isSeriesLoading, setIsSeriesLoading] = useState(false);
  const [isAuthorsLoading, setIsAuthorsLoading] = useState(false);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [editGenreIds, setEditGenreIds] = useState<string[]>([]);
  const [isCreateGenreOpen, setIsCreateGenreOpen] = useState(false);
  const [editData, setEditData] = useState<Partial<Book>>({});
  const [editAuthorIds, setEditAuthorIds] = useState<string[]>([]);
  const [isCreateAuthorOpen, setIsCreateAuthorOpen] = useState(false);
  const [wishlistUpdating, setWishlistUpdating] = useState(false);
  const wishlistControllerRef = useRef<AbortController | null>(null);
  const [progressDraft, setProgressDraft] = useState<number | null>(null);
  const progressRequestIdRef = useRef(0);

  const pageBreadcrumbs = useMemo(
    () =>
      book
        ? [
            { label: tNav("library"), href: "/library" },
            { label: book.title },
          ]
        : null,
    [book, tNav]
  );
  useSetPageBreadcrumbs(pageBreadcrumbs);

  const isEditDirty = useMemo(() => {
    if (!book || !isEditing) return false;

    const authorIds = book.authors.map((entry) => entry.author.id).sort();
    const genreIds = book.genres.map((g) => g.genre.id).sort();
    const editAuthorIdsSorted = [...editAuthorIds].sort();
    const editGenreIdsSorted = [...editGenreIds].sort();

    if (editAuthorIdsSorted.join(",") !== authorIds.join(",")) return true;
    if (editGenreIdsSorted.join(",") !== genreIds.join(",")) return true;

    const fields: Array<keyof Book> = [
      "title",
      "coverUrl",
      "status",
      "currentPage",
      "totalPages",
      "rating",
      "summary",
      "favoriteQuote",
      "favoriteMoment",
      "startDate",
      "endDate",
      "isWishlist",
      "formatId",
      "seriesId",
      "seriesOrder",
    ];

    return fields.some((field) => {
      const original = book[field];
      const edited = editData[field];
      if (original === edited) return false;
      if (original == null && edited == null) return false;
      return String(original ?? "") !== String(edited ?? "");
    });
  }, [book, editAuthorIds, editData, editGenreIds, isEditing]);

  const confirmDiscardEdits = useCallback(() => {
    if (!isEditDirty) return true;
    return window.confirm(t("unsavedChanges"));
  }, [isEditDirty, t]);

  useEffect(() => {
    if (!isEditing || !isEditDirty) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isEditing, isEditDirty]);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;
    async function fetchBook() {
      setIsAuthorsLoading(true);
      setIsSeriesLoading(true);
      try {
        const [bookRes, formatsRes, seriesRes, genresRes, authorsRes] =
          await Promise.all([
            fetch(`/api/books/${id}`, { signal: controller.signal }),
            fetch("/api/formats", { signal: controller.signal }),
            fetch("/api/series?page=1&pageSize=200", {
              signal: controller.signal,
            }),
            fetch("/api/genres", { signal: controller.signal }),
            fetch("/api/authors?page=1&pageSize=200", {
              signal: controller.signal,
            }),
          ]);

        if (bookRes.ok) {
          const bookData = await bookRes.json();
          if (isActive) {
            setBook(bookData);
            setEditData(bookData);
            setEditAuthorIds(
              bookData.authors.map(
                (entry: { author: { id: string } }) => entry.author.id
              )
            );
            setEditGenreIds(
              bookData.genres.map((g: { genre: { id: string } }) => g.genre.id)
            );
          }
        } else if (bookRes.status === 404) {
          router.push("/library");
        }

        if (formatsRes.ok) {
          const formatsData = await formatsRes.json();
          if (isActive) {
            setFormats(formatsData);
          }
        }

        if (seriesRes.ok) {
          const seriesData = await seriesRes.json();
          const seriesItems = Array.isArray(seriesData)
            ? seriesData
            : (seriesData as PageResult<Series>).items;
          if (isActive) {
            setSeries(seriesItems ?? []);
          }
        }

        if (authorsRes.ok) {
          const authorsData = await authorsRes.json();
          const authorItems = Array.isArray(authorsData)
            ? authorsData
            : (authorsData as PageResult<Author>).items;
          if (isActive) {
            setAuthors(authorItems ?? []);
          }
        }

        if (genresRes.ok) {
          const genresData = await genresRes.json();
          if (isActive) {
            setGenres(genresData);
          }
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        console.error("Failed to fetch book:", error);
      } finally {
        if (isActive) {
          setIsSeriesLoading(false);
          setIsAuthorsLoading(false);
          setLoading(false);
        }
      }
    }
    fetchBook();
    return () => {
      isActive = false;
      controller.abort();
      wishlistControllerRef.current?.abort();
    };
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

      const formatId =
        editData.formatId !== undefined
          ? editData.formatId
          : (editData.format?.id ?? book?.formatId ?? book?.format?.id ?? null);

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
          formatId: formatId || null,
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
          updatedBook.authors.map(
            (entry: { author: { id: string } }) => entry.author.id
          )
        );
        setEditGenreIds(
          updatedBook.genres.map((g: { genre: { id: string } }) => g.genre.id)
        );
        setIsEditing(false);
        if (updatedBook.slug && updatedBook.slug !== id) {
          router.replace(`/books/${updatedBook.slug}`);
        }
        toast.success(tCommon("changesSaved"));
      } else {
        toast.error(tCommon("saveFailed"));
      }
    } catch (error) {
      console.error("Failed to save book:", error);
      toast.error(tCommon("saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/books/${id}`, { method: "DELETE" });
      if (response.ok) {
        toast.success(tCommon("deleteSuccess"));
        router.push("/library");
      } else {
        toast.error(tCommon("deleteFailed"));
      }
    } catch (error) {
      console.error("Failed to delete book:", error);
      toast.error(tCommon("deleteFailed"));
    }
  };

  const handleProgressUpdate = async (newPage: number) => {
    const requestId = ++progressRequestIdRef.current;
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
        if (requestId !== progressRequestIdRef.current) return;
        setBook(updatedBook);
        setEditData(updatedBook);
        setProgressDraft(null);
      }
    } catch (error) {
      console.error("Failed to update progress:", error);
    }
  };

  const commitProgressDraft = () => {
    if (!book || progressDraft === null) return;
    const clamped = Math.min(
      Math.max(0, progressDraft),
      book.totalPages || progressDraft
    );
    if (clamped === book.currentPage) {
      setProgressDraft(null);
      return;
    }
    void handleProgressUpdate(clamped);
  };

  const handleToggleWishlist = async () => {
    if (!book || wishlistUpdating) return;

    const next = !book.isWishlist;
    setBook((prev) => (prev ? { ...prev, isWishlist: next } : prev));
    setEditData((prev) => ({ ...prev, isWishlist: next }));
    setWishlistUpdating(true);

    wishlistControllerRef.current?.abort();
    const controller = new AbortController();
    wishlistControllerRef.current = controller;

    try {
      const response = await fetch(`/api/books/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isWishlist: next }),
        signal: controller.signal,
      });

      if (response.ok) {
        const updatedBook = await response.json();
        setBook(updatedBook);
        setEditData(updatedBook);
        toast.success(
          next ? t("addedToWishlist") : t("removedFromWishlist")
        );
      } else {
        setBook((prev) =>
          prev ? { ...prev, isWishlist: !next } : prev
        );
        setEditData((prev) => ({ ...prev, isWishlist: !next }));
        toast.error(tCommon("saveFailed"));
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      console.error("Failed to update wishlist:", error);
      setBook((prev) => (prev ? { ...prev, isWishlist: !next } : prev));
      setEditData((prev) => ({ ...prev, isWishlist: !next }));
      toast.error(tCommon("saveFailed"));
    } finally {
      setWishlistUpdating(false);
    }
  };

  const beginEditing = () => {
    if (!book) return;
    setEditData(book);
    setEditAuthorIds(book.authors.map((entry) => entry.author.id));
    setEditGenreIds(book.genres.map((g) => g.genre.id));
    setIsEditing(true);
  };

  const cancelEditing = () => {
    if (!book) return;
    if (!confirmDiscardEdits()) return;
    setEditData(book);
    setEditAuthorIds(book.authors.map((entry) => entry.author.id));
    setEditGenreIds(book.genres.map((g) => g.genre.id));
    setIsEditing(false);
  };

  const navigateToLibrary = () => {
    if (isEditing && !confirmDiscardEdits()) return;
    router.push("/library");
  };

  const statusItems = useMemo(
    () =>
      statusOptions.map((value) => ({
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
    [tStatus]
  );

  const formatItems = useMemo(
    () => [
      { value: NO_FORMAT, label: tCommon("none") },
      ...formats.map((f) => ({ value: f.id, label: f.name })),
    ],
    [formats, tCommon]
  );

  const genreOptions = useMemo(
    () =>
      genres.map((genre) => ({
        value: genre.id,
        label: genre.name,
        badgeClassName: paletteBadgeClassName(genre.name, genre.color),
      })),
    [genres]
  );

  const searchQuery = useMemo(() => {
    if (!book) return "";
    return `${book.title} ${book.authors.map((a) => a.author.name).join(" ")}`;
  }, [book]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!book) {
    return null;
  }

  const formatInputDate = (value: string | null | undefined) => {
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

  const handleBookSelect = (searchBook: SearchResult) => {
    setEditData((prev) => ({
      ...prev,
      title: searchBook.title,
      coverUrl: searchBook.coverUrl || prev.coverUrl,
      totalPages: searchBook.totalPages || prev.totalPages,
      summary: searchBook.description || prev.summary,
    }));
  };

  const currentFormatId =
    editData.formatId ??
    editData.format?.id ??
    book.formatId ??
    book.format?.id ??
    "";

  return (
    <>
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
          setEditGenreIds((prev) => Array.from(new Set([...prev, created.id])));
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

      <div
        className={cn(
          "mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8",
          isEditing && "pb-24"
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <Button variant="ghost" onClick={navigateToLibrary}>
            <RiArrowLeftLine />
            {tCommon("back")}
          </Button>
          {!isEditing && (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={beginEditing}>
                {tCommon("edit")}
              </Button>
              <Button
                variant="outline"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                {tCommon("delete")}
              </Button>
            </div>
          )}
        </div>

        <div className="grid gap-8 md:grid-cols-[250px_1fr]">
          <div className="space-y-3">
            <div className="relative overflow-hidden rounded-xl shadow-lg">
              <BookCover
                coverUrl={
                  isEditing ? (editData.coverUrl ?? book.coverUrl) : book.coverUrl
                }
                title={isEditing ? (editData.title ?? book.title) : book.title}
                size="lg"
              />
              {!isEditing && (
                <button
                  type="button"
                  onClick={handleToggleWishlist}
                  disabled={wishlistUpdating}
                  aria-pressed={book.isWishlist}
                  aria-label={
                    book.isWishlist
                      ? t("removeFromWishlist")
                      : t("addToWishlist")
                  }
                  className="absolute top-2 right-2 flex size-9 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50"
                >
                  {book.isWishlist ? (
                    <RiHeartFill className="size-5 text-destructive" />
                  ) : (
                    <RiHeartLine className="size-5" />
                  )}
                </button>
              )}
            </div>
            {book.isWishlist && !isEditing && (
              <Badge
                variant="secondary"
                className="inline-flex items-center gap-1.5"
              >
                <RiBookmarkFill className="size-3" />
                {t("wishlist")}
              </Badge>
            )}
          </div>

          <div className="space-y-6">
            {isEditing && (
              <div className="flex items-center justify-between gap-2 rounded-2xl bg-muted p-3">
                <span className="text-sm text-muted-foreground">
                  {t("addManually")}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setIsSearchModalOpen(true)}
                >
                  <RiSearchLine />
                  <span>{t("searchOnline")}</span>
                </Button>
              </div>
            )}

            {isEditing ? (
              <div className="space-y-8">
                <section className="space-y-4">
                  <h2 className="font-heading text-lg font-semibold">
                    {t("sectionEssentials")}
                  </h2>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="book-title">{t("title")}</Label>
                      <Input
                        id="book-title"
                        value={editData.title || ""}
                        onChange={(e) =>
                          setEditData({ ...editData, title: e.target.value })
                        }
                        className="text-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="book-cover">{t("cover")} URL</Label>
                      <Input
                        id="book-cover"
                        value={editData.coverUrl || ""}
                        onChange={(e) =>
                          setEditData({ ...editData, coverUrl: e.target.value })
                        }
                        placeholder={t("coverUrlPlaceholder")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("authors")}</Label>
                      <AuthorSelect
                        authors={authors}
                        value={editAuthorIds}
                        onChange={setEditAuthorIds}
                        placeholder={t("authors")}
                        isLoading={isAuthorsLoading}
                        onOpenCreateDialog={() => setIsCreateAuthorOpen(true)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("genres")}</Label>
                      <MultiSelect
                        options={genreOptions}
                        value={editGenreIds}
                        onChange={setEditGenreIds}
                        placeholder={t("genresPlaceholder")}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-fit"
                        onClick={() => setIsCreateGenreOpen(true)}
                      >
                        {tSettings("addGenre")}
                      </Button>
                    </div>
                    {formats.length > 0 && (
                      <div className="space-y-2">
                        <Label>{t("format")}</Label>
                        <Select
                          items={formatItems}
                          value={currentFormatId || NO_FORMAT}
                          onValueChange={(value) => {
                            if (value == null) return;
                            setEditData({
                              ...editData,
                              formatId: value === NO_FORMAT ? null : value,
                            });
                          }}
                        >
                          <SelectTrigger className="w-full max-w-xs">
                            <SelectValue placeholder={t("formatPlaceholder")} />
                          </SelectTrigger>
                          <SelectContent>
                            {formatItems.map((item) => (
                              <SelectItem key={item.value} value={item.value}>
                                {item.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label>{t("status")}</Label>
                      <Select
                        items={statusItems}
                        value={editData.status || book.status}
                        onValueChange={(value) => {
                          if (!value) return;
                          setEditData({ ...editData, status: value });
                        }}
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder={t("statusPlaceholder")} />
                        </SelectTrigger>
                        <SelectContent>
                          {statusItems.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-4 md:flex-row">
                      <div className="min-w-0 flex-1 space-y-2">
                        <Label>{t("series")}</Label>
                        <SeriesSelect
                          series={series}
                          value={editData.seriesId || null}
                          onChange={(seriesId) =>
                            setEditData({ ...editData, seriesId })
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
                      </div>
                      <div className="w-full space-y-2 md:w-32">
                        <Label htmlFor="book-series-order">
                          {t("seriesOrder")}
                        </Label>
                        <Input
                          id="book-series-order"
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
                          placeholder={t("seriesOrderPlaceholder")}
                        />
                      </div>
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <h2 className="font-heading text-lg font-semibold">
                    {t("sectionReading")}
                  </h2>
                  <div className="space-y-4">
                    <div className="flex flex-col gap-4 md:flex-row">
                      <div className="flex-1 space-y-2">
                        <Label htmlFor="book-total-pages">
                          {t("totalPages")}
                        </Label>
                        <Input
                          id="book-total-pages"
                          type="number"
                          min={1}
                          value={editData.totalPages ?? ""}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              totalPages: e.target.value
                                ? parseInt(e.target.value, 10)
                                : null,
                            })
                          }
                          placeholder={t("totalPagesPlaceholder")}
                        />
                      </div>
                      <div className="flex-1 space-y-2">
                        <Label htmlFor="book-current-page">
                          {t("currentPage")}
                        </Label>
                        <Input
                          id="book-current-page"
                          type="number"
                          min={0}
                          value={editData.currentPage ?? 0}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              currentPage: parseInt(e.target.value, 10) || 0,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>{t("rating")}</Label>
                      <StarRating
                        value={editData.rating}
                        onChange={(value) =>
                          setEditData({ ...editData, rating: value })
                        }
                        size={22}
                      />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="book-start-date">{t("startDate")}</Label>
                        <Input
                          id="book-start-date"
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
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="book-end-date">{t("endDate")}</Label>
                        <Input
                          id="book-end-date"
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
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={!!editData.isWishlist}
                        onCheckedChange={(checked) =>
                          setEditData({
                            ...editData,
                            isWishlist: checked === true,
                          })
                        }
                      />
                      {editData.isWishlist ? (
                        <RiBookmarkFill className="size-4 text-primary" />
                      ) : (
                        <RiBookmarkLine className="size-4 text-muted-foreground" />
                      )}
                      {t("wishlist")}
                    </label>
                  </div>
                </section>

                <section className="space-y-4">
                  <h2 className="font-heading text-lg font-semibold">
                    {t("sectionNotes")}
                  </h2>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="book-summary">{t("summary")}</Label>
                      <Textarea
                        id="book-summary"
                        value={editData.summary || ""}
                        onChange={(e) =>
                          setEditData({ ...editData, summary: e.target.value })
                        }
                        rows={4}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="book-favorite-quote">
                        {t("favoriteQuote")}
                      </Label>
                      <Textarea
                        id="book-favorite-quote"
                        value={editData.favoriteQuote || ""}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            favoriteQuote: e.target.value,
                          })
                        }
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="book-favorite-moment">
                        {t("favoriteMoment")}
                      </Label>
                      <Textarea
                        id="book-favorite-moment"
                        value={editData.favoriteMoment || ""}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            favoriteMoment: e.target.value,
                          })
                        }
                        rows={2}
                      />
                    </div>
                  </div>
                </section>
              </div>
            ) : (
              <div className="space-y-2">
                <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
                  {book.title}
                </h1>
                {book.series && (
                  <Link
                    href={`/series/${book.series.slug}`}
                    className="inline-flex items-center gap-2 rounded-2xl bg-card px-3 py-2 text-sm shadow-sm ring-1 ring-foreground/5 transition-colors hover:bg-muted dark:ring-foreground/10"
                  >
                    <span className="font-semibold">{book.series.name}</span>
                    {book.seriesOrder !== null && (
                      <Badge variant="secondary">
                        {t("seriesOrderBadge", { order: book.seriesOrder })}
                      </Badge>
                    )}
                  </Link>
                )}
              </div>
            )}

            {!isEditing && (
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={book.status} size="lg" />
                {book.format && (
                  <Badge variant="secondary">{book.format.name}</Badge>
                )}
              </div>
            )}

            {!isEditing && (
              <div className="flex flex-col gap-2">
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
                      <div
                        key={author.id}
                        className="flex flex-wrap items-center gap-2"
                      >
                        <Link
                          href={`/authors/${author.id}`}
                          className="font-medium underline-offset-4 hover:underline"
                        >
                          {author.name}
                        </Link>
                        <span className="text-sm text-muted-foreground">
                          ({gender} · {nationalityLabel})
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-lg text-muted-foreground">
                    {t("groupUnknownAuthor")}
                  </p>
                )}
              </div>
            )}

            {!isEditing && book.genres.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {book.genres.map(({ genre }) => (
                  <Badge
                    key={genre.id}
                    variant="secondary"
                    className={cn(
                      "border-0",
                      paletteBadgeClassName(genre.name, genre.color)
                    )}
                  >
                    {genre.name}
                  </Badge>
                ))}
              </div>
            )}

            {book.totalPages && !isEditing && (
              <Card>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{t("progress")}</span>
                    <span className="font-bold text-primary">{progress}%</span>
                  </div>
                  <ProgressBar value={progress} />
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">
                      {book.currentPage} / {book.totalPages} {t("pages")}
                    </span>
                    <Input
                      type="number"
                      min={0}
                      max={book.totalPages}
                      value={
                        progressDraft !== null
                          ? progressDraft
                          : book.currentPage
                      }
                      onChange={(e) => {
                        const newPage = Math.min(
                          parseInt(e.target.value, 10) || 0,
                          book.totalPages || 0
                        );
                        setProgressDraft(newPage);
                      }}
                      onBlur={commitProgressDraft}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.currentTarget.blur();
                        }
                      }}
                      className="w-[100px]"
                    />
                  </div>
                  {book.status === "READING" && (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          void handleProgressUpdate(
                            Math.min(book.currentPage + 1, book.totalPages!)
                          )
                        }
                      >
                        {t("plusOne")}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          void handleProgressUpdate(
                            Math.min(book.currentPage + 10, book.totalPages!)
                          )
                        }
                      >
                        {t("plusTen")}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() =>
                          void handleProgressUpdate(book.totalPages!)
                        }
                      >
                        {t("markFinished")}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {!isEditing && (
              <>
                <Card>
                  <CardContent>
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-semibold">{t("rating")}</span>
                      {book.rating !== null ? (
                        <StarRating value={book.rating} readOnly size={22} />
                      ) : (
                        <span className="text-muted-foreground">
                          {t("notRated")}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent>
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <p className="font-semibold">{t("startDate")}</p>
                        {book.startDate ? (
                          <p className="text-muted-foreground">
                            {new Date(book.startDate).toLocaleDateString()}
                            {formatRelative(book.startDate) && (
                              <span> ({formatRelative(book.startDate)})</span>
                            )}
                          </p>
                        ) : (
                          <p className="text-muted-foreground">
                            {t("startDateMissing")}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <p className="font-semibold">{t("endDate")}</p>
                        {book.endDate ? (
                          <p className="text-muted-foreground">
                            {new Date(book.endDate).toLocaleDateString()}
                            {formatRelative(book.endDate) && (
                              <span> ({formatRelative(book.endDate)})</span>
                            )}
                          </p>
                        ) : (
                          <p className="text-muted-foreground">
                            {t("endDateNotFinished")}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {book.summary && (
                  <Card>
                    <CardContent className="space-y-2">
                      <p className="font-semibold">{t("summary")}</p>
                      <p className="whitespace-pre-wrap text-muted-foreground">
                        {book.summary}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {book.favoriteQuote && (
                  <Card>
                    <CardContent className="space-y-2">
                      <p className="font-semibold">{t("favoriteQuote")}</p>
                      <p className="italic text-muted-foreground">
                        &ldquo;{book.favoriteQuote}&rdquo;
                      </p>
                    </CardContent>
                  </Card>
                )}

                {book.favoriteMoment && (
                  <Card>
                    <CardContent className="space-y-2">
                      <p className="font-semibold">{t("favoriteMoment")}</p>
                      <p className="whitespace-pre-wrap text-muted-foreground">
                        {book.favoriteMoment}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {isEditing && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 p-4 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <Button
              type="button"
              variant="outline"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              {tCommon("delete")}
            </Button>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="ghost" onClick={cancelEditing}>
                {tCommon("cancel")}
              </Button>
              <Button type="button" onClick={handleSave} disabled={saving}>
                {saving ? tCommon("loading") : tCommon("save")}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteBook")}</DialogTitle>
            <DialogDescription>{t("deleteConfirm")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDeleteDialog(false)}>
              {tCommon("cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              {tCommon("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
