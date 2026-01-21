"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import NextLink from "next/link";
import {
  Box,
  Container,
  Grid,
  Heading,
  Text,
  Stack,
  Card,
  Flex,
  Spinner,
  Button,
} from "@chakra-ui/react";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatusBadge } from "@/components/ui/status-badge";
import { BookCover } from "@/components/ui/book-cover";

type Stats = {
  totalBooks: number;
  booksRead: number;
  booksReading: number;
  booksToRead: number;
  booksReadThisYear: number;
  totalPagesRead: number;
  wishlistCount: number;
  currentlyReading: Array<{
    id: string;
    slug: string;
    title: string;
    coverUrl: string | null;
    currentPage: number;
    totalPages: number | null;
    authors: string[];
    progress: number;
  }>;
  recentBooks: Array<{
    id: string;
    slug: string;
    title: string;
    coverUrl: string | null;
    status: string;
    rating: number | null;
    authors: string[];
  }>;
};

export default function DashboardPage() {
  const t = useTranslations("nav");
  const tStats = useTranslations("stats");
  const tBook = useTranslations("book");
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch("/api/stats");
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <Flex justify="center" align="center" minH="400px">
          <Spinner size="xl" color="brand.500" />
        </Flex>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <Stack gap={8}>
        <Heading as="h1" size="2xl">
          {t("dashboard")}
        </Heading>

        {/* Stats Cards */}
        <Grid
          templateColumns={{
            base: "repeat(2, 1fr)",
            md: "repeat(4, 1fr)",
          }}
          gap={4}
        >
          <StatCard
            label={tStats("booksRead")}
            value={stats?.booksRead ?? 0}
            icon="📚"
          />
          <StatCard
            label={tStats("booksReading")}
            value={stats?.booksReading ?? 0}
            icon="📖"
          />
          <StatCard
            label={tStats("thisYear")}
            value={stats?.booksReadThisYear ?? 0}
            icon="📅"
          />
          <StatCard
            label={tStats("pagesRead")}
            value={stats?.totalPagesRead ?? 0}
            icon="📄"
          />
        </Grid>

        {/* Currently Reading */}
        {stats?.currentlyReading && stats.currentlyReading.length > 0 && (
          <Box>
            <Heading as="h2" size="lg" mb={4}>
              {tStats("booksReading")}
            </Heading>
            <Grid
              templateColumns={{
                base: "1fr",
                md: "repeat(2, 1fr)",
                lg: "repeat(3, 1fr)",
              }}
              gap={4}
            >
              {stats.currentlyReading.map((book) => (
                <Card.Root key={book.id}>
                  <Card.Body>
                    <Stack gap={3}>
                      <Box>
                        <Text fontWeight="semibold" lineClamp={1}>
                          {book.title}
                        </Text>
                        <Text fontSize="sm" color="fg.muted">
                          {book.authors.join(", ") || "Unknown author"}
                        </Text>
                      </Box>
                      <Box>
                        <Flex justify="space-between" mb={1}>
                          <Text fontSize="sm" color="fg.muted">
                            {tBook("progress")}
                          </Text>
                          <Text fontSize="sm" fontWeight="medium">
                            {book.progress}%
                          </Text>
                        </Flex>
                        <ProgressBar value={book.progress} />
                        <Text fontSize="xs" color="fg.muted" mt={1}>
                          {book.currentPage} / {book.totalPages ?? "?"}{" "}
                          {tBook("pages")}
                        </Text>
                      </Box>
                    </Stack>
                  </Card.Body>
                </Card.Root>
              ))}
            </Grid>
          </Box>
        )}

        {/* Recent Books */}
        <Box>
          <Flex justify="space-between" align="center" mb={4}>
            <Heading as="h2" size="lg">
              Recent Books
            </Heading>
            <Button asChild variant="ghost" size="sm">
              <NextLink href="/library">View all</NextLink>
            </Button>
          </Flex>

          {stats?.recentBooks && stats.recentBooks.length > 0 ? (
            <Grid
              templateColumns={{
                base: "repeat(2, 1fr)",
                md: "repeat(3, 1fr)",
                lg: "repeat(6, 1fr)",
              }}
              gap={4}
            >
              {stats.recentBooks.map((book) => (
                <Card.Root key={book.id} asChild>
                  <NextLink href={`/books/${book.slug}`}>
                    <Card.Body p={3}>
                      <Stack gap={2}>
                        <BookCover
                          coverUrl={book.coverUrl}
                          title={book.title}
                          size="sm"
                        />
                        <Box>
                          <Text
                            fontSize="sm"
                            fontWeight="semibold"
                            lineClamp={2}
                          >
                            {book.title}
                          </Text>
                          <Text fontSize="xs" color="fg.muted" lineClamp={1}>
                            {book.authors.join(", ") || "Unknown"}
                          </Text>
                        </Box>
                        <StatusBadge status={book.status} />
                      </Stack>
                    </Card.Body>
                  </NextLink>
                </Card.Root>
              ))}
            </Grid>
          ) : (
            <Card.Root>
              <Card.Body>
                <Stack align="center" py={8}>
                  <Text fontSize="4xl">📚</Text>
                  <Text color="fg.muted">{tBook("noBooks")}</Text>
                  <Button asChild colorPalette="brand" mt={2}>
                    <NextLink href="/library">{tBook("addBook")}</NextLink>
                  </Button>
                </Stack>
              </Card.Body>
            </Card.Root>
          )}
        </Box>
      </Stack>
    </Container>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: string;
}) {
  return (
    <Card.Root>
      <Card.Body>
        <Flex align="center" gap={3}>
          <Text fontSize="2xl">{icon}</Text>
          <Box>
            <Text fontSize="2xl" fontWeight="bold">
              {value.toLocaleString()}
            </Text>
            <Text fontSize="sm" color="fg.muted">
              {label}
            </Text>
          </Box>
        </Flex>
      </Card.Body>
    </Card.Root>
  );
}
