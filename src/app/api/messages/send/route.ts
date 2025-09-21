import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/features/auth/auth";
import { prisma } from "@/core/database/db";
import { notify } from "@/core/services/notify.service";

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

    // Check if there's already a pending message from this client to this developer
    const existingCandidate = await prisma.assignmentCandidate.findFirst({
      where: {
        clientId: clientProfile.id,
        developerId: developerId,
        projectId: null, // Direct message (no project)
        responseStatus: "pending"
      }
    });

    if (existingCandidate) {
      return NextResponse.json(
        { error: "You already have a pending message to this developer" },
        { status: 400 }
      );
    }

    // Create direct message candidate
    const candidate = await prisma.assignmentCandidate.create({
      data: {
        clientId: clientProfile.id,
        developerId: developerId,
        projectId: null, // No project for direct messages
        batchId: null, // No batch for direct messages
        level: developer.level || "MID", // Default level
        assignedAt: new Date(),
        acceptanceDeadline: null, // No deadline for direct messages
        responseStatus: "pending",
        source: "MANUAL_INVITE",
        clientMessage: message.trim(),
        metadata: {
          title: title?.trim() || null,
          budget: budget?.trim() || null,
          description: description?.trim() || null,
          isDirectMessage: true
        }
      }
    });

    // Send notification to developer
    try {
      await notify({
        type: "SERVICE_LEAD_CREATED",
        recipientId: developer.userId,
        data: {
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
