import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const createGenderSchema = z.object({
  name: z.string().min(1).max(100),
  color: z.string().optional().nullable(),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const genders = await db.gender.findMany({
      where: { userId: session.user.id },
      include: {
        _count: { select: { authors: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(genders);
  } catch (error) {
    console.error("Error fetching genders:", error);
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
    const { name, color } = createGenderSchema.parse(body);

    const gender = await db.gender.create({
      data: {
        name,
        color,
        userId: session.user.id,
      },
    });

    return NextResponse.json(gender, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating gender:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
