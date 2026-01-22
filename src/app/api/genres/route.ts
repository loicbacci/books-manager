import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * Payload for creating a genre.
 *
 * `color` is optional and used for UI badges and charts.
 */
const createGenreSchema = z.object({
  name: z.string().min(1).max(100),
  color: z.string().optional().nullable(),
});

/**
 * List genres for the authenticated user.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const genres = await db.genre.findMany({
      where: { userId: session.user.id },
      include: {
        _count: { select: { books: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(genres);
  } catch (error) {
    console.error("Error fetching genres:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Create a genre for the authenticated user.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, color } = createGenreSchema.parse(body);

    const genre = await db.genre.create({
      data: {
        name,
        color,
        userId: session.user.id,
      },
    });

    return NextResponse.json(genre, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating genre:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
