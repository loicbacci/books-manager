import { NextResponse } from "next/server";
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

    // Load completed books with relations for aggregation.
    const completedBooks = await db.book.findMany({
      where: { userId, status: "READ", isWishlist: false },
      include: {
        genres: { include: { genre: true } },
        authors: {
          include: {
            author: {
              include: { gender: true, nationality: true },
            },
          },
        },
      },
    });

    // Genre distribution (top 10) for pie charts.
    const genreCount: Record<
      string,
      { name: string; count: number; color: string | null }
    > = {};
    completedBooks.forEach((book) => {
      book.genres.forEach(({ genre }) => {
        if (!genreCount[genre.id]) {
          genreCount[genre.id] = {
            name: genre.name,
            count: 0,
            color: genre.color,
          };
        }
        genreCount[genre.id].count++;
      });
    });
    const genreDistribution = Object.values(genreCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Author gender distribution (unique authors).
    const genderCount: Record<string, { name: string; count: number }> = {};
    const countedAuthors = new Set<string>();
    completedBooks.forEach((book) => {
      book.authors.forEach(({ author }) => {
        if (!countedAuthors.has(author.id)) {
          countedAuthors.add(author.id);
          const genderName = author.gender?.name || "Unknown";
          if (!genderCount[genderName]) {
            genderCount[genderName] = { name: genderName, count: 0 };
          }
          genderCount[genderName].count++;
        }
      });
    });
    const genderDistribution = Object.values(genderCount).sort(
      (a, b) => b.count - a.count
    );

    // Author nationality distribution (unique authors, top 10).
    const nationalityCount: Record<string, { name: string; count: number }> =
      {};
    const countedAuthorsNat = new Set<string>();
    completedBooks.forEach((book) => {
      book.authors.forEach(({ author }) => {
        if (!countedAuthorsNat.has(author.id)) {
          countedAuthorsNat.add(author.id);
          const natName = author.nationality?.name || "Unknown";
          if (!nationalityCount[natName]) {
            nationalityCount[natName] = { name: natName, count: 0 };
          }
          nationalityCount[natName].count++;
        }
      });
    });
    const nationalityDistribution = Object.values(nationalityCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Books read per month for the current year.
    const monthlyReading: { month: string; count: number }[] = [];
    for (let i = 0; i < 12; i++) {
      const monthStart = new Date(currentYear, i, 1);
      const monthEnd = new Date(currentYear, i + 1, 0, 23, 59, 59);
      const count = completedBooks.filter((book) => {
        if (!book.endDate) return false;
        const endDate = new Date(book.endDate);
        return endDate >= monthStart && endDate <= monthEnd;
      }).length;
      const monthName = monthStart.toLocaleString("default", {
        month: "short",
      });
      monthlyReading.push({ month: monthName, count });
    }

    // Rating distribution (count per rating value).
    const ratingDist: Record<number, number> = {};
    completedBooks.forEach((book) => {
      if (book.rating) {
        if (!ratingDist[book.rating]) {
          ratingDist[book.rating] = 0;
        }
        ratingDist[book.rating]++;
      }
    });
    const ratingDistribution = Object.entries(ratingDist)
      .map(([rating, count]) => ({ rating: parseInt(rating), count }))
      .sort((a, b) => a.rating - b.rating);

    // Pages read per month for the current year.
    const monthlyPages: { month: string; pages: number }[] = [];
    for (let i = 0; i < 12; i++) {
      const monthStart = new Date(currentYear, i, 1);
      const monthEnd = new Date(currentYear, i + 1, 0, 23, 59, 59);
      const pages = completedBooks
        .filter((book) => {
          if (!book.endDate) return false;
          const endDate = new Date(book.endDate);
          return endDate >= monthStart && endDate <= monthEnd;
        })
        .reduce((sum, book) => sum + (book.totalPages || 0), 0);
      const monthName = monthStart.toLocaleString("default", {
        month: "short",
      });
      monthlyPages.push({ month: monthName, pages });
    }

    // Summary stats shown alongside charts.
    const totalBooksRead = completedBooks.length;
    const totalPagesRead = completedBooks.reduce(
      (sum, book) => sum + (book.totalPages || 0),
      0
    );
    const averageRating =
      completedBooks.filter((b) => b.rating).length > 0
        ? completedBooks
            .filter((b) => b.rating)
            .reduce((sum, b) => sum + (b.rating || 0), 0) /
          completedBooks.filter((b) => b.rating).length
        : 0;
    const averagePages =
      totalBooksRead > 0 ? Math.round(totalPagesRead / totalBooksRead) : 0;

    return NextResponse.json({
      summary: {
        totalBooksRead,
        totalPagesRead,
        averageRating: Math.round(averageRating * 10) / 10,
        averagePages,
        uniqueAuthors: countedAuthors.size,
        uniqueGenres: Object.keys(genreCount).length,
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
