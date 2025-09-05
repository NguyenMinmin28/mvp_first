import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/auth";
import { prisma } from "@/core/database/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;

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
        { error: "Only clients can check review status" },
        { status: 403 }
      );
    }

    // Check if project exists and belongs to client
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        client: {
          userId: session.user.id
        }
      }
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found or you don't have permission" },
        { status: 404 }
      );
    }

    // Check if project has any reviews
    const reviewCount = await prisma.review.count({
      where: {
        projectId: projectId,
        fromUserId: session.user.id
      }
    });

    return NextResponse.json({
      hasReviews: reviewCount > 0,
      reviewCount: reviewCount
    });

  } catch (error) {
    console.error("Error checking review status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
