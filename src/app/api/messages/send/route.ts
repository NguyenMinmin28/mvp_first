import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/features/auth/auth";
import { prisma } from "@/core/database/db";
import { notify } from "@/core/services/notify.service";
import { billingService } from "@/modules/billing/billing.service";

export async function POST(request: NextRequest) {
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
        { error: "Only clients can send direct messages" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { developerId, message, title, budget, description, selectedProjectId } = body;

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

    // Get client profile
    const clientProfile = await prisma.clientProfile.findUnique({
      where: { userId: session.user.id },
      include: { user: true }
    });

    if (!clientProfile) {
      return NextResponse.json(
        { error: "Client profile not found" },
        { status: 404 }
      );
    }

    // Verify developer exists
    const developer = await prisma.developerProfile.findUnique({
      where: { id: developerId },
      include: { user: true }
    });

    if (!developer) {
      return NextResponse.json(
        { error: "Developer not found" },
        { status: 404 }
      );
    }

    // Get referenced project details if selectedProjectId is provided
    let referencedProjectTitle = null;
    if (selectedProjectId) {
      try {
        const referencedProject = await prisma.project.findUnique({
          where: { id: selectedProjectId },
          select: { title: true }
        });
        referencedProjectTitle = referencedProject?.title || null;
      } catch (error) {
        console.error("Error fetching referenced project:", error);
        // Continue without project title
      }
    }

    // Check if there's already a pending message from this client to this developer
    const existingCandidate = await prisma.assignmentCandidate.findFirst({
      where: {
        clientId: clientProfile.id,
        developerId: developerId,
        responseStatus: "pending"
      } as any
    });

    if (existingCandidate) {
      return NextResponse.json(
        { error: "You already have a pending message to this developer" },
        { status: 400 }
      );
    }

    // Quota check for connects (monthly)
    const canConnect = await billingService.canUseConnect(clientProfile.id);
    if (!canConnect.allowed) {
      return NextResponse.json(
        { error: canConnect.reason || "Connect quota exceeded" },
        { status: 402 }
      );
    }

    // Create direct message candidate
    const candidate = await prisma.assignmentCandidate.create({
      data: {
        clientId: clientProfile.id,
        developerId: developerId,
        projectId: undefined, // No project for direct messages
        batchId: undefined, // No batch for direct messages
        level: developer.level || "MID", // Default level
        assignedAt: new Date(),
        acceptanceDeadline: null, // No deadline for direct messages
        responseStatus: "pending",
        source: "MANUAL_INVITE",
        clientMessage: message.trim(),
        usualResponseTimeMsSnapshot: developer.usualResponseTimeMs || 0,
        metadata: {
          title: title?.trim() || null,
          budget: budget?.trim() || null,
          description: description?.trim() || null,
          isDirectMessage: true,
          selectedProjectId: selectedProjectId || null,
          selectedProjectTitle: referencedProjectTitle
        }
      } as any
    });

    // Increment connect usage after successful creation
    try {
      await billingService.incrementConnectUsage(clientProfile.id);
    } catch (usageErr) {
      console.error("Failed to increment connect usage:", usageErr);
    }

    // Send notification to developer
    try {
      await notify({
        type: "SERVICE_LEAD_CREATED",
        recipients: [developer.userId],
        payload: {
          candidateId: candidate.id,
          clientName: clientProfile.user.name || "A client",
          message: message.trim(),
          title: title?.trim() || null,
          budget: budget?.trim() || null,
          description: description?.trim() || null,
          isDirectMessage: true
        }
      });
    } catch (notificationError) {
      console.error("Failed to send notification:", notificationError);
      // Don't fail the request if notification fails
    }

    return NextResponse.json({
      success: true,
      message: "Message sent successfully",
      data: {
        candidateId: candidate.id
      }
    });

  } catch (error) {
    console.error("Error sending direct message:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
