import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/auth";
import { prisma } from "@/core/database/db";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Find the assignment candidate for this project and user
    const assignment = await prisma.assignmentCandidate.findFirst({
      where: {
        projectId: params.id,
        developer: {
          userId: session.user.id
        },
        responseStatus: "pending"
      },
      include: {
        project: true,
        developer: true
      }
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found or already processed" },
        { status: 404 }
      );
    }

    // Check if the assignment has actually expired
    const now = new Date();
    if (assignment.acceptanceDeadline) {
      const deadline = new Date(assignment.acceptanceDeadline);
      
      if (now <= deadline) {
        return NextResponse.json(
          { error: "Assignment has not expired yet" },
          { status: 400 }
        );
      }
    }

    // Update assignment status to expired
    await prisma.assignmentCandidate.update({
      where: { id: assignment.id },
      data: {
        responseStatus: "expired",
        respondedAt: now
      }
    });

    // Check if this was the first accepted assignment for this project
    // If so, we might need to handle project status differently
    const otherAssignments = await prisma.assignmentCandidate.findMany({
      where: {
        projectId: params.id,
        responseStatus: "accepted"
      }
    });

    // If no other assignments are accepted, we might want to mark the project as needing new candidates
    if (otherAssignments.length === 0) {
      // You could add logic here to create a new batch or notify the client
      // For now, we'll just log it
      console.log(`Project ${params.id} has no accepted assignments after expiration`);
    }

    return NextResponse.json({
      message: "Assignment expired successfully",
      assignment: {
        id: assignment.id,
        responseStatus: "expired",
        respondedAt: now
      }
    });
  } catch (error) {
    console.error("Error expiring assignment:", error);
    return NextResponse.json(
      { error: "Failed to expire assignment" },
      { status: 500 }
    );
  }
}
