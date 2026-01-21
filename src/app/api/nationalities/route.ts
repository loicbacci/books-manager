import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const createNationalitySchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().max(10).optional().nullable(),
  color: z.string().optional().nullable(),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const nationalities = await db.nationality.findMany({
      where: { userId: session.user.id },
      include: {
        _count: { select: { authors: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(nationalities);
  } catch (error) {
    console.error("Error fetching nationalities:", error);
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
    const { name, code, color } = createNationalitySchema.parse(body);

    const nationality = await db.nationality.create({
      data: {
        name,
        code,
        color,
        userId: session.user.id,
      },
    });

    return NextResponse.json(nationality, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating nationality:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
