import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

/**
 * Payload for updating an author.
 *
 * `genderId` and `nationalityIds` are optional and user-scoped. When
 * `nationalityIds` is provided, it fully replaces the author's nationalities.
 */
const updateAuthorSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  genderId: z.string().optional().nullable(),
  nationalityIds: z.array(z.string()).optional(),
});

const authorInclude = {
  gender: true,
  nationalities: { include: { nationality: true } },
} as unknown as Prisma.AuthorInclude;

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
      include: {
        gender: true,
        nationalities: { include: { nationality: true } },
      } as unknown as Prisma.AuthorInclude,
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

/**
 * Update an author by id (user-scoped).
 *
 * When `nationalityIds` is provided, the join table is fully replaced via
 * delete-then-create.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, genderId, nationalityIds } = updateAuthorSchema.parse(body);

    const existing = await db.author.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Author not found" }, { status: 404 });
    }

    if (name !== undefined && name !== existing.name) {
      const nameConflict = await db.author.findFirst({
        where: {
          userId: session.user.id,
          name,
          NOT: { id: existing.id },
        },
        select: { id: true },
      });

      if (nameConflict) {
        return NextResponse.json(
          { error: "An author with this name already exists" },
          { status: 409 }
        );
      }
    }

    if (genderId) {
      const gender = await db.gender.findFirst({
        where: { id: genderId, userId: session.user.id },
        select: { id: true },
      });
      if (!gender) {
        return NextResponse.json({ error: "Invalid genderId" }, { status: 400 });
      }
    }

    const uniqueNationalityIds = nationalityIds
      ? Array.from(new Set(nationalityIds))
      : undefined;

    if (uniqueNationalityIds?.length) {
      const count = await db.nationality.count({
        where: { id: { in: uniqueNationalityIds }, userId: session.user.id },
      });
      if (count !== uniqueNationalityIds.length) {
        return NextResponse.json(
          { error: "Invalid nationalityIds" },
          { status: 400 }
        );
      }
    }

    const author = await db.$transaction(async (tx) => {
      if (uniqueNationalityIds !== undefined) {
        await tx.authorNationality.deleteMany({
          where: { authorId: existing.id },
        });
        if (uniqueNationalityIds.length > 0) {
          await tx.authorNationality.createMany({
            data: uniqueNationalityIds.map((nationalityId) => ({
              authorId: existing.id,
              nationalityId,
            })),
          });
        }
      }

      return tx.author.update({
        where: { id: existing.id },
        data: {
          ...(name !== undefined ? { name } : {}),
          ...(genderId !== undefined ? { genderId } : {}),
        },
        include: authorInclude,
      });
    });

    return NextResponse.json(author);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating author:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Delete an author by id (user-scoped).
 *
 * Detaches the author from any books (removing the `BookAuthor` join rows)
 * before deleting the author itself.
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await db.author.findFirst({
      where: { id, userId: session.user.id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Author not found" }, { status: 404 });
    }

    const booksDetached = await db.$transaction(async (tx) => {
      const { count } = await tx.bookAuthor.deleteMany({
        where: { authorId: existing.id },
      });
      await tx.author.delete({ where: { id: existing.id } });
      return count;
    });

    return NextResponse.json({ success: true, booksDetached });
  } catch (error) {
    console.error("Error deleting author:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
