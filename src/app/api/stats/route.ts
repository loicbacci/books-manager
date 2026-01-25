import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * Lightweight stats for the dashboard summary cards.
 *
 * Includes counts, recent activity, and a short "currently reading" list.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const now = new Date();
    const currentYear = now.getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const startOfMonth = new Date(currentYear, now.getMonth(), 1);

    // High-level counts used by KPI cards.
    const [totalBooks, booksRead, booksReading, booksToRead, wishlistCount] =
      await Promise.all([
        db.book.count({ where: { userId, isWishlist: false } }),
        db.book.count({ where: { userId, status: "READ", isWishlist: false } }),
        db.book.count({
          where: { userId, status: "READING", isWishlist: false },
        }),
        db.book.count({
          where: { userId, status: "TO_READ", isWishlist: false },
        }),
        db.book.count({ where: { userId, isWishlist: true } }),
      ]);

    // Read count since Jan 1 for year-to-date metrics.
    const [booksReadThisYear, booksReadThisMonth] = await Promise.all([
      db.book.count({
        where: {
          userId,
          status: "READ",
          isWishlist: false,
          endDate: { gte: startOfYear },
        },
      }),
      db.book.count({
        where: {
          userId,
          status: "READ",
          isWishlist: false,
          endDate: { gte: startOfMonth },
        },
      }),
    ]);

    // Page totals are derived from completed books only.
    const [pagesReadThisYearAggregate, pagesReadThisMonthAggregate] =
      await Promise.all([
        db.book.aggregate({
          where: {
            userId,
            status: "READ",
            isWishlist: false,
            endDate: { gte: startOfYear },
          },
          _sum: { totalPages: true },
        }),
        db.book.aggregate({
          where: {
            userId,
            status: "READ",
            isWishlist: false,
            endDate: { gte: startOfMonth },
          },
          _sum: { totalPages: true },
        }),
      ]);
    const pagesReadThisYear = pagesReadThisYearAggregate._sum.totalPages ?? 0;
    const pagesReadThisMonth = pagesReadThisMonthAggregate._sum.totalPages ?? 0;

    // Short list for the "currently reading" section.
    const currentlyReading = await db.book.findMany({
      where: { userId, status: "READING", isWishlist: false },
      select: {
        id: true,
        slug: true,
        title: true,
        coverUrl: true,
        currentPage: true,
        totalPages: true,
        authors: {
          select: {
            author: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    });

    // Most recently finished books for the dashboard list.
    const recentFinishedBooks = await db.book.findMany({
      where: {
        userId,
        status: "READ",
        isWishlist: false,
        endDate: { not: null },
      },
      select: {
        id: true,
        slug: true,
        title: true,
        coverUrl: true,
        status: true,
        rating: true,
        authors: {
          select: {
            author: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: [{ endDate: "desc" }, { updatedAt: "desc" }],
      take: 6,
    });

    const wishlistBooks = await db.book.findMany({
      where: { userId, isWishlist: true },
      select: {
        id: true,
        slug: true,
        title: true,
        coverUrl: true,
        status: true,
        rating: true,
        authors: {
          select: {
            author: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 6,
    });

    return NextResponse.json({
      totalBooks,
      booksRead,
      booksReading,
      booksToRead,
      booksReadThisYear,
      booksReadThisMonth,
      pagesReadThisYear,
      pagesReadThisMonth,
      wishlistCount,
      currentlyReading: currentlyReading.map((book) => ({
        ...book,
        authors: book.authors.map((ba) => ba.author.name),
        progress: book.totalPages
          ? Math.round((book.currentPage / book.totalPages) * 100)
          : 0,
      })),
      recentFinishedBooks: recentFinishedBooks.map((book) => ({
        ...book,
        authors: book.authors.map((ba) => ba.author.name),
      })),
      wishlistBooks: wishlistBooks.map((book) => ({
        ...book,
        authors: book.authors.map((ba) => ba.author.name),
      })),
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
