"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { RiHeartFill, RiHeartLine } from "@remixicon/react";

import { StarRating } from "@/components/books/star-rating";
import { Badge } from "@/components/ui/badge";
import { BookCover } from "@/components/ui/book-cover";
import { Checkbox } from "@/components/ui/checkbox";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatusBadge } from "@/components/ui/status-badge";
import { Link } from "@/i18n/routing";
import { paletteBadgeClassName } from "@/lib/color-palettes";
import { cn } from "@/lib/utils";
import type { BookGridBook } from "./book-grid";
import type { BookCardFields } from "./book-grid-controls";

type BookCardProps = {
  book: BookGridBook;
  fields: BookCardFields;
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (bookId: string) => void;
  onWishlistChange?: (bookId: string, isWishlist: boolean) => void;
};

export function BookCard({
  book,
  fields,
  selectionMode = false,
  selected = false,
  onToggleSelect,
  onWishlistChange,
}: BookCardProps) {
  const t = useTranslations("book");
  const tCommon = useTranslations("common");

  const [isWishlist, setIsWishlist] = useState(book.isWishlist);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setIsWishlist(book.isWishlist);
  }, [book.isWishlist]);

  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
    };
  }, []);

  const progress = book.totalPages
    ? Math.round((book.currentPage / book.totalPages) * 100)
    : 0;

  const handleToggleWishlist = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const next = !isWishlist;
    setIsWishlist(next);

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const response = await fetch(`/api/books/${book.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isWishlist: next }),
        signal: controller.signal,
      });
      if (!response.ok) {
        setIsWishlist(!next);
        toast.error(tCommon("saveFailed"));
        return;
      }
      onWishlistChange?.(book.id, next);
      toast.success(next ? t("addedToWishlist") : t("removedFromWishlist"));
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      console.error("Failed to update wishlist status:", error);
      setIsWishlist(!next);
      toast.error(tCommon("saveFailed"));
    }
  };

  const cardBody = (
    <div
      className={cn(
        "space-y-2 rounded-2xl bg-card p-3 shadow-sm ring-1 ring-foreground/5 transition-shadow dark:ring-foreground/10",
        !selectionMode && "group-hover:shadow-md",
        selectionMode && selected && "ring-2 ring-primary"
      )}
    >
      {fields.cover && (
        <div className="relative">
          <BookCover coverUrl={book.coverUrl} title={book.title} />
          {selectionMode ? (
            <div
              className="absolute top-1.5 left-1.5 z-10"
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
            >
              <Checkbox
                checked={selected}
                onCheckedChange={() => onToggleSelect?.(book.id)}
                aria-label={book.title}
                className="size-5 border-background bg-background/90 shadow-sm"
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={handleToggleWishlist}
              aria-pressed={isWishlist}
              aria-label={
                isWishlist ? t("removeFromWishlist") : t("addToWishlist")
              }
              className="absolute top-1.5 right-1.5 z-10 flex size-7 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              {isWishlist ? (
                <RiHeartFill className="size-4 text-destructive" />
              ) : (
                <RiHeartLine className="size-4" />
              )}
            </button>
          )}
        </div>
      )}
      <div className="space-y-1">
        {fields.title && (
          <p className="line-clamp-2 text-sm font-semibold text-foreground">
            {book.title}
          </p>
        )}
        {fields.author && (
          <p className="line-clamp-1 text-xs text-muted-foreground">
            {book.authors.map((a) => a.author.name).join(", ") ||
              t("unknownAuthor")}
          </p>
        )}
        {fields.genres && book.genres.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
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
        {fields.format && book.format && (
          <p className="line-clamp-1 text-xs text-muted-foreground">
            {book.format.name}
          </p>
        )}
      </div>
      {book.status === "READING" && book.totalPages && (
          <div>
            <ProgressBar value={progress} size="sm" />
            <p className="mt-1 text-xs text-muted-foreground">{progress}%</p>
          </div>
        )}
      {fields.rating && book.rating !== null && (
        <StarRating value={book.rating} readOnly size={14} />
      )}
      {fields.status && <StatusBadge status={book.status} size="sm" />}
    </div>
  );

  if (selectionMode) {
    return (
      <button
        type="button"
        onClick={() => onToggleSelect?.(book.id)}
        className="block w-full rounded-2xl text-left transition-transform"
        aria-pressed={selected}
      >
        {cardBody}
      </button>
    );
  }

  return (
    <div className="group relative">
      {!fields.cover && (
        <button
          type="button"
          onClick={handleToggleWishlist}
          aria-pressed={isWishlist}
          aria-label={
            isWishlist ? t("removeFromWishlist") : t("addToWishlist")
          }
          className="absolute top-1.5 right-1.5 z-10 flex size-7 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          {isWishlist ? (
            <RiHeartFill className="size-4 text-destructive" />
          ) : (
            <RiHeartLine className="size-4" />
          )}
        </button>
      )}
      <Link
        href={`/books/${book.slug}`}
        className="block rounded-2xl transition-transform hover:-translate-y-1"
      >
        {cardBody}
      </Link>
    </div>
  );
}
