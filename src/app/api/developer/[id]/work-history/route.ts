import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/database/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const developerId = params.id;

    // Get developer profile to verify it exists
    const developer = await prisma.developerProfile.findUnique({
      where: { id: developerId },
      select: { id: true },
    });

    if (!developer) {
      return NextResponse.json(
        { error: "Developer not found" },
        { status: 404 }
      );
    }

    // Fetch projects where developer has accepted (regardless of project status)
    // This includes both in-progress and completed projects
    const assignments = await prisma.assignmentCandidate.findMany({
      where: {
        developerId: developerId,
        responseStatus: "accepted",
      },
      include: {
        project: {
          include: {
            client: {
              include: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        assignedAt: "desc",
      },
    });

    // Filter out assignments with null projects
    const validAssignments = assignments.filter((assignment) => assignment.project !== null);

    // Get all unique skill IDs from all projects
    const allSkillIds = Array.from(
      new Set(
        validAssignments.flatMap((assignment) => assignment.project?.skillsRequired || [])
      )
    );

    // Fetch skill names
    const skills = await prisma.skill.findMany({
      where: {
        id: { in: allSkillIds },
      },
      select: {
        id: true,
        name: true,
      },
    });

    // Create a map of skill ID to name
    const skillIdToName = new Map(skills.map((skill) => [skill.id, skill.name]));

    // Transform to work history format
    const workHistory = validAssignments.map((assignment) => {
      const project = assignment.project!; // Non-null assertion: already filtered out null projects
      const startDate = assignment.assignedAt
        ? new Date(assignment.assignedAt).toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          })
        : "Unknown";

      const endDate =
        project.status === "completed" && project.updatedAt
          ? new Date(project.updatedAt).toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            })
          : null;

      // Map skill IDs to skill names
      const technologies =
        project.skillsRequired
          ?.map((skillId: string) => skillIdToName.get(skillId))
          .filter(Boolean) || [];

      return {
        project: project.title || "Untitled Project",
        client: project.client?.user?.name || "Unknown Client",
        startDate,
        endDate: endDate || undefined,
        description: project.description || undefined,
        technologies,
        status: project.status,
        responseStatus: assignment.responseStatus,
      };
    });

    return NextResponse.json({ workHistory });
  } catch (error) {
    console.error("Error fetching work history:", error);
    return NextResponse.json(
      { error: "Failed to fetch work history" },
      { status: 500 }
    );
  }
}

