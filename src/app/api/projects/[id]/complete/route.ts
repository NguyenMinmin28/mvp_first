import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/features/auth/auth";
import { prisma } from "@/core/database/db";

export async function PATCH(
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
        { error: "Only clients can complete projects" },
        { status: 403 }
      );
    }

    const projectId = params.id;

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

    // Check if project exists and belongs to this client
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        clientId: clientProfile.id
      }
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found or access denied" },
        { status: 404 }
      );
    }

    // Check if project can be completed (allow any status except draft and canceled)
    if (project.status === "draft" || project.status === "canceled") {
      return NextResponse.json(
        { error: "Project cannot be completed in current status" },
        { status: 400 }
      );
    }

    // Update project status to completed
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        status: "completed",
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      project: {
        id: updatedProject.id,
        title: updatedProject.title,
        status: updatedProject.status
      }
    });

  } catch (error) {
    console.error("Error completing project:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
