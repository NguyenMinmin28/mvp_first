import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/auth";
import { RotationService } from "@/core/services/rotation.service";
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

    const candidateId = params.id;

    console.log("🔄 Developer rejecting candidate:", candidateId, "by user:", session.user.id);

    // Check if batch has accepted candidates (block immediately when someone accepts)
    const candidate = await prisma.assignmentCandidate.findUnique({
      where: { id: candidateId },
      include: {
        batch: {
          include: {
            candidates: {
              select: {
                acceptanceDeadline: true,
                responseStatus: true,
              }
            }
          }
        }
      }
    });

    if (candidate?.batch?.candidates) {
      const hasAcceptedCandidates = candidate.batch.candidates.some(c => 
        c.responseStatus === "accepted"
      );
      
      if (hasAcceptedCandidates) {
        return NextResponse.json(
          { error: "Cannot reject candidate: project already has accepted candidates" },
          { status: 400 }
        );
      }
    }

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
