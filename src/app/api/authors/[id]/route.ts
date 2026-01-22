import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * Fetch a single author by id with their books.
 *
 * Returns the author profile plus a list of books that reference them.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const author = await db.author.findFirst({
      where: { id, userId: session.user.id },
      include: { gender: true, nationality: true },
    });

    if (!author) {
      return NextResponse.json({ error: "Author not found" }, { status: 404 });
    }

    const books = await db.book.findMany({
      where: {
        userId: session.user.id,
        authors: { some: { authorId: author.id } },
      },
      include: {
        authors: { include: { author: true } },
        genres: { include: { genre: true } },
        format: true,
        series: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ ...author, books });
  } catch (error) {
    console.error("Error fetching author:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
