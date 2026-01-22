"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Box,
  Button,
  Card,
  Container,
  Flex,
  Heading,
  Stack,
  Text,
} from "@chakra-ui/react";
import { FiArrowLeft } from "react-icons/fi";
import { BookGridView, BookGridBook } from "@/components/books/book-grid";

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
    async function fetchSeries() {
      try {
        const response = await fetch(`/api/series/${id}`);
        if (response.ok) {
          setSeries(await response.json());
        } else if (response.status === 404) {
          router.push("/series");
        }
      } catch (error) {
        console.error("Failed to fetch series:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchSeries();
  }, [id, router]);

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
        <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
          <Button variant="ghost" onClick={() => router.push("/series")}>
            <FiArrowLeft /> {tNav("series")}
          </Button>
        </Flex>

        <Box>
          <Heading as="h1" size="2xl">
            {series.name}
          </Heading>
          <Text color="fg.muted">
            {t("booksCount", { count: series.books.length })}
          </Text>
        </Box>

        {series.books.length === 0 ? (
          <Card.Root>
            <Card.Body>
              <Stack align="center" py={10}>
                <Text fontSize="4xl">📖</Text>
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
