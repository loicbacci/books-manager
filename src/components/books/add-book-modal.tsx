"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { RiSearchLine } from "@remixicon/react";
import { toast } from "sonner";

import { CreateAuthorDialog } from "@/components/authors/create-author-dialog";
import { AuthorSelect } from "@/components/books/author-select";
import { BookSearchModal, type SearchResult } from "./book-search-modal";
import { SeriesSelect } from "./series-select";
import { StarRating } from "@/components/books/star-rating";
import { CreateGenreDialog } from "@/components/genres/create-genre-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GroupToggle } from "@/components/ui/group-toggle";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/ui/multi-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { paletteBadgeClassName } from "@/lib/color-palettes";
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
const NO_FORMAT = "__none__";

const initialFormData = {
  title: "",
  coverUrl: "",
  status: "TO_READ" as (typeof statusOptions)[number],
  totalPages: "",
  currentPage: "0",
  rating: null as number | null,
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
};

function FormSection({
  title,
  collapsed,
  onToggle,
  children,
}: {
  title: string;
  collapsed: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <GroupToggle
        label={title}
        collapsed={collapsed}
        onToggle={onToggle}
        size="sm"
        className="rounded-xl bg-muted/60 px-2"
      />
      {!collapsed && <div className="space-y-4 pt-1">{children}</div>}
    </div>
  );
}

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
  const [isSeriesOpen, setIsSeriesOpen] = useState(false);
  const [isDatesOpen, setIsDatesOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);

  const [formData, setFormData] = useState(initialFormData);

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
        .then(([authorsData, genresData, formatsData, seriesData]) => {
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
        })
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
        rating: formData.rating,
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
        setFormData(initialFormData);
        onSuccess();
      } else {
        toast.error(tCommon("createFailed"));
      }
    } catch (error) {
      console.error("Failed to create book:", error);
      toast.error(tCommon("createFailed"));
    } finally {
      setLoading(false);
    }
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
      <Dialog open={isOpen} onOpenChange={(next) => !next && onClose()}>
        <DialogContent className="flex max-h-[85vh] max-w-lg flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>{t("addBook")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
              <div className="flex items-center justify-between gap-2 rounded-2xl bg-muted p-3">
                <span className="text-sm text-muted-foreground">
                  {t("addManually")}
                </span>
                <div className="flex flex-wrap justify-end gap-2">
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-book-title">{t("title")}</Label>
                <Input
                  id="add-book-title"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder={t("titlePlaceholder")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-book-cover">{t("cover")} URL</Label>
                <Input
                  id="add-book-cover"
                  value={formData.coverUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, coverUrl: e.target.value })
                  }
                  placeholder={t("coverUrlPlaceholder")}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>{t("authors")}</Label>
                <AuthorSelect
                  authors={authors}
                  value={formData.authorIds}
                  onChange={(authorIds) =>
                    setFormData({ ...formData, authorIds })
                  }
                  placeholder={t("authors")}
                  isLoading={isAuthorsLoading}
                  onOpenCreateDialog={() => setIsCreateAuthorOpen(true)}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>{t("genres")}</Label>
                <MultiSelect
                  options={genreOptions}
                  value={formData.genreIds}
                  onChange={(genreIds) =>
                    setFormData({ ...formData, genreIds })
                  }
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

              <Separator />

              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <Label>{t("status")}</Label>
                  <Select
                    items={statusItems}
                    value={formData.status}
                    onValueChange={(value) => {
                      if (!value) return;
                      setFormData({
                        ...formData,
                        status: value as (typeof statusOptions)[number],
                      });
                    }}
                  >
                    <SelectTrigger className="w-full">
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

                {formats.length > 0 && (
                  <div className="flex-1 space-y-2">
                    <Label>{t("format")}</Label>
                    <Select
                      items={formatItems}
                      value={formData.formatId || NO_FORMAT}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          formatId: !value || value === NO_FORMAT ? "" : value,
                        })
                      }
                    >
                      <SelectTrigger className="w-full">
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
              </div>

              <Separator />

              <div className="flex flex-wrap gap-4">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="add-book-total-pages">
                    {t("totalPages")}
                  </Label>
                  <Input
                    id="add-book-total-pages"
                    type="number"
                    min={1}
                    value={formData.totalPages}
                    onChange={(e) =>
                      setFormData({ ...formData, totalPages: e.target.value })
                    }
                    placeholder={t("totalPagesPlaceholder")}
                  />
                </div>

                <div className="flex-1 space-y-2">
                  <Label htmlFor="add-book-current-page">
                    {t("currentPage")}
                  </Label>
                  <Input
                    id="add-book-current-page"
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
                </div>

                <div className="flex-1 space-y-2">
                  <Label>{t("rating")}</Label>
                  <div className="flex h-8 items-center gap-2">
                    <StarRating
                      value={formData.rating}
                      onChange={(value) =>
                        setFormData({ ...formData, rating: value })
                      }
                    />
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={formData.isWishlist}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      isWishlist: checked === true,
                    })
                  }
                />
                {t("wishlist")}
              </label>

              <Separator />

              <FormSection
                title={t("sectionSeries")}
                collapsed={!isSeriesOpen}
                onToggle={() => setIsSeriesOpen((prev) => !prev)}
              >
                <div className="flex flex-col gap-4 md:flex-row">
                  <div className="flex-1 space-y-2">
                    <Label>{t("series")}</Label>
                    <SeriesSelect
                      series={series}
                      value={formData.seriesId || null}
                      onChange={(seriesId) =>
                        setFormData({ ...formData, seriesId: seriesId || "" })
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

                  <div className="flex-1 space-y-2">
                    <Label htmlFor="add-book-series-order">
                      {t("seriesOrder")}
                    </Label>
                    <Input
                      id="add-book-series-order"
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
                  </div>
                </div>
              </FormSection>

              <FormSection
                title={t("sectionDates")}
                collapsed={!isDatesOpen}
                onToggle={() => setIsDatesOpen((prev) => !prev)}
              >
                <div className="flex flex-col gap-4 md:flex-row">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="add-book-start-date">{t("startDate")}</Label>
                    <Input
                      id="add-book-start-date"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) =>
                        setFormData({ ...formData, startDate: e.target.value })
                      }
                    />
                    {formData.startDate && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={() =>
                          setFormData({ ...formData, startDate: "" })
                        }
                      >
                        {tCommon("clear")}
                      </Button>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="add-book-end-date">{t("endDate")}</Label>
                    <Input
                      id="add-book-end-date"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) =>
                        setFormData({ ...formData, endDate: e.target.value })
                      }
                    />
                    {formData.endDate && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={() => setFormData({ ...formData, endDate: "" })}
                      >
                        {tCommon("clear")}
                      </Button>
                    )}
                  </div>
                </div>
              </FormSection>

              <FormSection
                title={t("sectionNotes")}
                collapsed={!isNotesOpen}
                onToggle={() => setIsNotesOpen((prev) => !prev)}
              >
                <div className="space-y-2">
                  <Label htmlFor="add-book-summary">{t("summary")}</Label>
                  <Textarea
                    id="add-book-summary"
                    value={formData.summary}
                    onChange={(e) =>
                      setFormData({ ...formData, summary: e.target.value })
                    }
                    placeholder={t("summaryPlaceholder")}
                    rows={3}
                  />
                </div>
              </FormSection>
            </div>

            <DialogFooter className="sticky bottom-0 border-t bg-background px-6 py-4">
              <Button type="button" variant="ghost" onClick={onClose}>
                {tCommon("cancel")}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? tCommon("loading") : tCommon("add")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
