import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/features/auth/auth";
import { prisma } from "@/core/database/db";

export async function GET(
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
        { error: "Only clients can view project details" },
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

    // Get project with comprehensive details including skill names
    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        clientId: clientProfile.id
      },
      select: {
        id: true,
        title: true,
        description: true,
        budget: true,
        budgetMin: true,
        budgetMax: true,
        currency: true,
        paymentMethod: true,
        skillsRequired: true,
        expectedStartAt: true,
        expectedEndAt: true,
        status: true,
        postedAt: true,
        _count: {
          select: {
            assignmentCandidates: true
          }
        }
      }
    });

    // Fetch skill names from skill IDs
    let skillNames: string[] = [];
    if (project && project.skillsRequired && project.skillsRequired.length > 0) {
      const skills = await prisma.skill.findMany({
        where: {
          id: { in: project.skillsRequired }
        },
        select: {
          id: true,
          name: true
        }
      });
      skillNames = skills.map(skill => skill.name);
    }

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Transform the project data to match our interface
    const projectData = {
      id: project.id,
      title: project.title,
      description: project.description,
      budget: project.budget,
      budgetMin: project.budgetMin,
      budgetMax: project.budgetMax,
      currency: project.currency,
      paymentMethod: project.paymentMethod,
      skillsRequired: skillNames, // Use skill names instead of IDs
      expectedStartAt: project.expectedStartAt?.toISOString(),
      expectedEndAt: project.expectedEndAt?.toISOString(),
      status: project.status,
      postedAt: project.postedAt?.toISOString(),
      candidateCount: project._count.assignmentCandidates
    };

    return NextResponse.json({
      success: true,
      project: projectData
    });

  } catch (error) {
    console.error("Error fetching project details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
