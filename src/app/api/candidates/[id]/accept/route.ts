import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/auth";
import { RotationService } from "@/core/services/rotation.service";
import { prisma } from "@/core/database/db";
import { notify } from "@/core/services/notify.service";

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

    console.log("🔄 Developer accepting candidate:", candidateId, "by user:", session.user.id);

    // Check if this is a direct message candidate (no project/batch)
    const candidate = await prisma.assignmentCandidate.findUnique({
      where: { id: candidateId },
      include: {
        project: { include: { client: true } },
        client: true,
      },
    });

    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    let result: any;

    // If no batch/project or flagged as direct message → bypass rotation rules
    const isDirect =
      !(candidate as any).batchId ||
      !(candidate as any).projectId ||
      (candidate as any)?.metadata?.isDirectMessage === true ||
      (candidate as any)?.source === 'MANUAL_INVITE';

    if (isDirect) {
      const updated = await prisma.assignmentCandidate.update({
        where: { id: candidateId },
        data: {
          responseStatus: "accepted" as any,
          respondedAt: new Date(),
          statusTextForClient: "Developer accepted your message",
        },
      });
      result = { success: true, candidate: { id: updated.id, responseStatus: updated.responseStatus } };
    } else {
      // Project-assignment acceptance keeps rotation checks
      result = await RotationService.acceptCandidate(candidateId, session.user.id);
    }

    // Send notification to client for manual invites (messages)
    try {
      const sourceType = (candidate as any)?.source;
      if (sourceType === 'MANUAL_INVITE') {
        const clientProfile = (candidate as any).project?.client || (candidate as any).client;
        const recipientUserId = clientProfile?.userId;
        if (recipientUserId) {
          await notify({
            type: 'MANUAL_INVITE_ACCEPTED',
            recipients: [recipientUserId],
            payload: {
              candidateId,
              projectId: (candidate as any)?.projectId || null,
              status: 'accepted',
            },
          });
        }
      }
    } catch (e) {
      console.warn('Notify client (accept) failed:', e);
    }

    console.log("✅ Candidate accepted successfully:", {
      candidateId,
      success: result.success,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error("❌ Error accepting candidate:", error);

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
