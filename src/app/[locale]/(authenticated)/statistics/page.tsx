"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
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
} from "@chakra-ui/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

type Stats = {
  summary: {
    totalBooksRead: number;
    totalPagesRead: number;
    averageRating: number;
    averagePages: number;
    uniqueAuthors: number;
    uniqueGenres: number;
  };
  genreDistribution: Array<{
    name: string;
    count: number;
    color: string | null;
  }>;
  genderDistribution: Array<{ name: string; count: number }>;
  nationalityDistribution: Array<{ name: string; count: number }>;
  monthlyReading: Array<{ month: string; count: number }>;
  monthlyPages: Array<{ month: string; pages: number }>;
  ratingDistribution: Array<{ rating: number; count: number }>;
};

const COLORS = [
  "#0073e6",
  "#00c49f",
  "#ffbb28",
  "#ff8042",
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#8dd1e1",
  "#a4de6c",
  "#d0ed57",
];

export default function StatisticsPage() {
  const t = useTranslations("stats");
  const tNav = useTranslations("nav");
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch("/api/stats/detailed");
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

  // Error state
  if (!stats) {
    return (
      <Container maxW="container.xl" py={8}>
        <Text>{t("loadError")}</Text>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <Stack gap={8}>
        {/* Page title */}
        <Heading as="h1" size="2xl">
          {tNav("statistics")}
        </Heading>

        {/* Summary cards */}
        <Grid
          templateColumns={{
            base: "repeat(2, 1fr)",
            md: "repeat(3, 1fr)",
            lg: "repeat(6, 1fr)",
          }}
          gap={4}
        >
          <StatCard
            label={t("booksRead")}
            value={stats.summary.totalBooksRead}
            icon="📚"
          />
          <StatCard
            label={t("pagesRead")}
            value={stats.summary.totalPagesRead.toLocaleString()}
            icon="📄"
          />
          <StatCard
            label={t("avgRating")}
            value={stats.summary.averageRating.toFixed(1)}
            icon="⭐"
          />
          <StatCard
            label={t("avgPages")}
            value={stats.summary.averagePages}
            icon="📖"
          />
          <StatCard
            label={t("authorsCount")}
            value={stats.summary.uniqueAuthors}
            icon="✍️"
          />
          <StatCard
            label={t("genresCount")}
            value={stats.summary.uniqueGenres}
            icon="🏷️"
          />
        </Grid>

        {/* Charts row: monthly reading */}
        <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={6}>
          {/* Monthly Reading */}
          <Card.Root>
            <Card.Body>
              <Heading as="h3" size="md" mb={4}>
                {t("booksPerMonth", { year: new Date().getFullYear() })}
              </Heading>
              <Box height={{ base: "220px", md: "300px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.monthlyReading}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar
                      dataKey="count"
                      fill="#0073e6"
                      name={t("booksLabel")}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Card.Body>
          </Card.Root>

          {/* Pages Per Month */}
          <Card.Root>
            <Card.Body>
              <Heading as="h3" size="md" mb={4}>
                {t("pagesPerMonth", { year: new Date().getFullYear() })}
              </Heading>
              <Box height={{ base: "220px", md: "300px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.monthlyPages}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="pages"
                      stroke="#0073e6"
                      strokeWidth={2}
                      name={t("pagesLabel")}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Card.Body>
          </Card.Root>
        </Grid>

        {/* Charts row: genre + rating */}
        <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={6}>
          {/* Genre Distribution */}
          <Card.Root>
            <Card.Body>
              <Heading as="h3" size="md" mb={4}>
                {t("genreDistribution")}
              </Heading>
              <Box height={{ base: "220px", md: "300px" }}>
                {stats.genreDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.genreDistribution}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ name, percent }) =>
                          `${name} (${(percent * 100).toFixed(0)}%)`
                        }
                        labelLine={false}
                      >
                        {stats.genreDistribution.map((entry, index) => (
                          <Cell
                            key={entry.name}
                            fill={entry.color || COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Flex justify="center" align="center" height="100%">
                    <Text color="fg.muted">{t("noData")}</Text>
                  </Flex>
                )}
              </Box>
            </Card.Body>
          </Card.Root>

          {/* Rating Distribution */}
          <Card.Root>
            <Card.Body>
              <Heading as="h3" size="md" mb={4}>
                {t("ratingDistribution")}
              </Heading>
              <Box height={{ base: "220px", md: "300px" }}>
                {stats.ratingDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.ratingDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="rating" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar
                        dataKey="count"
                        fill="#ffbb28"
                        name={t("booksLabel")}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Flex justify="center" align="center" height="100%">
                    <Text color="fg.muted">{t("noRatings")}</Text>
                  </Flex>
                )}
              </Box>
            </Card.Body>
          </Card.Root>
        </Grid>

        {/* Charts row: author demographics */}
        <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={6}>
          {/* Author Gender Distribution */}
          <Card.Root>
            <Card.Body>
              <Heading as="h3" size="md" mb={4}>
                {t("authorGenders")}
              </Heading>
              <Box height={{ base: "220px", md: "300px" }}>
                {stats.genderDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.genderDistribution}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ name, percent }) =>
                          `${name} (${(percent * 100).toFixed(0)}%)`
                        }
                        labelLine={false}
                      >
                        {stats.genderDistribution.map((entry, index) => (
                          <Cell
                            key={entry.name}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Flex justify="center" align="center" height="100%">
                    <Text color="fg.muted">{t("noData")}</Text>
                  </Flex>
                )}
              </Box>
            </Card.Body>
          </Card.Root>

          {/* Author Nationality Distribution */}
          <Card.Root>
            <Card.Body>
              <Heading as="h3" size="md" mb={4}>
                {t("authorNationalities")}
              </Heading>
              <Box height={{ base: "220px", md: "300px" }}>
                {stats.nationalityDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={stats.nationalityDistribution}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" allowDecimals={false} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={100}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip />
                      <Bar
                        dataKey="count"
                        fill="#82ca9d"
                        name={t("authorsLabel")}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Flex justify="center" align="center" height="100%">
                    <Text color="fg.muted">{t("noData")}</Text>
                  </Flex>
                )}
              </Box>
            </Card.Body>
          </Card.Root>
        </Grid>
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
  value: string | number;
  icon: string;
}) {
  return (
    <Card.Root>
      <Card.Body p={4}>
        <Flex direction="column" align="center" textAlign="center" gap={1}>
          <Text fontSize="2xl">{icon}</Text>
          <Text fontSize="xl" fontWeight="bold">
            {value}
          </Text>
          <Text fontSize="xs" color="fg.muted">
            {label}
          </Text>
        </Flex>
      </Card.Body>
    </Card.Root>
  );
}

