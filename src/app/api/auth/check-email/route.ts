import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/database/db";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Check if user exists with this email
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true }
    });

    return NextResponse.json({
      exists: !!existingUser
    });

  } catch (error) {
    console.error("Error checking email:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
