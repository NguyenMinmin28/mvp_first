import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/features/auth/auth";
import { prisma } from "@/core/database/db";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const developerId = params.id;

    // Check if developer exists
    const developer = await prisma.developerProfile.findUnique({
      where: { id: developerId },
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    });

    if (!developer) {
      return NextResponse.json(
        { error: "Developer not found" },
        { status: 404 }
      );
    }

    // Update approval status
    const updatedDeveloper = await prisma.developerProfile.update({
      where: { id: developerId },
      data: {
        adminApprovalStatus: "rejected",
        updatedAt: new Date(),
      }
    });

    console.log(`Admin ${session.user.email} rejected developer ${developer.user.name} (${developer.user.email})`);

    return NextResponse.json({
      success: true,
      message: "Developer rejected",
      developer: {
        id: updatedDeveloper.id,
        adminApprovalStatus: updatedDeveloper.adminApprovalStatus,
        updatedAt: updatedDeveloper.updatedAt,
      }
    });

  } catch (error) {
    console.error("Error rejecting developer:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
