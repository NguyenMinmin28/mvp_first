import { NextRequest, NextResponse } from "next/server";
import { getServerSessionUser } from "@/features/auth/auth-server";
import { prisma } from "@/core/database/db";
import { revalidatePath } from "next/cache";

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
    let body, status, reason;
    try {
      body = await request.json();
      status = body.status;
      reason = body.reason;
    } catch (error) {
      console.error("Error parsing request JSON:", error);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

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

    // Revalidate paths to ensure fresh data
    revalidatePath("/onboarding/freelancer/pending-approval");
    revalidatePath("/api/user/me");
    revalidatePath("/inbox");

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
