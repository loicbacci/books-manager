"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  Box,
  Button,
  Card,
  Container,
  Flex,
  Heading,
  Input,
  Stack,
  Text,
  Field,
  Icon,
} from "@chakra-ui/react";
import { FiArrowRight, FiBookOpen } from "react-icons/fi";
import { BookCover } from "@/components/ui/book-cover";
import {
  PaginationRoot,
  PaginationPrevTrigger,
  PaginationItems,
  PaginationNextTrigger,
  PaginationPageText,
} from "@/components/ui/pagination";
import type { PageResult } from "@/types/pagination";

type Series = {
  id: string;
  name: string;
  slug: string;
  _count: { books: number };
  books: Array<{ id: string; title: string; coverUrl: string | null }>;
};

export default function SeriesPage() {
  const t = useTranslations("series");
  const tCommon = useTranslations("common");
  const tNav = useTranslations("nav");

  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [totalSeries, setTotalSeries] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 24;

  const fetchSeries = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/series?page=${page}&pageSize=${pageSize}`,
        signal ? { signal } : undefined
      );
      if (response.ok) {
        const data = (await response.json()) as PageResult<Series>;
        setSeries(data.items);
        setTotalSeries(data.total);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch series:", error);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;
    fetchSeries(controller.signal).catch((error) => {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      if (isActive) {
        console.error("Failed to fetch series:", error);
      }
    });
    return () => {
      isActive = false;
      controller.abort();
    };
  }, [fetchSeries]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const response = await fetch("/api/series", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (response.ok) {
        setName("");
        await fetchSeries();
      }
    } catch (error) {
      console.error("Failed to create series:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container maxW="container.lg" py={8}>
      <Stack gap={6}>
        {/* Page title */}
        <Heading as="h1" size="2xl">
          {tNav("series")}
        </Heading>

        {/* Create series */}
        <Card.Root>
          <Card.Body>
            <Stack gap={3}>
              <Text fontWeight="semibold">{t("createTitle")}</Text>
              <Flex gap={3} wrap="wrap">
                <Field.Root maxW="400px">
                  <Field.Label>{t("namePlaceholder")}</Field.Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("namePlaceholder")}
                  />
                </Field.Root>
                <Button
                  colorPalette="brand"
                  onClick={handleCreate}
                  loading={saving}
                  loadingText={tCommon("loading")}
                >
                  {t("create")}
                </Button>
              </Flex>
            </Stack>
          </Card.Body>
        </Card.Root>

        {/* Loading / empty / list */}
        {loading ? (
          <Text color="fg.muted">{tCommon("loading")}</Text>
        ) : series.length === 0 ? (
          <Card.Root>
            <Card.Body>
              <Stack align="center" py={10}>
                <Icon as={FiBookOpen} boxSize={8} color="brand.fg" />
                <Text color="fg.muted">{t("empty")}</Text>
              </Stack>
            </Card.Body>
          </Card.Root>
        ) : (
          <Stack gap={4}>
            {/* Series list */}
            <Stack gap={3}>
              {series.map((item) => (
                <Card.Root key={item.id} asChild>
                  <Link href={`/series/${item.slug}`}>
                    <Card.Body>
                      <Flex justify="space-between" align="center" gap={4}>
                        <Box flex="1">
                          <Text fontWeight="semibold">{item.name}</Text>
                          <Text color="fg.muted" fontSize="sm">
                            {t("booksCount", { count: item._count.books })}
                          </Text>
                        </Box>
                        <Flex align="center" gap={2}>
                          {item.books.length > 0 && (
                            <Flex gap={2}>
                              {item.books.map((book) => (
                                <Box key={book.id} maxW="52px">
                                  <BookCover
                                    coverUrl={book.coverUrl}
                                    title={book.title}
                                    size="xs"
                                  />
                                </Box>
                              ))}
                            </Flex>
                          )}
                          <FiArrowRight color="var(--chakra-colors-fg-muted)" />
                        </Flex>
                      </Flex>
                    </Card.Body>
                  </Link>
                </Card.Root>
              ))}
            </Stack>
            {/* Pagination */}
            {totalPages > 1 && (
              <Flex justify="center">
                <PaginationRoot
                  count={totalSeries}
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
    </Container>
  );
}

