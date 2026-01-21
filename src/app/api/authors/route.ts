import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const createAuthorSchema = z.object({
  name: z.string().min(1).max(200),
  genderId: z.string().optional().nullable(),
  nationalityId: z.string().optional().nullable(),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authors = await db.author.findMany({
      where: { userId: session.user.id },
      include: {
        gender: true,
        nationality: true,
        _count: { select: { books: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(authors);
  } catch (error) {
    console.error("Error fetching authors:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, genderId, nationalityId } = createAuthorSchema.parse(body);

    const author = await db.author.create({
      data: {
        name,
        userId: session.user.id,
        genderId,
        nationalityId,
      },
      include: {
        gender: true,
        nationality: true,
      },
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
