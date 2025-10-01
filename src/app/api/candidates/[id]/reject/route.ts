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

    console.log("🔄 Developer rejecting candidate:", candidateId, "by user:", session.user.id);

    // Determine whether this is a direct message candidate (no project/batch)
    const candidate = await prisma.assignmentCandidate.findUnique({
      where: { id: candidateId },
      include: {
        project: { include: { client: true } },
        client: true,
        developer: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              }
            }
          }
        }
      },
    });

    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    let result: any;
    const isDirect =
      !candidate.batchId ||
      !candidate.projectId ||
      (candidate as any)?.metadata?.isDirectMessage === true ||
      (candidate as any)?.source === 'MANUAL_INVITE';

    if (isDirect) {
      // Direct message: simple reject without rotation constraints
      const updated = await prisma.assignmentCandidate.update({
        where: { id: candidateId },
        data: {
          responseStatus: "rejected" as any,
          respondedAt: new Date(),
          statusTextForClient: "Developer rejected your message",
        },
      });
      result = { success: true, candidate: { id: updated.id, responseStatus: updated.responseStatus } };
    } else {
      // For project assignments, use rotation rules
      result = await RotationService.rejectCandidate(candidateId, session.user.id);
    }

    // Send notification to client for manual invites (messages)
    try {
      const sourceType = (candidate as any)?.source;
      if (sourceType === 'MANUAL_INVITE') {
        const clientProfile = (candidate as any).project?.client || (candidate as any).client;
        const recipientUserId = clientProfile?.userId;
        if (recipientUserId) {
          await notify({
            type: 'MANUAL_INVITE_REJECTED',
            recipients: [recipientUserId],
            actorUserId: candidate.developer?.userId, // Add actor for avatar
            payload: {
              candidateId,
              projectId: (candidate as any)?.projectId || null,
              status: 'rejected',
              developerName: candidate.developer?.user?.name || 'Developer',
              developerImage: candidate.developer?.user?.image,
              clientMessage: (candidate as any)?.metadata?.clientMessage || (candidate as any)?.clientMessage,
              title: 'Invitation Declined',
              message: `${candidate.developer?.user?.name || 'Developer'} has declined your invitation`,
            },
          });
        }
      }
    } catch (e) {
      console.warn('Notify client (reject) failed:', e);
    }

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
