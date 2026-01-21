"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import NextLink from "next/link";
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
} from "@chakra-ui/react";
import { BookCover } from "@/components/ui/book-cover";

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

  const fetchSeries = async () => {
    try {
      const response = await fetch("/api/series");
      if (response.ok) {
        setSeries(await response.json());
      }
    } catch (error) {
      console.error("Failed to fetch series:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeries();
  }, []);

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
        <Heading as="h1" size="2xl">
          {tNav("series")}
        </Heading>

        <Card.Root>
          <Card.Body>
            <Stack gap={3}>
              <Text fontWeight="semibold">{t("createTitle")}</Text>
              <Flex gap={3} wrap="wrap">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("namePlaceholder")}
                  maxW="400px"
                />
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

        {loading ? (
          <Text color="fg.muted">{tCommon("loading")}</Text>
        ) : series.length === 0 ? (
          <Card.Root>
            <Card.Body>
              <Stack align="center" py={10}>
                <Text fontSize="4xl">📖</Text>
                <Text color="fg.muted">{t("empty")}</Text>
              </Stack>
            </Card.Body>
          </Card.Root>
        ) : (
          <Stack gap={3}>
            {series.map((item) => (
              <Card.Root key={item.id} asChild>
                <NextLink href={`/series/${item.slug}`}>
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
                        <Text color="fg.muted">→</Text>
                      </Flex>
                    </Flex>
                  </Card.Body>
                </NextLink>
              </Card.Root>
            ))}
          </Stack>
        )}
      </Stack>
    </Container>
  );
}
