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
const createBookSchema = z.object({
  title: z.string().min(1).max(500),
  coverUrl: z.string().url().optional().nullable(),
  status: z.enum(["TO_READ", "READING", "READ", "DROPPED"]).default("TO_READ"),
  totalPages: z.number().int().positive().optional().nullable(),
  currentPage: z.number().int().min(0).default(0),
  rating: z.number().int().min(1).max(10).optional().nullable(),
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
});

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

    const books = await db.book.findMany({
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
    });

    return NextResponse.json(books);
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

    console.error("Error creating book:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
