"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { RiLoader4Line } from "@remixicon/react";

import { Badge } from "@/components/ui/badge";
import { BookCover } from "@/components/ui/book-cover";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export type SearchResult = {
  id: string;
  title: string;
  authors: string[];
  coverUrl?: string;
  totalPages?: number;
  description?: string;
  isbn?: string;
  publishedDate?: string;
  publisher?: string;
};

/**
 * Props for the online book search modal.
 */
type BookSearchModalProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (book: SearchResult) => void;
  initialQuery?: string;
};

/**
 * Modal for searching external metadata providers and selecting a result.
 *
 * Consumers receive the selected book via `onSelect`.
 */
export function BookSearchModal({
  open,
  onClose,
  onSelect,
  initialQuery = "",
}: BookSearchModalProps) {
  const t = useTranslations("book");
  const tCommon = useTranslations("common");

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const activeController = useRef<AbortController | null>(null);

  const runSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    activeController.current?.abort();
    const controller = new AbortController();
    activeController.current = controller;
    setLoading(true);
    setSearched(true);

    try {
      const response = await fetch(
        `/api/books/search?q=${encodeURIComponent(searchQuery)}`,
        { signal: controller.signal }
      );
      if (response.ok) {
        const data = await response.json();
        setResults(data);
      } else {
        setResults([]);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      console.error("Failed to search books:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Auto-populate query and search when modal opens with initialQuery.
  useEffect(() => {
    if (open && initialQuery) {
      setQuery(initialQuery);
      runSearch(initialQuery);
    } else if (!open) {
      activeController.current?.abort();
      setQuery("");
      setResults([]);
      setSearched(false);
    }
    return () => {
      activeController.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialQuery]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      runSearch(query);
    }
  };

  /**
   * Commit the selected result and close the modal.
   */
  const handleSelect = (book: SearchResult) => {
    onSelect(book);
    setQuery("");
    setResults([]);
    setSearched(false);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => !nextOpen && onClose()}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("searchOnline")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="search"
              aria-label={tCommon("search")}
              placeholder={t("searchPlaceholder")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-10 flex-1"
            />
            <Button
              type="button"
              onClick={() => runSearch(query)}
              disabled={loading}
              className="h-10"
            >
              {loading && <RiLoader4Line className="animate-spin" />}
              {tCommon("search")}
            </Button>
          </div>

          {loading && (
            <div className="flex justify-center py-8">
              <RiLoader4Line className="size-8 animate-spin text-primary" />
            </div>
          )}

          {!loading && searched && results.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">{t("noResultsFound")}</p>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="max-h-[500px] space-y-3 overflow-y-auto">
              {results.map((book) => (
                <div
                  key={book.id}
                  role="button"
                  tabIndex={0}
                  aria-label={book.title}
                  onClick={() => handleSelect(book)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleSelect(book);
                    }
                  }}
                  className="cursor-pointer rounded-2xl p-4 shadow-sm ring-1 ring-foreground/5 transition-colors hover:bg-muted dark:ring-foreground/10"
                >
                  <div className="flex gap-4">
                    <div className="w-18 shrink-0">
                      <BookCover
                        coverUrl={book.coverUrl ?? null}
                        title={book.title}
                        size="sm"
                      />
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <div>
                        <p className="line-clamp-2 text-lg font-bold">
                          {book.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {book.authors.join(", ") || t("unknownAuthor")}
                        </p>
                      </div>

                      {book.description && (
                        <p className="line-clamp-2 text-sm text-muted-foreground">
                          {book.description}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-2">
                        {book.publishedDate && (
                          <Badge variant="secondary">
                            {book.publishedDate}
                          </Badge>
                        )}
                        {book.totalPages && (
                          <Badge variant="secondary">
                            {book.totalPages} {t("pages")}
                          </Badge>
                        )}
                        {book.publisher && (
                          <Badge variant="secondary">{book.publisher}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {tCommon("cancel")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
