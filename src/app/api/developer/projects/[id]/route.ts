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

    if (session.user.role !== "DEVELOPER") {
      return NextResponse.json(
        { error: "Only developers can view project details" },
        { status: 403 }
      );
    }

    // Debug logging
    console.log('🔍 Developer API - Fetching project with ID:', params.id);

    // Get project with basic details (no sensitive client info)
    const project = await prisma.project.findUnique({
      where: {
        id: params.id
      },
      select: {
        id: true,
        title: true,
        description: true,
        budget: true,
        budgetMin: true,
        budgetMax: true,
        currency: true,
        skillsRequired: true,
        expectedStartAt: true,
        expectedEndAt: true,
        status: true,
        postedAt: true,
        createdAt: true,
        client: {
          select: {
            companyName: true,
            user: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    console.log('🔍 Developer API - Project found:', !!project);
    if (project) {
      console.log('🔍 Developer API - Project title:', project.title);
    }

    if (!project) {
      console.log('❌ Developer API - Project not found for ID:', params.id);
      return NextResponse.json(
        { error: "Project not found or not accessible" },
        { status: 404 }
      );
    }

    // Fetch skill names from skill IDs
    let skillNames: string[] = [];
    if (project.skillsRequired && project.skillsRequired.length > 0) {
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

    // Transform the project data
    const projectData = {
      id: project.id,
      title: project.title,
      description: project.description,
      budget: project.budget,
      budgetMin: project.budgetMin,
      budgetMax: project.budgetMax,
      currency: project.currency,
      skillsRequired: skillNames,
      expectedStartAt: project.expectedStartAt?.toISOString(),
      expectedEndAt: project.expectedEndAt?.toISOString(),
      status: project.status,
      postedAt: project.postedAt?.toISOString(),
      createdAt: project.createdAt?.toISOString(),
      client: {
        name: project.client?.user?.name || 'Client',
        companyName: project.client?.companyName || null
      }
    };

    return NextResponse.json({
      success: true,
      project: projectData
    });

  } catch (error) {
    console.error("Error fetching project details for developer:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
