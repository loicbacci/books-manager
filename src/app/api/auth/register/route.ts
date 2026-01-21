import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { createUserDefaults } from "@/lib/user-defaults";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).optional(),
  inviteCode: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, name, inviteCode } = registerSchema.parse(body);

    // Validate invite code
    const validInviteCode = process.env.REGISTRATION_INVITE_CODE;
    if (!validInviteCode || inviteCode !== validInviteCode) {
      return NextResponse.json(
        { error: "Invalid invite code" },
        { status: 403 }
      );
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    // Hash password and create user
    const hashedPassword = await hash(password, 12);

    const user = await db.user.create({
      data: {
        email,
        hashedPassword,
        name,
      },
    });

    // Create default formats, genders, genres for the new user
    await createUserDefaults(user.id);

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
