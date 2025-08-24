import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/auth";
import { prisma } from "@/core/database/db";

export async function POST(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Check if user is a developer
    if (session.user.role !== "DEVELOPER") {
      return NextResponse.json(
        { error: "Only developers can submit profiles for approval" },
        { status: 403 }
      );
    }

    // Check if developer profile exists
    const existingProfile = await prisma.developerProfile.findUnique({
      where: { userId },
    });

    if (!existingProfile) {
      return NextResponse.json(
        { error: "Developer profile not found" },
        { status: 404 }
      );
    }

    // Check if profile is in draft status
    if (existingProfile.adminApprovalStatus !== "draft") {
      return NextResponse.json(
        { error: "Profile is not in draft status" },
        { status: 400 }
      );
    }

    // Update profile status to pending
    const updatedProfile = await prisma.developerProfile.update({
      where: { userId },
      data: {
        adminApprovalStatus: "pending",
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Profile submitted for approval successfully",
      data: {
        adminApprovalStatus: updatedProfile.adminApprovalStatus,
        updatedAt: updatedProfile.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error submitting profile for approval:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
