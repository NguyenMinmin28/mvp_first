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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { action, reason } = await request.json();
    const developerId = params.id;

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    const developer = await prisma.developerProfile.findUnique({
      where: { id: developerId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!developer) {
      return NextResponse.json(
        { error: "Developer not found" },
        { status: 404 }
      );
    }

    const updateData: any = {
      adminApprovalStatus: action === "approve" ? "approved" : "rejected",
    };

    if (action === "approve") {
      updateData.approvedAt = new Date();
    } else {
      updateData.rejectedAt = new Date();
      updateData.rejectedReason = reason || "No reason provided";
    }

    const updatedDeveloper = await prisma.developerProfile.update({
      where: { id: developerId },
      data: updateData,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    console.log(`✅ Admin ${session.user.email} ${action}ed developer ${developer.user.email}`);

    return NextResponse.json({
      success: true,
      developer: updatedDeveloper,
      message: `Developer ${action}ed successfully`,
    });
  } catch (error) {
    console.error("Error updating developer approval status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
