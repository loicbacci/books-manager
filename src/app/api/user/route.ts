import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hash, compare } from "bcryptjs";

const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  locale: z.enum(["en", "fr"]).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).optional(),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        locale: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, locale, currentPassword, newPassword } =
      updateUserSchema.parse(body);

    const updateData: {
      name?: string;
      locale?: string;
      hashedPassword?: string;
    } = {};

    if (name !== undefined) {
      updateData.name = name;
    }

    if (locale !== undefined) {
      updateData.locale = locale;
    }

    // Handle password change
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Current password is required" },
          { status: 400 }
        );
      }

      const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { hashedPassword: true },
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const isPasswordValid = await compare(
        currentPassword,
        user.hashedPassword
      );
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 }
        );
      }

      updateData.hashedPassword = await hash(newPassword, 12);
    }

    const updatedUser = await db.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        locale: true,
        createdAt: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
