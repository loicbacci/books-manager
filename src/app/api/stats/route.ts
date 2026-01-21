import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);

    // Get basic book counts
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

    // Get books read this year
    const booksReadThisYear = await db.book.count({
      where: {
        userId,
        status: "READ",
        isWishlist: false,
        endDate: { gte: startOfYear },
      },
    });

    // Get total pages read (from completed books)
    const completedBooks = await db.book.findMany({
      where: { userId, status: "READ", isWishlist: false },
      select: { totalPages: true },
    });
    const totalPagesRead = completedBooks.reduce(
      (sum, book) => sum + (book.totalPages || 0),
      0
    );

    // Get currently reading books with progress
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

    // Get recent books
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
