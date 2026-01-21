import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const updateFormatSchema = z.object({
  name: z.string().min(1).max(100),
  icon: z.string().optional().nullable(),
});

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, icon } = updateFormatSchema.parse(body);

    const existing = await db.format.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Format not found" }, { status: 404 });
    }

    const format = await db.format.update({
      where: { id },
      data: { name, icon },
    });

    return NextResponse.json(format);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating format:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await db.format.findFirst({
      where: { id, userId: session.user.id },
      include: { _count: { select: { books: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: "Format not found" }, { status: 404 });
    }

    if (existing._count.books > 0) {
      return NextResponse.json({ error: "Format is in use" }, { status: 400 });
    }

    await db.format.delete({ where: { id } });
    return NextResponse.json({ message: "Format deleted successfully" });
  } catch (error) {
    console.error("Error deleting format:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
