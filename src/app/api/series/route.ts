import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateUniqueSlug } from "@/lib/slugify";

/**
 * Payload for creating a series.
 */
const createSeriesSchema = z.object({
  name: z.string().min(1).max(200),
});

/**
 * List series for the authenticated user.
 *
 * Includes a small preview of books in each series for dashboard cards.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
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
      Math.max(1, parseNumberParam(pageSizeParam, 24))
    );
    const skip = (page - 1) * pageSize;

    const where = { userId: session.user.id };
    const [series, total] = await Promise.all([
      db.series.findMany({
        where,
        orderBy: { name: "asc" },
        include: {
          _count: { select: { books: true } },
          books: {
            select: {
              id: true,
              title: true,
              coverUrl: true,
            },
            orderBy: [{ seriesOrder: "asc" }, { title: "asc" }],
            take: 4,
          },
        },
        skip,
        take: pageSize,
      }),
      db.series.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return NextResponse.json({
      items: series,
      page,
      pageSize,
      total,
      totalPages,
    });
  } catch (error) {
    console.error("Error fetching series:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Create a new series for the authenticated user.
 *
 * Generates a per-user slug from the series name.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createSeriesSchema.parse(body);

    const slug = await generateUniqueSlug(
      validatedData.name,
      session.user.id,
      async (candidate, userId) => {
        const existing = await db.series.findUnique({
          where: { userId_slug: { userId, slug: candidate } },
        });
        return !!existing;
      }
    );

    const series = await db.series.create({
      data: {
        name: validatedData.name,
        slug,
        userId: session.user.id,
      },
    });

    return NextResponse.json(series, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating series:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
