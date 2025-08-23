import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/auth";
import { prisma as db } from "@/core/database/db";
import { z } from "zod";

const updateRoleSchema = z.object({
  role: z.enum(["CLIENT", "DEVELOPER"]),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { role } = updateRoleSchema.parse(body);

    console.log("Updating user role:", {
      userId: session.user.id,
      newRole: role,
    });

    // Update user role
    const updatedUser = await db.user.update({
      where: { id: session.user.id },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isProfileCompleted: true,
      },
    });

    console.log("User role updated successfully:", updatedUser);

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: `Role updated to ${role}`,
    });
  } catch (error) {
    console.error("Error updating user role:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
