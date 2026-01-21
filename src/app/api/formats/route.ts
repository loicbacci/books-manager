import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const createFormatSchema = z.object({
  name: z.string().min(1).max(100),
  icon: z.string().optional().nullable(),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formats = await db.format.findMany({
      where: { userId: session.user.id },
      include: {
        _count: { select: { books: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(formats);
  } catch (error) {
    console.error("Error fetching formats:", error);
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
    const { name, icon } = createFormatSchema.parse(body);

    const format = await db.format.create({
      data: {
        name,
        icon,
        userId: session.user.id,
      },
    });

    return NextResponse.json(format, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating format:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
