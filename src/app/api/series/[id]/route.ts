import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateUniqueSlug } from "@/lib/slugify";

/**
 * Payload for updating a series.
 */
const updateSeriesSchema = z.object({
  name: z.string().min(1).max(200),
});

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * Fetch a series by id or slug (user-scoped).
 *
 * Returns series metadata and ordered books within that series.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const series = await db.series.findFirst({
      where: {
        userId: session.user.id,
        OR: [{ id }, { slug: id }],
      },
      include: {
        books: {
          include: {
            authors: {
              include: { author: true },
            },
            genres: {
              include: { genre: true },
            },
            format: true,
            series: true,
          },
          orderBy: [{ seriesOrder: "asc" }, { title: "asc" }],
        },
      },
    });

    if (!series) {
      return NextResponse.json({ error: "Series not found" }, { status: 404 });
    }

    return NextResponse.json(series);
  } catch (error) {
    console.error("Error fetching series:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Update a series by id or slug (user-scoped).
 *
 * Regenerates the slug from the new name and returns 409 if another series
 * for this user already has the same name.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name } = updateSeriesSchema.parse(body);

    const existing = await db.series.findFirst({
      where: {
        userId: session.user.id,
        OR: [{ id }, { slug: id }],
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Series not found" }, { status: 404 });
    }

    const nameConflict = await db.series.findFirst({
      where: {
        userId: session.user.id,
        name,
        NOT: { id: existing.id },
      },
      select: { id: true },
    });

    if (nameConflict) {
      return NextResponse.json(
        { error: "A series with this name already exists" },
        { status: 409 }
      );
    }

    const slug = await generateUniqueSlug(
      name,
      session.user.id,
      async (candidate, userId) => {
        const conflict = await db.series.findUnique({
          where: { userId_slug: { userId, slug: candidate } },
        });
        // Exclude the current series from the conflict check.
        return !!conflict && conflict.id !== existing.id;
      }
    );

    const series = await db.series.update({
      where: { id: existing.id },
      data: { name, slug },
    });

    return NextResponse.json(series);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating series:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Delete a series by id or slug (user-scoped).
 *
 * Books that belong to the series have their `seriesId` and `seriesOrder`
 * cleared before the series is deleted.
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await db.series.findFirst({
      where: {
        userId: session.user.id,
        OR: [{ id }, { slug: id }],
      },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Series not found" }, { status: 404 });
    }

    await db.$transaction(async (tx) => {
      await tx.book.updateMany({
        where: { seriesId: existing.id },
        data: { seriesId: null, seriesOrder: null },
      });
      await tx.series.delete({ where: { id: existing.id } });
    });

    return NextResponse.json({ message: "Series deleted successfully" });
  } catch (error) {
    console.error("Error deleting series:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
