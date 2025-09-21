export const runtime = "nodejs";

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

    // Get pagination parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Get all client IDs that exist
    const existingClientIds = await prisma.clientProfile.findMany({
      select: {
        id: true,
      },
    });

    const validClientIds = existingClientIds.map(client => client.id);

    // If no valid clients found, return empty array
    if (validClientIds.length === 0) {
      return NextResponse.json({
        success: true,
        projects: [],
        pagination: {
          page: 1,
          limit,
          total: 0,
          totalPages: 0
        }
      });
    }

    // Get total count for pagination
    const total = await prisma.project.count({
      where: {
        clientId: {
          in: validClientIds,
        },
      },
    });

    // Now get projects that have valid client references with comprehensive data
    const projects = await prisma.project.findMany({
      where: {
        clientId: {
          in: validClientIds,
        },
      },
      skip,
      take: limit,
      include: {
        client: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                phoneE164: true,
                createdAt: true,
              },
            },
          },
        },
        currentBatch: {
          include: {
            candidates: {
              include: {
                developer: {
                  select: {
                    user: {
                      select: {
                        name: true,
                        email: true,
                      },
                    },
                    level: true,
                    currentStatus: true,
                    whatsappVerified: true,
                    whatsappNumber: true,
                    usualResponseTimeMs: true,
                  },
                },
              },
            },
          },
        },
        assignmentBatches: {
          include: {
            candidates: {
              include: {
                developer: {
                  select: {
                    user: {
                      select: {
                        name: true,
                        email: true,
                      },
                    },
                    level: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        assignmentCandidates: {
          include: {
            developer: {
              select: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
                level: true,
              },
            },
            batch: {
              select: {
                id: true,
                batchNumber: true,
                status: true,
                createdAt: true,
              },
            },
          },
          orderBy: {
            assignedAt: "desc",
          },
        },
        contactRevealEvents: {
          include: {
            developer: {
              select: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
          orderBy: {
            revealedAt: "desc",
          },
        },
        progressUpdates: {
          include: {
            author: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        reviews: {
          include: {
            fromUser: {
              select: {
                name: true,
                email: true,
              },
            },
            toUser: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        _count: {
          select: {
            assignmentBatches: true,
            assignmentCandidates: true,
            contactRevealEvents: true,
            progressUpdates: true,
            reviews: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const validProjects = projects;

    // Resolve skill IDs to skill names for valid projects only
    const allSkillIds = Array.from(new Set(validProjects.flatMap((p: any) => p.skillsRequired)));
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
      skillNames.map((skill: any) => [skill.id, skill.name])
    );

    // Replace skill IDs with skill names in valid projects
    const projectsWithSkillNames = validProjects.map((project: any) => ({
      ...project,
      skillsRequired: project.skillsRequired.map((id: any) => skillIdToName[id] || id)
    }));

    return NextResponse.json({
      success: true,
      projects: projectsWithSkillNames,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching projects for admin:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
