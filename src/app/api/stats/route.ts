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
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);

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
    const booksReadThisYear = await db.book.count({
      where: {
        userId,
        status: "READ",
        isWishlist: false,
        endDate: { gte: startOfYear },
      },
    });

    // Page total is derived from completed books only.
    const completedBooks = await db.book.findMany({
      where: { userId, status: "READ", isWishlist: false },
      select: { totalPages: true },
    });
    const totalPagesRead = completedBooks.reduce(
      (sum, book) => sum + (book.totalPages || 0),
      0
    );

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

    // Recent updates used for the "recent activity" list.
    const recentBooks = await db.book.findMany({
      where: { userId, isWishlist: false },
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
      totalPagesRead,
      wishlistCount,
      currentlyReading: currentlyReading.map((book) => ({
        ...book,
        authors: book.authors.map((ba) => ba.author.name),
        progress: book.totalPages
          ? Math.round((book.currentPage / book.totalPages) * 100)
          : 0,
      })),
      recentBooks: recentBooks.map((book) => ({
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
