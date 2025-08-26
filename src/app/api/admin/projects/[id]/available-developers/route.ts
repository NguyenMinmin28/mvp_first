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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const projectId = params.id;

    // Get project details with skill names
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        skillsRequired: true,
        status: true,
      }
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Resolve skill IDs to skill names
    const skillNames = await prisma.skill.findMany({
      where: {
        id: { in: project.skillsRequired }
      },
      select: {
        id: true,
        name: true,
      }
    });

    const skillIdToName = Object.fromEntries(
      skillNames.map(skill => [skill.id, skill.name])
    );

    const projectSkills = project.skillsRequired.map(id => skillIdToName[id] || id);

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    if (project.status !== "assigning") {
      return NextResponse.json(
        { error: "Project is not in assigning status" },
        { status: 400 }
      );
    }

    // Find all approved and available developers (not restricted by skills)
    const availableDevelopers = await prisma.developerProfile.findMany({
      where: {
        adminApprovalStatus: "approved",
        currentStatus: "available",
        whatsappVerified: true,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          }
        },
        skills: {
          include: {
            skill: {
              select: {
                name: true,
                category: true,
              }
            }
          }
        },
        _count: {
          select: {
            assignmentCandidates: true,
          }
        }
      },
      orderBy: [
        { level: "desc" }, // Expert first
        { usualResponseTimeMs: "asc" }, // Faster response time first
      ]
    });

    // Group by level and add skill match info
    const developersWithMatchInfo = availableDevelopers.map(dev => {
      const matchingSkills = dev.skills.filter(skill => 
        projectSkills.includes(skill.skill.name)
      );
      
      return {
        id: dev.id,
        name: dev.user.name,
        email: dev.user.email,
        level: dev.level,
        currentStatus: dev.currentStatus,
        usualResponseTimeMs: dev.usualResponseTimeMs,
        matchingSkills: matchingSkills.map(s => ({
          name: s.skill.name,
          years: s.years,
          category: s.skill.category,
        })),
        totalSkills: dev.skills.length,
        assignmentCount: dev._count.assignmentCandidates,
        skillMatchPercentage: Math.round((matchingSkills.length / projectSkills.length) * 100),
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        project: {
          id: projectId,
          skillsRequired: projectSkills,
        },
        developers: developersWithMatchInfo,
        total: developersWithMatchInfo.length,
      }
    });

  } catch (error) {
    console.error("Error fetching available developers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
