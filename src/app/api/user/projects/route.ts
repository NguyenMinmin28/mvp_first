import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/auth";
import { prisma } from "@/core/database/db";

export async function GET(request: NextRequest) {
  console.log("🚀 Projects API called");
  try {
    const session = await getServerSession(authOptions);
    console.log("🔍 Session:", session?.user ? { id: session.user.id, role: session.user.role } : "No session");
    
    if (!session?.user?.id) {
      console.log("❌ No session or user ID");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log(`🔍 Fetching projects for developer user: ${session.user.id}`);

    // First, get the developer profile
    console.log("🔍 Getting developer profile...");
    let developerProfile;
    try {
      developerProfile = await prisma.developerProfile.findUnique({
        where: { userId: session.user.id }
      });
    } catch (error) {
      console.error("❌ Error getting developer profile:", error);
      throw error;
    }

    if (!developerProfile) {
      console.log("❌ Developer profile not found");
      return NextResponse.json({
        projects: []
      });
    }

    console.log("🔍 Developer profile found:", developerProfile.id);

    // Then get assignments for this developer
    console.log("🔍 Starting database query for assignments...");
    let assignments;
    try {
      // First try a simple query without complex includes
      assignments = await prisma.assignmentCandidate.findMany({
        where: {
          developerId: developerProfile.id
        },
        include: {
          project: true
        },
        orderBy: {
          assignedAt: 'desc'
        }
      });
      
      console.log("🔍 Basic assignments query successful, getting additional data...");
      
      // Now get additional data for each project
      for (let i = 0; i < assignments.length; i++) {
        const assignment = assignments[i];
        if (assignment.project) {
          try {
            const projectWithDetails = await prisma.project.findUnique({
              where: { id: assignment.project.id },
              include: {
                client: {
                  include: {
                    user: {
                      select: { name: true, email: true }
                    }
                  }
                },
                _count: {
                  select: {
                    assignmentCandidates: true
                  }
                }
              }
            });
            assignments[i].project = projectWithDetails;
          } catch (error) {
            console.error(`❌ Error getting project details for ${assignment.project.id}:`, error);
            // Keep the basic project data
          }
        }
      }
    } catch (error) {
      console.error("❌ Error getting assignments:", error);
      throw error;
    }

    console.log(`📊 Found ${assignments.length} assignments for developer`);
    console.log("🔍 Assignments data:", assignments.map(a => ({
      id: a.id,
      projectId: a.projectId,
      responseStatus: a.responseStatus,
      projectTitle: a.project?.title
    })));

    // Transform assignments to match the expected format
    console.log("🔍 Starting transform process...");
    const transformedProjects = assignments.map((assignment, index) => {
      console.log(`🔍 Transforming assignment ${index + 1}/${assignments.length}:`, assignment.id);
      const project = assignment.project;
      
      if (!project) {
        console.error(`❌ Project is null for assignment ${assignment.id}`);
        return null;
      }
      
      console.log(`🔍 Project data:`, {
        id: project.id,
        title: project.title,
        status: project.status,
        budget: project.budget,
        budgetMin: project.budgetMin,
        client: project.client ? {
          id: project.client.id,
          user: project.client.user ? {
            name: project.client.user.name,
            email: project.client.user.email
          } : null
        } : null
      });
      
      console.log(`🔍 Assignment data:`, {
        id: assignment.id,
        responseStatus: assignment.responseStatus,
        acceptanceDeadline: assignment.acceptanceDeadline,
        assignedAt: assignment.assignedAt
      });
      
      const now = new Date();
      
      // Determine status based on project status first, then assignment response status
      let status = 'recent'; // default
      
      // First check if project is completed - this takes priority
      if (project.status === 'completed') {
        status = 'completed';
      } else {
        // If pending but past acceptance deadline -> treat as expired (rejected in UI)
        if (
          assignment.responseStatus === 'pending' &&
          assignment.acceptanceDeadline &&
          assignment.acceptanceDeadline < now
        ) {
          status = 'rejected';
        } else {
          // If project is not completed, check assignment status
          switch (assignment.responseStatus) {
            case 'accepted':
              status = 'approved';
              break;
            case 'rejected':
              status = 'rejected';
              break;
            case 'expired':
              status = 'rejected';
              break;
            case 'pending':
              status = 'recent';
              break;
            default:
              status = project.status === 'submitted' ? 'recent' : 
                      project.status === 'accepted' ? 'approved' :
                      project.status === 'canceled' ? 'rejected' :
                      project.status === 'in_progress' ? 'in_progress' : 'recent';
          }
        }
      }
      
      return {
        id: project.id,
        name: project.title,
        description: project.description,
        status,
        date: project.createdAt?.toISOString() || new Date().toISOString(),
        budget: project.budget || project.budgetMin,
        currency: project.currency,
        skills: project.skillsRequired || [],
        assignmentStatus: project._count?.assignmentCandidates > 0 ? 'Has candidates' : 'No candidates',
        assignment: {
          id: assignment.id,
          acceptanceDeadline: assignment.acceptanceDeadline?.toISOString() || new Date().toISOString(),
          responseStatus: assignment.responseStatus,
          assignedAt: assignment.assignedAt?.toISOString() || new Date().toISOString(),
          batchId: assignment.batchId
        },
        client: project.client ? {
          name: project.client.user?.name || 'Unknown',
          rating: 4.5, // Default rating
          location: 'Unknown'
        } : undefined
      };
    }).filter(project => project !== null);

    console.log(`✅ Returning ${transformedProjects.length} transformed projects`);
    console.log("🔍 Transformed projects:", transformedProjects.map(p => ({
      id: p.id,
      name: p.name,
      status: p.status
    })));
    
    return NextResponse.json({
      projects: transformedProjects
    });
  } catch (error) {
    console.error("❌ Error fetching projects:", error);
    console.error("❌ Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    return NextResponse.json(
      { 
        error: "Failed to fetch projects",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
