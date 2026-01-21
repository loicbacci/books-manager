import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const updateNationalitySchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().max(10).optional().nullable(),
  color: z.string().optional().nullable(),
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
    const { name, code, color } = updateNationalitySchema.parse(body);

    const existing = await db.nationality.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Nationality not found" },
        { status: 404 }
      );
    }

    const nationality = await db.nationality.update({
      where: { id },
      data: { name, code, color },
    });

    return NextResponse.json(nationality);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating nationality:", error);
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

    const existing = await db.nationality.findFirst({
      where: { id, userId: session.user.id },
      include: { _count: { select: { authors: true } } },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Nationality not found" },
        { status: 404 }
      );
    }

    if (existing._count.authors > 0) {
      return NextResponse.json(
        { error: "Nationality is in use" },
        { status: 400 }
      );
    }

    await db.nationality.delete({ where: { id } });
    return NextResponse.json({ message: "Nationality deleted successfully" });
  } catch (error) {
    console.error("Error deleting nationality:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
