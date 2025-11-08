import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/features/auth/auth";
import { prisma } from "@/core/database/db";
import { notify } from "@/core/services/notify.service";
import { billingService } from "@/modules/billing/billing.service";

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

    if (session.user.role !== "CLIENT") {
      return NextResponse.json(
        { error: "Only clients can send manual invites" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { developerId, message, title, budget, description } = body;

    if (!developerId) {
      return NextResponse.json(
        { error: "developerId is required" },
        { status: 400 }
      );
    }

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: "message is required" },
        { status: 400 }
      );
    }

    if (message.length > 300) {
      return NextResponse.json(
        { error: "message must be 300 characters or less" },
        { status: 400 }
      );
    }

    // Get project and verify client ownership
    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        client: {
          userId: session.user.id
        }
      },
      include: {
        client: true
      }
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found or access denied" },
        { status: 404 }
      );
    }

    // Check if project is in a valid state for manual invites
    // Allow manual invites for projects that are not completed or canceled
    if (["completed", "canceled"].includes(project.status)) {
      return NextResponse.json(
        { error: "Project is not in a state that allows manual invites" },
        { status: 400 }
      );
    }

    // Check if developer exists and is eligible
    const developer = await prisma.developerProfile.findUnique({
      where: { id: developerId },
      include: {
        user: true
      }
    });

    if (!developer) {
      return NextResponse.json(
        { error: "Developer not found" },
        { status: 404 }
      );
    }

    if (developer.adminApprovalStatus !== "approved") {
      return NextResponse.json(
        { error: "Developer is not approved" },
        { status: 400 }
      );
    }

    // Check if developer is available (not in "not_available" status)
    if (developer.availabilityStatus === "not_available") {
      return NextResponse.json(
        { error: "Developer is not available for new projects" },
        { status: 400 }
      );
    }

    // Check if there's already a pending manual invite for this developer and project
    const existingInvite = await (prisma as any).assignmentCandidate.findFirst({
      where: {
        projectId: params.id,
        developerId: developerId,
        responseStatus: "pending",
        source: "MANUAL_INVITE"
      }
    });

    if (existingInvite) {
      return NextResponse.json(
        { error: "Manual invite already sent to this developer" },
        { status: 400 }
      );
    }

    // Connect quota check (charge for sending get-in-touch from project page)
    const clientProfile = await prisma.clientProfile.findFirst({
      where: { userId: session.user.id }
    });
    if (!clientProfile) {
      return NextResponse.json({ error: "Client profile not found" }, { status: 400 });
    }

    const canConnect = await billingService.canUseConnect(clientProfile.id);
    if (!canConnect.allowed) {
      return NextResponse.json({ error: canConnect.reason || "Connect quota exceeded" }, { status: 402 });
    }

    // Create manual invite batch and candidate
    const result = await prisma.$transaction(async (tx) => {
      // Create manual batch
      const batch = await (tx as any).assignmentBatch.create({
        data: {
          projectId: params.id,
          batchNumber: await getNextBatchNumber(tx, params.id),
          status: "active",
          type: "MANUAL_INVITE",
          isNoExpire: true,
          selection: {} // Empty for manual invites
        }
      });

      // Create manual candidate
      const candidate = await (tx as any).assignmentCandidate.create({
        data: {
          batchId: batch.id,
          projectId: params.id,
          developerId: developerId,
          level: developer.level,
          assignedAt: new Date(),
          acceptanceDeadline: null, // No deadline for manual invites
          responseStatus: "pending",
          respondedAt: null, // Not responded yet
          usualResponseTimeMsSnapshot: developer.usualResponseTimeMs || 0,
          statusTextForClient: "developer is checking",
          source: "MANUAL_INVITE",
          clientMessage: message.trim(),
          isFirstAccepted: false, // Default value
          invalidatedAt: null, // Not invalidated
          // Store additional project details in metadata
          metadata: {
            title: title?.trim() || null,
            budget: budget?.trim() || null,
            description: description?.trim() || null,
            submittedAt: new Date().toISOString(),
          }
        }
      });

      return { batch, candidate };
    });

    // Increment connect usage after success
    try {
      await billingService.incrementConnectUsage(clientProfile.id);
    } catch (usageErr) {
      console.error("Failed to increment connect usage:", usageErr);
    }

    // Send notification to developer about the manual invite
    try {
      console.log(`🔔 Creating notification for manual invite: ${result.candidate.id}`);
      
      await notify({
        type: "assignment.manual_invite",
        actorUserId: session.user.id, // Client who sent the invite
        projectId: params.id,
        recipients: [developer.userId], // Developer who received the invite
        payload: {
          projectTitle: project.title,
          clientMessage: message.trim(),
          candidateId: result.candidate.id,
          clientName: "Client", // We don't have client user info in this context
          title: title?.trim() || null,
          budget: budget?.trim() || null,
          description: description?.trim() || null,
        },
      });
      
      console.log(`✅ Notification created successfully for manual invite`);
    } catch (notificationError) {
      console.error("❌ Failed to create notification for manual invite:", notificationError);
      // Don't fail the entire request if notification fails
    }

    return NextResponse.json({
      success: true,
      message: "Manual invite sent successfully",
      data: {
        batchId: result.batch.id,
        candidateId: result.candidate.id
      }
    });

  } catch (error) {
    console.error("Error sending manual invite:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function getNextBatchNumber(tx: any, projectId: string): Promise<number> {
  const lastBatch = await tx.assignmentBatch.findFirst({
    where: { projectId },
    orderBy: { batchNumber: "desc" },
    select: { batchNumber: true }
  });

  return (lastBatch?.batchNumber || 0) + 1;
}
