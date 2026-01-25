"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Box,
  Input,
  Stack,
  Text,
  Button,
  Spinner,
  Card,
  Flex,
  Badge,
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
import { BookCover } from "@/components/ui/book-cover";

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

  // Auto-populate query and search when modal opens with initialQuery.
  useEffect(() => {
    if (open && initialQuery) {
      setQuery(initialQuery);
      // Trigger search automatically.
      const searchWithInitialQuery = async () => {
        setLoading(true);
        setSearched(true);

        try {
          const response = await fetch(
            `/api/books/search?q=${encodeURIComponent(initialQuery)}`
          );
          if (response.ok) {
            const data = await response.json();
            setResults(data);
          } else {
            setResults([]);
          }
        } catch (error) {
          console.error("Failed to search books:", error);
          setResults([]);
        } finally {
          setLoading(false);
        }
      };

      searchWithInitialQuery();
    } else if (!open) {
      // Reset local state when the dialog closes.
      setQuery("");
      setResults([]);
      setSearched(false);
    }
  }, [open, initialQuery]);

  /**
   * Execute the search request against the API.
   */
  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);

    try {
      const response = await fetch(
        `/api/books/search?q=${encodeURIComponent(query)}`
      );
      if (response.ok) {
        const data = await response.json();
        setResults(data);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error("Failed to search books:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
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
    <DialogRoot
      open={open}
      onOpenChange={({ open }) => !open && onClose()}
      size="xl"
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("searchOnline")}</DialogTitle>
          <DialogCloseTrigger />
        </DialogHeader>

        <DialogBody>
          <Stack gap={4}>
            <Flex gap={2}>
              <Input
                placeholder={t("searchPlaceholder")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                size="lg"
                flex={1}
              />
              <Button
                onClick={handleSearch}
                colorPalette="brand"
                loading={loading}
                size="lg"
              >
                {tCommon("search")}
              </Button>
            </Flex>

            {loading && (
              <Flex justify="center" py={8}>
                <Spinner size="xl" color="brand.500" />
              </Flex>
            )}

            {!loading && searched && results.length === 0 && (
              <Box textAlign="center" py={8}>
                <Text color="fg.muted">{t("noResultsFound")}</Text>
              </Box>
            )}

            {!loading && results.length > 0 && (
              <Stack gap={3} maxH="500px" overflowY="auto">
                {results.map((book) => (
                  <Card.Root
                    key={book.id}
                    cursor="pointer"
                    _hover={{ bg: "bg.muted" }}
                    onClick={() => handleSelect(book)}
                  >
                    <Card.Body p={4}>
                      <Flex gap={4}>
                        <Box flexShrink={0} width="72px">
                          <BookCover
                            coverUrl={book.coverUrl ?? null}
                            title={book.title}
                            size="sm"
                          />
                        </Box>
                        <Stack gap={2} flex={1} minW={0}>
                          <Box>
                            <Text fontWeight="bold" fontSize="lg" lineClamp={2}>
                              {book.title}
                            </Text>
                            <Text fontSize="sm" color="fg.muted">
                              {book.authors.join(", ") ||
                                t("unknownAuthor")}
                            </Text>
                          </Box>

                          {book.description && (
                            <Text fontSize="sm" color="fg.muted" lineClamp={2}>
                              {book.description}
                            </Text>
                          )}

                          <Flex gap={2} flexWrap="wrap">
                            {book.publishedDate && (
                              <Badge size="sm" colorPalette="gray">
                                {book.publishedDate}
                              </Badge>
                            )}
                            {book.totalPages && (
                              <Badge size="sm" colorPalette="blue">
                                {book.totalPages} {t("pages")}
                              </Badge>
                            )}
                            {book.publisher && (
                              <Badge size="sm" colorPalette="gray">
                                {book.publisher}
                              </Badge>
                            )}
                          </Flex>
                        </Stack>
                      </Flex>
                    </Card.Body>
                  </Card.Root>
                ))}
              </Stack>
            )}
          </Stack>
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {tCommon("cancel")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
}


