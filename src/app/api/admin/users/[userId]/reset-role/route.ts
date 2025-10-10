import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/auth";
import { prisma } from "@/core/database/db";

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { userId } = params;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        clientProfile: true,
        developerProfile: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Use transaction to ensure all operations succeed or fail together
    await prisma.$transaction(async (tx) => {
      // Reset user role and profile completion status
      await tx.user.update({
        where: { id: userId },
        data: {
          role: null,
          isProfileCompleted: false,
        }
      });

      // Note: We don't delete the profiles to preserve data integrity
      // The profiles will remain but the user will need to choose a new role
      // This allows them to potentially reactivate their previous profile
    });

    console.log(`Admin ${session.user.email} reset role for user ${user.name} (${user.email})`);

    return NextResponse.json({
      success: true,
      message: "User role reset successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: null,
        isProfileCompleted: false,
      }
    });

  } catch (error) {
    console.error("Error resetting user role:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
