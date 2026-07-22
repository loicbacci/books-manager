import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const bulkIdsSchema = z.object({
  ids: z.array(z.string()).min(1).max(100),
});

const patchBulkSchema = bulkIdsSchema
  .extend({
    status: z.enum(["TO_READ", "READING", "READ", "DROPPED"]).optional(),
    isWishlist: z.boolean().optional(),
  })
  .refine((data) => data.status !== undefined || data.isWishlist !== undefined, {
    message: "At least one of status or isWishlist is required",
  });

/**
 * Bulk-update books for the authenticated user.
 *
 * Accepts `{ ids, status? }` or `{ ids, isWishlist? }` (at least one update field).
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { ids, status, isWishlist } = patchBulkSchema.parse(body);

    const data: { status?: typeof status; isWishlist?: boolean } = {};
    if (status !== undefined) data.status = status;
    if (isWishlist !== undefined) data.isWishlist = isWishlist;

    const result = await db.book.updateMany({
      where: {
        id: { in: ids },
        userId: session.user.id,
      },
      data,
    });

    return NextResponse.json({ updated: result.count });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error bulk updating books:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Bulk-delete books for the authenticated user.
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { ids } = bulkIdsSchema.parse(body);

    const result = await db.book.deleteMany({
      where: {
        id: { in: ids },
        userId: session.user.id,
      },
    });

    return NextResponse.json({ deleted: result.count });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error bulk deleting books:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
