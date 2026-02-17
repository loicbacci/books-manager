"use client";

import { BookGridBook, BookGridView } from "@/components/books/book-grid";
import { useRouter } from "@/i18n/routing";
import {
  Box,
  Button,
  Card,
  Container,
  Flex,
  Heading,
  Icon,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { use, useEffect, useState } from "react";
import { FiArrowLeft, FiBookOpen } from "react-icons/fi";

type Series = {
  id: string;
  name: string;
  books: BookGridBook[];
};

export default function SeriesDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const t = useTranslations("series");
  const tCommon = useTranslations("common");
  const tNav = useTranslations("nav");

  const [series, setSeries] = useState<Series | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;
    async function fetchSeries() {
      try {
        const response = await fetch(`/api/series/${id}`, {
          signal: controller.signal,
        });
        if (response.ok) {
          const data = await response.json();
          if (isActive) {
            setSeries(data);
          }
        } else if (response.status === 404) {
          router.push("/series");
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        console.error("Failed to fetch series:", error);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    fetchSeries();
    return () => {
      isActive = false;
      controller.abort();
    };
  }, [id, router]);

  // Loading state
  if (loading) {
    return (
      <Container maxW="container.lg" py={8}>
        <Text color="fg.muted">{tCommon("loading")}</Text>
      </Container>
    );
  }

  if (!series) {
    return null;
  }

  return (
    <Container maxW="container.lg" py={8}>
      <Stack gap={6}>
        {/* Back navigation */}
        <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
          <Button variant="ghost" onClick={() => router.push("/series")}>
            <FiArrowLeft /> {tNav("series")}
          </Button>
        </Flex>

        {/* Series header */}
        <Box>
          <Heading as="h1" size="2xl">
            {series.name}
          </Heading>
          <Text color="fg.muted">
            {t("booksCount", { count: series.books.length })}
          </Text>
        </Box>

        {/* Books list / empty state */}
        {series.books.length === 0 ? (
          <Card.Root>
            <Card.Body>
              <Stack align="center" py={10}>
                <Icon as={FiBookOpen} boxSize={8} color="brand.fg" />
                <Text color="fg.muted">{t("emptyBooks")}</Text>
              </Stack>
            </Card.Body>
          </Card.Root>
        ) : (
          <BookGridView
            books={series.books}
            cookieKey={`seriesBooksViewPrefs-${series.id}`}
          />
        )}
      </Stack>
    </Container>
  );
}
