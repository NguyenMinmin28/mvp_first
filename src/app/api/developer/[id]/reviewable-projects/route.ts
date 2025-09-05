import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/auth";
import { prisma } from "@/core/database/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const developerId = params.id;

    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (session.user.role !== "CLIENT") {
      return NextResponse.json(
        { error: "Only clients can access this endpoint" },
        { status: 403 }
      );
    }

    // Get client profile
    const clientProfile = await prisma.clientProfile.findUnique({
      where: { userId: session.user.id }
    });

    if (!clientProfile) {
      return NextResponse.json(
        { error: "Client profile not found" },
        { status: 404 }
      );
    }

    // Get developer profile to find the user ID
    const developerProfile = await prisma.developerProfile.findUnique({
      where: { id: developerId },
      select: { userId: true }
    });

    if (!developerProfile) {
      return NextResponse.json(
        { error: "Developer not found" },
        { status: 404 }
      );
    }

    // Find projects where:
    // 1. Client owns the project
    // 2. Developer was accepted for the project
    // 3. Project is completed
    // 4. Client hasn't reviewed this developer for this project yet
    const reviewableProjects = await prisma.project.findMany({
      where: {
        clientId: clientProfile.id,
        status: "completed",
        assignmentCandidates: {
          some: {
            developerId: developerId,
            responseStatus: "accepted"
          }
        },
        // Exclude projects where client has already reviewed this developer
        reviews: {
          none: {
            fromUserId: session.user.id,
            toUserId: developerProfile.userId
          }
        }
      },
      select: {
        id: true,
        title: true,
        description: true,
        updatedAt: true,
        createdAt: true,
        assignmentCandidates: {
          where: {
            developerId: developerId,
            responseStatus: "accepted"
          },
          select: {
            assignedAt: true,
            respondedAt: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return NextResponse.json({
      projects: reviewableProjects.map(project => ({
        id: project.id,
        title: project.title,
        description: project.description,
        completedAt: project.updatedAt, // Use updatedAt as completion date
        createdAt: project.createdAt,
        assignedAt: project.assignmentCandidates[0]?.assignedAt,
        respondedAt: project.assignmentCandidates[0]?.respondedAt
      }))
    });

  } catch (error) {
    console.error("Error fetching reviewable projects:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
