import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

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
