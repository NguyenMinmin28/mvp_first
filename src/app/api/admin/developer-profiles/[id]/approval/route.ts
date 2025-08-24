import { NextRequest, NextResponse } from "next/server";
import { getServerSessionUser } from "@/features/auth/auth-server";
import { prisma } from "@/core/database/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Kiểm tra quyền admin
    const user = await getServerSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { status, reason } = body;

    if (!status || !["approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'approved' or 'rejected'" },
        { status: 400 }
      );
    }

    // Cập nhật trạng thái approval
    const updateData: any = {
      adminApprovalStatus: status,
      updatedAt: new Date(),
    };

    if (status === "approved") {
      updateData.approvedAt = new Date();
      updateData.rejectedAt = null;
      updateData.rejectedReason = null;
    } else if (status === "rejected") {
      updateData.rejectedAt = new Date();
      updateData.approvedAt = null;
      updateData.rejectedReason = reason || null;
    }

    const updatedProfile = await prisma.developerProfile.update({
      where: { id },
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

    return NextResponse.json({
      message: `Developer profile ${status} successfully`,
      data: updatedProfile,
    });
  } catch (error) {
    console.error("Error updating developer profile approval:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
