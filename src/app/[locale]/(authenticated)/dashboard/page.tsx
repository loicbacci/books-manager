"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
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
  Icon,
} from "@chakra-ui/react";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatusBadge } from "@/components/ui/status-badge";
import { BookCover } from "@/components/ui/book-cover";
import {
  FiBookOpen,
  FiCalendar,
  FiBook,
  FiFileText,
  FiEdit3,
  FiBookmark,
} from "react-icons/fi";

type Stats = {
  totalBooks: number;
  booksRead: number;
  booksReading: number;
  booksToRead: number;
  booksReadThisYear: number;
  booksReadThisMonth: number;
  pagesReadThisYear: number;
  pagesReadThisMonth: number;
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
  wishlistBooks: Array<{
    id: string;
    slug: string;
    title: string;
    coverUrl: string | null;
    status: string;
    rating: number | null;
    authors: string[];
  }>;
  recentFinishedBooks: Array<{
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
  const tCommon = useTranslations("common");
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;
    async function fetchStats() {
      try {
        const response = await fetch("/api/stats", {
          signal: controller.signal,
        });
        if (response.ok) {
          const data = await response.json();
          if (isActive) {
            setStats(data);
          }
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        console.error("Failed to fetch stats:", error);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }
    fetchStats();
    return () => {
      isActive = false;
      controller.abort();
    };
  }, []);

  // Loading state
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
        {/* Page title */}
        <Heading as="h1" size="2xl">
          {t("dashboard")}
        </Heading>

        {/* KPI summary cards */}
        <Grid
          templateColumns={{
            base: "repeat(2, 1fr)",
            md: "repeat(3, 1fr)",
            lg: "repeat(5, 1fr)",
          }}
          gap={{ base: 3, md: 4 }}
        >
          <StatCard
            label={tStats("booksRead")}
            subLabel={tStats("thisYear")}
            value={stats?.booksReadThisYear ?? 0}
            icon={FiBookOpen}
          />
          <StatCard
            label={tStats("booksRead")}
            subLabel={tStats("thisMonth")}
            value={stats?.booksReadThisMonth ?? 0}
            icon={FiCalendar}
          />
          <StatCard
            label={tStats("booksReading")}
            value={stats?.booksReading ?? 0}
            icon={FiBook}
          />
          <StatCard
            label={tStats("pagesRead")}
            subLabel={tStats("thisYear")}
            value={stats?.pagesReadThisYear ?? 0}
            icon={FiFileText}
          />
          <StatCard
            label={tStats("pagesRead")}
            subLabel={tStats("thisMonth")}
            value={stats?.pagesReadThisMonth ?? 0}
            icon={FiEdit3}
          />
        </Grid>

        {/* Currently reading list */}
        {stats?.currentlyReading && stats.currentlyReading.length > 0 && (
          <Card.Root bg="surface.card" boxShadow="card">
            <Card.Body p={{ base: 4, md: 6 }}>
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
                      <Flex
                        gap={4}
                        direction={{ base: "row", md: "column" }}
                        align={{ base: "flex-start", md: "stretch" }}
                      >
                        <Box
                          w={{ base: "84px", md: "full" }}
                          flexShrink={0}
                        >
                          <BookCover
                            coverUrl={book.coverUrl}
                            title={book.title}
                            size="xs"
                          />
                        </Box>
                        <Stack gap={3} flex={1}>
                          <Box>
                            <Text fontWeight="semibold" lineClamp={2}>
                              {book.title}
                            </Text>
                            <Text fontSize="sm" color="fg.muted" lineClamp={1}>
                              {book.authors.join(", ") ||
                                tBook("unknownAuthor")}
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
                      </Flex>
                    </Card.Body>
                  </Card.Root>
                ))}
              </Grid>
            </Card.Body>
          </Card.Root>
        )}

        {/* Wishlist books grid */}
        <Card.Root bg="surface.card" boxShadow="card">
          <Card.Body p={{ base: 4, md: 6 }}>
            <Flex justify="space-between" align="center" mb={4}>
              <Heading as="h2" size="lg">
                {tBook("wishlist")}
              </Heading>
              <Button asChild variant="ghost" size="sm">
                <Link href="/library">{tCommon("viewAll")}</Link>
              </Button>
            </Flex>

            {stats?.wishlistBooks && stats.wishlistBooks.length > 0 ? (
              <Grid
                templateColumns={{
                  base: "repeat(2, 1fr)",
                  md: "repeat(3, 1fr)",
                  lg: "repeat(6, 1fr)",
                }}
                gap={4}
              >
                {stats.wishlistBooks.map((book) => (
                  <Card.Root key={book.id} asChild>
                    <Link href={`/books/${book.slug}`}>
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
                              {book.authors.join(", ") ||
                                tBook("unknownAuthor")}
                            </Text>
                          </Box>
                          <StatusBadge status={book.status} />
                        </Stack>
                      </Card.Body>
                    </Link>
                  </Card.Root>
                ))}
              </Grid>
            ) : (
              <Card.Root>
                <Card.Body>
                  <Stack align="center" py={8}>
                    <Icon as={FiBookmark} boxSize={8} color="brand.fg" />
                    <Text color="fg.muted">{tBook("noBooks")}</Text>
                    <Button asChild colorPalette="brand" mt={2}>
                      <Link href="/library">{tBook("addBook")}</Link>
                    </Button>
                  </Stack>
                </Card.Body>
              </Card.Root>
            )}
          </Card.Body>
        </Card.Root>

        {/* Recently finished books grid */}
        <Card.Root bg="surface.card" boxShadow="card">
          <Card.Body p={{ base: 4, md: 6 }}>
            <Flex justify="space-between" align="center" mb={4}>
            <Heading as="h2" size="lg">
              {tStats("recentFinished")}
            </Heading>
            <Button asChild variant="ghost" size="sm">
              <Link href="/library">{tCommon("viewAll")}</Link>
            </Button>
            </Flex>

            {stats?.recentFinishedBooks &&
            stats.recentFinishedBooks.length > 0 ? (
              <Grid
                templateColumns={{
                  base: "repeat(2, 1fr)",
                  md: "repeat(3, 1fr)",
                  lg: "repeat(6, 1fr)",
                }}
                gap={4}
              >
                {stats.recentFinishedBooks.map((book) => (
                  <Card.Root key={book.id} asChild>
                    <Link href={`/books/${book.slug}`}>
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
                            {book.authors.join(", ") ||
                              tBook("unknownAuthor")}
                          </Text>
                          </Box>
                          <StatusBadge status={book.status} />
                        </Stack>
                      </Card.Body>
                    </Link>
                  </Card.Root>
                ))}
              </Grid>
            ) : (
              // Empty state
              <Card.Root>
                <Card.Body>
                  <Stack align="center" py={8}>
                    <Icon as={FiBookOpen} boxSize={8} color="brand.fg" />
                    <Text color="fg.muted">{tBook("noBooks")}</Text>
                    <Button asChild colorPalette="brand" mt={2}>
                      <Link href="/library">{tBook("addBook")}</Link>
                    </Button>
                  </Stack>
                </Card.Body>
              </Card.Root>
            )}
          </Card.Body>
        </Card.Root>
      </Stack>
    </Container>
  );
}

function StatCard({
  label,
  subLabel,
  value,
  icon,
}: {
  label: string;
  subLabel?: string;
  value: number;
  icon: React.ComponentType<{ size?: number }>;
}) {
  const StatIcon = icon;
  return (
    // Small stat card used in the KPI grid
    <Card.Root>
      <Card.Body p={{ base: 3, md: 4 }}>
        <Flex align="center" gap={{ base: 2, md: 3 }}>
          <Box color="brand.fg">
            <StatIcon size={22} />
          </Box>
          <Box>
            <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="bold">
              {value.toLocaleString()}
            </Text>
            <Text
              fontSize={{ base: "xs", md: "sm" }}
              color="fg.muted"
              lineClamp={{ base: 2, md: 1 }}
            >
              {label}
            </Text>
            {subLabel ? (
              <Text fontSize="xs" color="fg.muted" lineClamp={1}>
                {subLabel}
              </Text>
            ) : null}
          </Box>
        </Flex>
      </Card.Body>
    </Card.Root>
  );
}

