import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * Payload for creating a new author.
 *
 * `genderId` and `nationalityIds` are optional and user-scoped.
 */
const createAuthorSchema = z.object({
  name: z.string().min(1).max(200),
  genderId: z.string().optional().nullable(),
  nationalityIds: z.array(z.string()).optional(),
});

/**
 * List authors for the authenticated user.
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
      Math.max(1, parseNumberParam(pageSizeParam, 50))
    );
    const skip = (page - 1) * pageSize;

    const where = { userId: session.user.id };
    const authorInclude =
      {
        gender: true,
        nationalities: { include: { nationality: true } },
        _count: { select: { books: true } },
      } as unknown as Prisma.AuthorInclude;
    const [authors, total] = await Promise.all([
      db.author.findMany({
        where,
        include: authorInclude,
        orderBy: { name: "asc" },
        skip,
        take: pageSize,
      }),
      db.author.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return NextResponse.json({
      items: authors,
      page,
      pageSize,
      total,
      totalPages,
    });
  } catch (error) {
    console.error("Error fetching authors:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Create an author for the authenticated user.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, genderId, nationalityIds = [] } =
      createAuthorSchema.parse(body);

    if (genderId) {
      const gender = await db.gender.findFirst({
        where: { id: genderId, userId: session.user.id },
        select: { id: true },
      });
      if (!gender) {
        return NextResponse.json({ error: "Invalid genderId" }, { status: 400 });
      }
    }

    const uniqueNationalityIds = Array.from(new Set(nationalityIds));
    if (uniqueNationalityIds.length) {
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

    const author = await db.author.create({
      data: {
        name,
        userId: session.user.id,
        genderId,
        nationalities: {
          create: nationalityIds.map((nationalityId) => ({
            nationalityId,
          })),
        },
      } as unknown as Prisma.AuthorCreateInput,
      include: {
        gender: true,
        nationalities: { include: { nationality: true } },
      } as unknown as Prisma.AuthorInclude,
    });

    return NextResponse.json(author, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating author:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
