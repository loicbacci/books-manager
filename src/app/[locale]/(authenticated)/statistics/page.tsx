"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  RiBookLine,
  RiBookOpenLine,
  RiFileTextLine,
  RiLoaderLine,
  RiPriceTag3Line,
  RiQuillPenLine,
  RiStarLine,
} from "@remixicon/react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";

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

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const tooltipContentStyle = {
  backgroundColor: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "12px",
  color: "var(--popover-foreground)",
  fontSize: 12,
};

const axisTick = { fill: "var(--muted-foreground)", fontSize: 12 };

export default function StatisticsPage() {
  const t = useTranslations("stats");
  const tNav = useTranslations("nav");
  const isMobile = useIsMobile();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;
    async function fetchStats() {
      try {
        const response = await fetch("/api/stats/detailed", {
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

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <RiLoaderLine className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-sm text-muted-foreground">{t("loadError")}</p>
      </div>
    );
  }

  const currentYear = new Date().getFullYear();
  const pieLabel = isMobile
    ? false
    : ({ name, percent }: { name: string; percent: number }) =>
        `${name} (${(percent * 100).toFixed(0)}%)`;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-heading text-3xl font-semibold tracking-tight">
        {tNav("statistics")}
      </h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          icon={RiBookOpenLine}
          label={t("booksRead")}
          value={stats.summary.totalBooksRead}
        />
        <StatCard
          icon={RiFileTextLine}
          label={t("pagesRead")}
          value={stats.summary.totalPagesRead.toLocaleString()}
        />
        <StatCard
          icon={RiStarLine}
          label={t("avgRating")}
          value={stats.summary.averageRating.toFixed(1)}
        />
        <StatCard
          icon={RiBookLine}
          label={t("avgPages")}
          value={stats.summary.averagePages}
        />
        <StatCard
          icon={RiQuillPenLine}
          label={t("authorsCount")}
          value={stats.summary.uniqueAuthors}
        />
        <StatCard
          icon={RiPriceTag3Line}
          label={t("genresCount")}
          value={stats.summary.uniqueGenres}
        />
      </div>

      {/* Monthly trends */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title={t("booksPerMonth", { year: currentYear })}>
          <BarChart data={stats.monthlyReading}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="month" tick={axisTick} />
            <YAxis allowDecimals={false} tick={axisTick} />
            <Tooltip contentStyle={tooltipContentStyle} />
            <Bar
              dataKey="count"
              fill="var(--chart-1)"
              name={t("booksLabel")}
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ChartCard>

        <ChartCard title={t("pagesPerMonth", { year: currentYear })}>
          <LineChart data={stats.monthlyPages}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="month" tick={axisTick} />
            <YAxis tick={axisTick} />
            <Tooltip contentStyle={tooltipContentStyle} />
            <Line
              type="monotone"
              dataKey="pages"
              stroke="var(--chart-2)"
              strokeWidth={2}
              name={t("pagesLabel")}
              dot={false}
            />
          </LineChart>
        </ChartCard>
      </div>

      {/* Genre + rating distribution */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title={t("genreDistribution")}
          isEmpty={stats.genreDistribution.length === 0}
          emptyText={t("noData")}
        >
          <PieChart>
            <Pie
              data={stats.genreDistribution}
              dataKey="count"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={pieLabel}
              labelLine={!isMobile}
            >
              {stats.genreDistribution.map((entry, index) => (
                <Cell
                  key={entry.name}
                  fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipContentStyle} />
          </PieChart>
        </ChartCard>

        <ChartCard
          title={t("ratingDistribution")}
          isEmpty={stats.ratingDistribution.length === 0}
          emptyText={t("noRatings")}
        >
          <BarChart data={stats.ratingDistribution}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="rating" tick={axisTick} />
            <YAxis allowDecimals={false} tick={axisTick} />
            <Tooltip contentStyle={tooltipContentStyle} />
            <Bar
              dataKey="count"
              fill="var(--chart-3)"
              name={t("booksLabel")}
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ChartCard>
      </div>

      {/* Author demographics */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title={t("authorGenders")}
          isEmpty={stats.genderDistribution.length === 0}
          emptyText={t("noData")}
        >
          <PieChart>
            <Pie
              data={stats.genderDistribution}
              dataKey="count"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={pieLabel}
              labelLine={!isMobile}
            >
              {stats.genderDistribution.map((entry, index) => (
                <Cell
                  key={entry.name}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipContentStyle} />
          </PieChart>
        </ChartCard>

        <ChartCard
          title={t("authorNationalities")}
          isEmpty={stats.nationalityDistribution.length === 0}
          emptyText={t("noData")}
          chartClassName="h-[320px] md:h-[300px]"
        >
          <BarChart data={stats.nationalityDistribution} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis type="number" allowDecimals={false} tick={axisTick} />
            <YAxis
              type="category"
              dataKey="name"
              width={100}
              tick={axisTick}
            />
            <Tooltip contentStyle={tooltipContentStyle} />
            <Bar
              dataKey="count"
              fill="var(--chart-4)"
              name={t("authorsLabel")}
              radius={[0, 6, 6, 0]}
            />
          </BarChart>
        </ChartCard>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
}) {
  return (
    <Card size="sm">
      <CardContent className="flex flex-col items-center gap-1 text-center">
        <Icon className="size-5 text-primary" />
        <p className="text-lg font-semibold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

function ChartCard({
  title,
  isEmpty,
  emptyText,
  chartClassName,
  children,
}: {
  title: string;
  isEmpty?: boolean;
  emptyText?: string;
  chartClassName?: string;
  children: React.ReactElement;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={chartClassName ?? "h-[220px] md:h-[300px]"}>
          {isEmpty ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              {emptyText}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {children}
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
