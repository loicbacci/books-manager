import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { createUserDefaults } from "@/lib/user-defaults";

/**
 * Request body contract for invite-only registration.
 *
 * Password and invite code validation are enforced here so the route
 * fails fast before any database writes are attempted.
 */
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).optional(),
  inviteCode: z.string().min(1),
});

/**
 * Register a new user with an invite code.
 *
 * - Validates input with Zod
 * - Checks invite code from env
 * - Rejects duplicate emails
 * - Hashes password and creates defaults
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, name, inviteCode } = registerSchema.parse(body);
    const normalizedEmail = email.trim().toLowerCase();

    // Enforce invite-only signup.
    const validInviteCode = process.env.REGISTRATION_INVITE_CODE;
    if (!validInviteCode || inviteCode !== validInviteCode) {
      return NextResponse.json(
        { error: "Invalid invite code" },
        { status: 403 }
      );
    }

    // Prevent duplicate accounts by email.
    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    // Hash the password before persisting.
    const hashedPassword = await hash(password, 12);

    try {
      await db.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: normalizedEmail,
            hashedPassword,
            name,
          },
        });

        // Seed per-user reference data (formats, genres, genders, etc.).
        await createUserDefaults(user.id, tx);
      });
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P2002"
      ) {
        return NextResponse.json(
          { error: "User already exists" },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json(
      { message: "User created successfully" },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
