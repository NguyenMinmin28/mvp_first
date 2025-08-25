import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/auth";
import { RotationService } from "@/core/services/rotation.service";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const candidateId = params.id;

    console.log("🔄 Developer rejecting candidate:", candidateId, "by user:", session.user.id);

    const result = await RotationService.rejectCandidate(candidateId, session.user.id);

    console.log("✅ Candidate rejected successfully:", {
      candidateId,
      success: result.success,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error("❌ Error rejecting candidate:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
