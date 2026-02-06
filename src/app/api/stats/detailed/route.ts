import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * Detailed stats for the statistics page.
 *
 * Computes distributions (genres, genders, nationalities),
 * monthly trends, and summary aggregates for charts.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);
    const nextYearStart = new Date(currentYear + 1, 0, 1);

    type SummaryRow = {
      total_books: number;
      total_pages: number;
      avg_rating: number | null;
    };
    type CountRow = { count: number };
    type GenreRow = {
      id: string;
      name: string;
      color: string | null;
      count: number;
    };
    type DistributionRow = { name: string; count: number };
    type MonthlyCountRow = { month: Date; count: number };
    type MonthlyPagesRow = { month: Date; pages: number };
    type RatingRow = { rating: number; count: number };

    const [
      summaryRows,
      genreRows,
      genderRows,
      nationalityRows,
      monthlyReadingRows,
      monthlyPagesRows,
      ratingRows,
      uniqueAuthorsRows,
      uniqueGenresRows,
    ] = await Promise.all([
      db.$queryRaw<SummaryRow[]>(Prisma.sql`
        SELECT
          COUNT(*)::int AS total_books,
          COALESCE(SUM("totalPages"), 0)::int AS total_pages,
          AVG("rating")::float AS avg_rating
        FROM "books"
        WHERE "userId" = ${userId}
          AND "status" = 'READ'
          AND "isWishlist" = false
      `),
      db.$queryRaw<GenreRow[]>(Prisma.sql`
        SELECT
          g."id",
          g."name",
          g."color",
          COUNT(*)::int AS count
        FROM "books" b
        JOIN "book_genres" bg ON bg."bookId" = b."id"
        JOIN "genres" g ON g."id" = bg."genreId"
        WHERE b."userId" = ${userId}
          AND b."status" = 'READ'
          AND b."isWishlist" = false
        GROUP BY g."id", g."name", g."color"
        ORDER BY count DESC
        LIMIT 10
      `),
      db.$queryRaw<DistributionRow[]>(Prisma.sql`
        SELECT
          COALESCE(g."name", 'Unknown') AS name,
          COUNT(DISTINCT a."id")::int AS count
        FROM "books" b
        JOIN "book_authors" ba ON ba."bookId" = b."id"
        JOIN "authors" a ON a."id" = ba."authorId"
        LEFT JOIN "genders" g ON g."id" = a."genderId"
        WHERE b."userId" = ${userId}
          AND b."status" = 'READ'
          AND b."isWishlist" = false
        GROUP BY COALESCE(g."name", 'Unknown')
        ORDER BY count DESC
      `),
      db.$queryRaw<DistributionRow[]>(Prisma.sql`
        SELECT
          COALESCE(n."name", 'Unknown') AS name,
          COUNT(DISTINCT a."id")::int AS count
        FROM "books" b
        JOIN "book_authors" ba ON ba."bookId" = b."id"
        JOIN "authors" a ON a."id" = ba."authorId"
        LEFT JOIN "author_nationalities" an ON an."authorId" = a."id"
        LEFT JOIN "nationalities" n ON n."id" = an."nationalityId"
        WHERE b."userId" = ${userId}
          AND b."status" = 'READ'
          AND b."isWishlist" = false
        GROUP BY COALESCE(n."name", 'Unknown')
        ORDER BY count DESC
        LIMIT 10
      `),
      db.$queryRaw<MonthlyCountRow[]>(Prisma.sql`
        SELECT
          date_trunc('month', b."endDate") AS month,
          COUNT(*)::int AS count
        FROM "books" b
        WHERE b."userId" = ${userId}
          AND b."status" = 'READ'
          AND b."isWishlist" = false
          AND b."endDate" >= ${yearStart}
          AND b."endDate" < ${nextYearStart}
        GROUP BY month
        ORDER BY month
      `),
      db.$queryRaw<MonthlyPagesRow[]>(Prisma.sql`
        SELECT
          date_trunc('month', b."endDate") AS month,
          COALESCE(SUM(b."totalPages"), 0)::int AS pages
        FROM "books" b
        WHERE b."userId" = ${userId}
          AND b."status" = 'READ'
          AND b."isWishlist" = false
          AND b."endDate" >= ${yearStart}
          AND b."endDate" < ${nextYearStart}
        GROUP BY month
        ORDER BY month
      `),
      db.$queryRaw<RatingRow[]>(Prisma.sql`
        SELECT
          b."rating"::int AS rating,
          COUNT(*)::int AS count
        FROM "books" b
        WHERE b."userId" = ${userId}
          AND b."status" = 'READ'
          AND b."isWishlist" = false
          AND b."rating" IS NOT NULL
        GROUP BY b."rating"
        ORDER BY b."rating"
      `),
      db.$queryRaw<CountRow[]>(Prisma.sql`
        SELECT COUNT(DISTINCT a."id")::int AS count
        FROM "books" b
        JOIN "book_authors" ba ON ba."bookId" = b."id"
        JOIN "authors" a ON a."id" = ba."authorId"
        WHERE b."userId" = ${userId}
          AND b."status" = 'READ'
          AND b."isWishlist" = false
      `),
      db.$queryRaw<CountRow[]>(Prisma.sql`
        SELECT COUNT(DISTINCT bg."genreId")::int AS count
        FROM "books" b
        JOIN "book_genres" bg ON bg."bookId" = b."id"
        WHERE b."userId" = ${userId}
          AND b."status" = 'READ'
          AND b."isWishlist" = false
      `),
    ]);

    const summary = summaryRows[0] ?? {
      total_books: 0,
      total_pages: 0,
      avg_rating: null,
    };

    const totalBooksRead = summary.total_books ?? 0;
    const totalPagesRead = summary.total_pages ?? 0;
    const averageRating = summary.avg_rating ?? 0;
    const uniqueAuthors = uniqueAuthorsRows[0]?.count ?? 0;
    const uniqueGenres = uniqueGenresRows[0]?.count ?? 0;

    const readingByMonth = new Map<number, number>();
    monthlyReadingRows.forEach((row) => {
      readingByMonth.set(row.month.getMonth(), row.count);
    });
    const pagesByMonth = new Map<number, number>();
    monthlyPagesRows.forEach((row) => {
      pagesByMonth.set(row.month.getMonth(), row.pages);
    });

    const monthlyReading = Array.from({ length: 12 }, (_value, index) => {
      const monthStart = new Date(currentYear, index, 1);
      return {
        month: monthStart.toLocaleString("default", { month: "short" }),
        count: readingByMonth.get(index) ?? 0,
      };
    });

    const monthlyPages = Array.from({ length: 12 }, (_value, index) => {
      const monthStart = new Date(currentYear, index, 1);
      return {
        month: monthStart.toLocaleString("default", { month: "short" }),
        pages: pagesByMonth.get(index) ?? 0,
      };
    });

    const genreDistribution = genreRows.map((row) => ({
      name: row.name,
      count: row.count,
      color: row.color,
    }));

    const genderDistribution = genderRows.map((row) => ({
      name: row.name,
      count: row.count,
    }));

    const nationalityDistribution = nationalityRows.map((row) => ({
      name: row.name,
      count: row.count,
    }));

    const ratingDistribution = ratingRows.map((row) => ({
      rating: row.rating,
      count: row.count,
    }));

    const averagePages =
      totalBooksRead > 0 ? Math.round(totalPagesRead / totalBooksRead) : 0;

    return NextResponse.json({
      summary: {
        totalBooksRead,
        totalPagesRead,
        averageRating: Math.round(averageRating * 10) / 10,
        averagePages,
        uniqueAuthors,
        uniqueGenres,
      },
      genreDistribution,
      genderDistribution,
      nationalityDistribution,
      monthlyReading,
      monthlyPages,
      ratingDistribution,
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
