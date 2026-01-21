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

  const fetchBooks = useCallback(async () => {
    try {
      const response = await fetch("/api/books");
      if (response.ok) {
        const data = await response.json();
        setBooks(data);
      }
    } catch (error) {
      console.error("Failed to fetch books:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  return (
    <Container maxW="container.xl" py={8}>
      <Stack gap={6}>
        <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
          <Heading as="h1" size="2xl">
            {tNav("library")}
          </Heading>
          <Button colorPalette="brand" onClick={() => setIsAddModalOpen(true)}>
            {t("addBook")}
          </Button>
        </Flex>

        {loading ? (
          <Flex justify="center" align="center" minH="400px">
            <Spinner size="xl" color="brand.500" />
          </Flex>
        ) : (
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
        )}
      </Stack>

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
