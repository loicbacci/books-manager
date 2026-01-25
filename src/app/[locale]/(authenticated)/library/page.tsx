"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  Container,
  Heading,
  Stack,
  Flex,
  Button,
  Spinner,
} from "@chakra-ui/react";
import { AddBookModal } from "@/components/books/add-book-modal";
import { BookGridView, BookGridBook } from "@/components/books/book-grid";
import {
  PaginationRoot,
  PaginationPrevTrigger,
  PaginationItems,
  PaginationNextTrigger,
  PaginationPageText,
} from "@/components/ui/pagination";
import type { PageResult } from "@/types/pagination";

type Book = BookGridBook & {
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  series: { id: string; name: string } | null;
};

export default function LibraryPage() {
  const t = useTranslations("book");
  const tNav = useTranslations("nav");

  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalBooks, setTotalBooks] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 48;

  const fetchBooks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/books?page=${page}&pageSize=${pageSize}`
      );
      if (response.ok) {
        const data = (await response.json()) as PageResult<Book>;
        setBooks(data.items);
        setTotalBooks(data.total);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch books:", error);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  return (
    <Container maxW="container.xl" py={8}>
      <Stack gap={6}>
        {/* Page header + primary action */}
        <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
          <Heading as="h1" size="2xl">
            {tNav("library")}
          </Heading>
          <Button colorPalette="brand" onClick={() => setIsAddModalOpen(true)}>
            {t("addBook")}
          </Button>
        </Flex>

        {/* Loading or content */}
        {loading ? (
          <Flex justify="center" align="center" minH="400px">
            <Spinner size="xl" color="brand.500" />
          </Flex>
        ) : (
          <Stack gap={4}>
            {/* Book grid with filters and display controls */}
            <BookGridView
              books={books}
              cookieKey="libraryViewPrefs"
              emptyAction={
                <Button
                  colorPalette="brand"
                  mt={4}
                  onClick={() => setIsAddModalOpen(true)}
                >
                  {t("addBook")}
                </Button>
              }
            />
            {/* Pagination */}
            {totalPages > 1 && (
              <Flex justify="center">
                <PaginationRoot
                  count={totalBooks}
                  pageSize={pageSize}
                  page={page}
                  onPageChange={(e) => setPage(e.page)}
                >
                  <PaginationPrevTrigger />
                  <PaginationItems />
                  <PaginationNextTrigger />
                  <PaginationPageText />
                </PaginationRoot>
              </Flex>
            )}
          </Stack>
        )}
      </Stack>

      {/* Create book modal */}
      <AddBookModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          setIsAddModalOpen(false);
          fetchBooks();
        }}
      />
    </Container>
  );
}

