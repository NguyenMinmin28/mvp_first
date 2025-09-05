import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/auth";
import { prisma } from "@/core/database/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get projects with assignment information for the current user
    const projects = await prisma.project.findMany({
      include: {
        client: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        },
        assignmentCandidates: {
          where: {
            developer: {
              userId: session.user.id
            }
          },
          include: {
            developer: true
          },
          orderBy: {
            assignedAt: 'desc'
          },
          take: 1 // Get the most recent assignment
        },
        _count: {
          select: {
            assignmentCandidates: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform projects to match the expected format
    const transformedProjects = projects.map(project => {
      const latestAssignment = project.assignmentCandidates[0];
      
      // Determine status based on assignment response status for current user
      let status = 'recent'; // default
      if (latestAssignment) {
        switch (latestAssignment.responseStatus) {
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
                    project.status === 'in_progress' ? 'in_progress' :
                    project.status === 'completed' ? 'completed' : 'recent';
        }
      } else {
        // No assignment, use project status
        status = project.status === 'submitted' ? 'recent' : 
                project.status === 'accepted' ? 'approved' :
                project.status === 'canceled' ? 'rejected' :
                project.status === 'in_progress' ? 'in_progress' :
                project.status === 'completed' ? 'completed' : 'recent';
      }
      
      return {
        id: project.id,
        name: project.title,
        description: project.description,
        status,
        date: project.createdAt.toISOString(),
        budget: project.budget,
        currency: project.currency,
        skills: project.skillsRequired || [],
        assignmentStatus: project._count.assignmentCandidates > 0 ? 'Has candidates' : 'No candidates',
        assignment: latestAssignment ? {
          id: latestAssignment.id,
          acceptanceDeadline: latestAssignment.acceptanceDeadline.toISOString(),
          responseStatus: latestAssignment.responseStatus,
          assignedAt: latestAssignment.assignedAt.toISOString(),
          batchId: latestAssignment.batchId
        } : undefined,
        client: project.client ? {
          name: project.client.user.name || 'Unknown',
          rating: 4.5, // Default rating
          location: 'Unknown'
        } : undefined
      };
    });

    return NextResponse.json({
      projects: transformedProjects
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}
