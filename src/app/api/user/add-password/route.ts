import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/auth";
import { prisma as db } from "@/core/database/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

const addPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = addPasswordSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Validation failed",
          details: validationResult.error.issues 
        },
        { status: 400 }
      );
    }

    const { password } = validationResult.data;

    // Check if user exists and doesn't already have a password
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        passwordHash: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If user already has a password, return error
    if (user.passwordHash) {
      return NextResponse.json(
        { error: "Password already set. Use the change password feature instead." },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user with password
    await db.user.update({
      where: { id: session.user.id },
      data: {
        passwordHash: hashedPassword,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Password added successfully. You can now sign in with email and password.",
    });
  } catch (error) {
    console.error("Error adding password:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

