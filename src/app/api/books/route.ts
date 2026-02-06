import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateUniqueSlug } from "@/lib/slugify";

/**
 * Payload for creating a book.
 *
 * Dates arrive as ISO strings and are converted to `Date` before persistence.
 * Optional relation arrays allow attaching authors/genres in a single request.
 */
const createBookSchema = z
  .object({
    title: z.string().min(1).max(500),
    coverUrl: z.string().url().optional().nullable(),
    status: z.enum(["TO_READ", "READING", "READ", "DROPPED"]).default("TO_READ"),
    totalPages: z.number().int().positive().optional().nullable(),
    currentPage: z.number().int().min(0).default(0),
    rating: z.number().int().min(1).max(5).optional().nullable(),
    summary: z.string().max(5000).optional().nullable(),
    favoriteQuote: z.string().max(2000).optional().nullable(),
    favoriteMoment: z.string().max(2000).optional().nullable(),
    startDate: z.string().datetime().optional().nullable(),
    endDate: z.string().datetime().optional().nullable(),
    isWishlist: z.boolean().default(false),
    formatId: z.string().optional().nullable(),
    seriesId: z.string().optional().nullable(),
    seriesOrder: z.number().min(0).optional().nullable(),
    authorIds: z.array(z.string()).optional(),
    genreIds: z.array(z.string()).optional(),
  })
  .superRefine((value, ctx) => {
    if (
      value.totalPages !== null &&
      value.totalPages !== undefined &&
      value.currentPage > value.totalPages
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "currentPage cannot exceed totalPages",
        path: ["currentPage"],
      });
    }
  });

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
 * List books for the authenticated user.
 *
 * Query params:
 * - `status`: filter by reading status
 * - `wishlist`: "true" to return wishlist items only
 * - `search`: case-insensitive title search
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const wishlist = searchParams.get("wishlist");
    const search = searchParams.get("search");
    const pageParam = searchParams.get("page");
    const pageSizeParam = searchParams.get("pageSize");
    const parseNumberParam = (value: string | null, fallback: number) => {
      if (!value) return fallback;
      const parsed = Number.parseInt(value, 10);
      return Number.isNaN(parsed) ? fallback : parsed;
    };
    const page = Math.max(1, parseNumberParam(pageParam, 1));
    const pageSize = Math.min(
      100,
      Math.max(1, parseNumberParam(pageSizeParam, 50))
    );
    const skip = (page - 1) * pageSize;

    const where: {
      userId: string;
      status?: "TO_READ" | "READING" | "READ" | "DROPPED";
      isWishlist?: boolean;
      title?: { contains: string; mode: "insensitive" };
    } = {
      userId: session.user.id,
    };

    if (status && ["TO_READ", "READING", "READ", "DROPPED"].includes(status)) {
      where.status = status as "TO_READ" | "READING" | "READ" | "DROPPED";
    }

    if (wishlist === "true") {
      where.isWishlist = true;
    }

    if (search) {
      where.title = { contains: search, mode: "insensitive" };
    }

    const [books, total] = await Promise.all([
      db.book.findMany({
        where,
        include: {
          authors: {
            include: {
              author: true,
            },
          },
          genres: {
            include: {
              genre: true,
            },
          },
          format: true,
          series: true,
        },
        orderBy: {
          updatedAt: "desc",
        },
        skip,
        take: pageSize,
      }),
      db.book.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return NextResponse.json({
      items: books,
      page,
      pageSize,
      total,
      totalPages,
    });
  } catch (error) {
    console.error("Error fetching books:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Create a book for the authenticated user.
 *
 * Generates a user-scoped slug from the title and attaches relations
 * if `authorIds`/`genreIds` are provided.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createBookSchema.parse(body);

    const { authorIds, genreIds, startDate, endDate, ...bookData } =
      validatedData;

    // Generate a unique per-user slug to support readable URLs.
    const slug = await generateUniqueSlug(
      validatedData.title,
      session.user.id,
      async (slug, userId) => {
        const existing = await db.book.findUnique({
          where: { userId_slug: { userId, slug } },
        });
        return !!existing;
      }
    );

    await validateBookRelations(session.user.id, {
      authorIds,
      genreIds,
      formatId: validatedData.formatId ?? null,
      seriesId: validatedData.seriesId ?? null,
    });

    const book = await db.book.create({
      data: {
        ...bookData,
        slug,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        userId: session.user.id,
        authors: authorIds?.length
          ? {
              create: authorIds.map((authorId) => ({
                authorId,
              })),
            }
          : undefined,
        genres: genreIds?.length
          ? {
              create: genreIds.map((genreId) => ({
                genreId,
              })),
            }
          : undefined,
      },
      include: {
        authors: {
          include: {
            author: true,
          },
        },
        genres: {
          include: {
            genre: true,
          },
        },
        format: true,
        series: true,
      },
    });

    return NextResponse.json(book, { status: 201 });
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

    console.error("Error creating book:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
