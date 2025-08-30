import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/features/auth/auth";
import { prisma } from "@/core/database/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const projects = await prisma.project.findMany({
      include: {
        client: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        currentBatch: {
          include: {
            candidates: {
              include: {
                developer: {
                  include: {
                    user: {
                      select: {
                        name: true,
                        email: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            assignmentBatches: true,
            assignmentCandidates: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Resolve skill IDs to skill names for all projects
    const allSkillIds = Array.from(new Set(projects.flatMap((p: any) => p.skillsRequired)));
    const skillNames = await prisma.skill.findMany({
      where: {
        id: { in: allSkillIds }
      },
      select: {
        id: true,
        name: true,
      }
    });

    const skillIdToName = Object.fromEntries(
      skillNames.map(skill => [skill.id, skill.name])
    );

    // Replace skill IDs with skill names in projects
    const projectsWithSkillNames = projects.map(project => ({
      ...project,
      skillsRequired: project.skillsRequired.map(id => skillIdToName[id] || id)
    }));

    return NextResponse.json({
      success: true,
      projects: projectsWithSkillNames,
    });
  } catch (error) {
    console.error("Error fetching projects for admin:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
