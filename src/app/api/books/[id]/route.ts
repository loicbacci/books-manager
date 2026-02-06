import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateUniqueSlug } from "@/lib/slugify";

/**
 * Payload for partial book updates.
 *
 * The route accepts ISO strings for dates, and optional relation arrays
 * to replace author/genre join tables when provided.
 */
const updateBookSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  coverUrl: z.string().url().optional().nullable(),
  status: z.enum(["TO_READ", "READING", "READ", "DROPPED"]).optional(),
  totalPages: z.number().int().positive().optional().nullable(),
  currentPage: z.number().int().min(0).optional(),
  rating: z.number().int().min(1).max(5).optional().nullable(),
  summary: z.string().max(5000).optional().nullable(),
  favoriteQuote: z.string().max(2000).optional().nullable(),
  favoriteMoment: z.string().max(2000).optional().nullable(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  isWishlist: z.boolean().optional(),
  formatId: z.string().optional().nullable(),
  seriesId: z.string().optional().nullable(),
  seriesOrder: z.number().min(0).optional().nullable(),
  authorIds: z.array(z.string()).optional(),
  genreIds: z.array(z.string()).optional(),
});

const bookAuthorInclude = {
  author: {
    include: {
      gender: true,
      nationalities: { include: { nationality: true } },
    },
  },
} as unknown as Prisma.BookAuthorInclude;

type RouteParams = {
  params: Promise<{ id: string }>;
};

async function validateBookRelations(
  userId: string,
  payload: {
    authorIds?: string[];
    genreIds?: string[];
    formatId?: string | null;
    seriesId?: string | null;
  }
) {
  const uniqueAuthorIds = payload.authorIds
    ? Array.from(new Set(payload.authorIds))
    : [];
  const uniqueGenreIds = payload.genreIds
    ? Array.from(new Set(payload.genreIds))
    : [];

  if (uniqueAuthorIds.length) {
    const count = await db.author.count({
      where: { id: { in: uniqueAuthorIds }, userId },
    });
    if (count !== uniqueAuthorIds.length) {
      throw new Error("Invalid authorIds");
    }
  }

  if (uniqueGenreIds.length) {
    const count = await db.genre.count({
      where: { id: { in: uniqueGenreIds }, userId },
    });
    if (count !== uniqueGenreIds.length) {
      throw new Error("Invalid genreIds");
    }
  }

  if (payload.formatId) {
    const format = await db.format.findFirst({
      where: { id: payload.formatId, userId },
      select: { id: true },
    });
    if (!format) {
      throw new Error("Invalid formatId");
    }
  }

  if (payload.seriesId) {
    const series = await db.series.findFirst({
      where: { id: payload.seriesId, userId },
      select: { id: true },
    });
    if (!series) {
      throw new Error("Invalid seriesId");
    }
  }
}

/**
 * Fetch a single book by slug or id (user-scoped).
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Try slug first, then ID to keep older URLs working.
    const book = await db.book.findFirst({
      where: {
        userId: session.user.id,
        OR: [{ slug: id }, { id }],
      },
      include: {
        authors: {
          include: bookAuthorInclude,
        },
        genres: {
          include: { genre: true },
        },
        format: true,
        series: true,
      },
    });

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    return NextResponse.json(book);
  } catch (error) {
    console.error("Error fetching book:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Update a single book by slug or id.
 *
 * When `authorIds` or `genreIds` are provided, the join tables are replaced.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateBookSchema.parse(body);

    // Ensure the book is user-owned (slug or id).
    const existingBook = await db.book.findFirst({
      where: {
        userId: session.user.id,
        OR: [{ slug: id }, { id }],
      },
    });

    if (!existingBook) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    const { authorIds, genreIds, startDate, endDate, ...bookData } =
      validatedData;

    // Build the update payload before relation updates.
    const updateData: Record<string, unknown> = {
      ...bookData,
    };

    // Regenerate slug when title changes (avoid collisions).
    if (validatedData.title) {
      const newSlug = await generateUniqueSlug(
        validatedData.title,
        session.user.id,
        async (slug, userId) => {
          const existing = await db.book.findUnique({
            where: { userId_slug: { userId, slug } },
          });
          // Exclude current book from conflict check
          return !!existing && existing.id !== existingBook.id;
        }
      );
      updateData.slug = newSlug;
    }

    if (startDate !== undefined) {
      updateData.startDate = startDate ? new Date(startDate) : null;
    }
    if (endDate !== undefined) {
      updateData.endDate = endDate ? new Date(endDate) : null;
    }

    const resolvedCurrentPage =
      validatedData.currentPage !== undefined
        ? validatedData.currentPage
        : existingBook.currentPage;
    const resolvedTotalPages =
      validatedData.totalPages !== undefined
        ? validatedData.totalPages
        : existingBook.totalPages;
    if (
      resolvedTotalPages !== null &&
      resolvedTotalPages !== undefined &&
      resolvedCurrentPage > resolvedTotalPages
    ) {
      return NextResponse.json(
        { error: "currentPage cannot exceed totalPages" },
        { status: 400 }
      );
    }

    await validateBookRelations(session.user.id, {
      authorIds,
      genreIds,
      formatId: validatedData.formatId ?? null,
      seriesId: validatedData.seriesId ?? null,
    });

    const book = await db.$transaction(async (tx) => {
      // Replace author relations when provided.
      if (authorIds !== undefined) {
        await tx.bookAuthor.deleteMany({
          where: { bookId: existingBook.id },
        });
        if (authorIds.length > 0) {
          await tx.bookAuthor.createMany({
            data: authorIds.map((authorId) => ({
              bookId: existingBook.id,
              authorId,
            })),
          });
        }
      }

      // Replace genre relations when provided.
      if (genreIds !== undefined) {
        await tx.bookGenre.deleteMany({
          where: { bookId: existingBook.id },
        });
        if (genreIds.length > 0) {
          await tx.bookGenre.createMany({
            data: genreIds.map((genreId) => ({
              bookId: existingBook.id,
              genreId,
            })),
          });
        }
      }

      return tx.book.update({
        where: { id: existingBook.id },
        data: updateData,
        include: {
          authors: {
            include: bookAuthorInclude,
          },
          genres: {
            include: { genre: true },
          },
          format: true,
          series: true,
        },
      });
    });

    return NextResponse.json(book);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message.startsWith("Invalid ")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Error updating book:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Delete a book by slug or id.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Ensure the book is user-owned before deletion.
    const existingBook = await db.book.findFirst({
      where: {
        userId: session.user.id,
        OR: [{ slug: id }, { id }],
      },
    });

    if (!existingBook) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    await db.book.delete({ where: { id: existingBook.id } });

    return NextResponse.json({ message: "Book deleted successfully" });
  } catch (error) {
    console.error("Error deleting book:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
