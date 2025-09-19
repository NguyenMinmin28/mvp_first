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
        { error: "Only clients can view project assignments" },
        { status: 403 }
      );
    }

    // Get project with client verification
    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        client: {
          userId: session.user.id
        }
      },
      include: {
        client: true,
      }
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Get current batch candidates
    let candidates: any[] = [];
    console.log('Project currentBatchId:', project.currentBatchId);
    
    // Debug: Check all batches for this project
    const allBatches = await prisma.assignmentBatch.findMany({
      where: { projectId: params.id },
      include: {
        candidates: {
          select: {
            id: true,
            responseStatus: true,
            developerId: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    console.log('All batches for project:', allBatches.map(b => ({
      id: b.id,
      batchNumber: b.batchNumber,
      status: b.status,
      candidatesCount: b.candidates.length,
      responseStatusCounts: b.candidates.reduce((acc, c) => {
        acc[c.responseStatus] = (acc[c.responseStatus] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      isCurrentBatch: b.id === project.currentBatchId
    })));
    
    // Check if currentBatchId matches the batch with accepted candidates
    const batchWithAccepted = allBatches.find(b => 
      b.candidates.some(c => c.responseStatus === 'accepted')
    );
    console.log('Batch with accepted candidates:', batchWithAccepted ? {
      id: batchWithAccepted.id,
      batchNumber: batchWithAccepted.batchNumber,
      isCurrentBatch: batchWithAccepted.id === project.currentBatchId
    } : 'None found');
    
    // Find the batch with accepted candidates, or fallback to currentBatchId
    let targetBatchId = project.currentBatchId;
    if (batchWithAccepted && batchWithAccepted.id !== project.currentBatchId) {
      console.log('Using batch with accepted candidates instead of currentBatchId');
      targetBatchId = batchWithAccepted.id;
    }
    
    console.log('Using targetBatchId:', targetBatchId, 'instead of currentBatchId:', project.currentBatchId);
    
    if (targetBatchId) {
      candidates = await prisma.assignmentCandidate.findMany({
        where: {
          batchId: targetBatchId
        },
        include: {
          developer: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                }
              },
              skills: {
                include: {
                  skill: {
                    select: {
                      name: true
                    }
                  }
                }
              },
              // expose optional public fields for card
              _count: false
            }
          }
        },
        orderBy: [
          { level: "desc" }, // EXPERT first
          { assignedAt: "asc" }
        ]
      });
      
      console.log('Query result - candidates count:', candidates.length);
      console.log('Query result - responseStatus counts:', candidates.reduce((acc, c) => {
        acc[c.responseStatus] = (acc[c.responseStatus] || 0) + 1;
        return acc;
      }, {} as Record<string, number>));
      
      // Debug: Check if any candidate has responded recently
      const recentResponses = candidates.filter(c => c.respondedAt && 
        new Date(c.respondedAt).getTime() > Date.now() - 5 * 60 * 1000); // Last 5 minutes
      console.log('Recent responses (last 5 minutes):', recentResponses.map(c => ({
        developerName: c.developer.user.name,
        responseStatus: c.responseStatus,
        respondedAt: c.respondedAt
      })));
    }

    // Get skills for the project
    const skills = await prisma.skill.findMany({
      where: {
        id: { in: project.skillsRequired }
      },
      select: {
        id: true,
        name: true
      }
    });

    // Determine lock status: if any candidate accepted OR project status is accepted/in_progress/completed
    const hasAccepted = allBatches.some(b => b.candidates.some(c => c.responseStatus === 'accepted'));
    const locked = hasAccepted || ["accepted", "in_progress", "completed"].includes(project.status as any);

    return NextResponse.json({
      project: {
        id: project.id,
        title: project.title,
        description: project.description,
        skillsRequired: project.skillsRequired,
        status: project.status,
        locked,
        contactRevealEnabled: project.contactRevealEnabled,
        currentBatchId: project.currentBatchId,
        budget: (project as any).budget,
        budgetMin: (project as any).budgetMin,
        budgetMax: (project as any).budgetMax,
        currency: (project as any).currency,
        expectedStartAt: (project as any).expectedStartAt,
        expectedEndAt: (project as any).expectedEndAt,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      },
      candidates: (() => {
        const mappedCandidates = candidates.map(candidate => ({
          id: candidate.id,
          developerId: candidate.developerId,
          level: candidate.level,
          responseStatus: candidate.responseStatus,
          acceptanceDeadline: candidate.acceptanceDeadline,
          assignedAt: candidate.assignedAt,
          respondedAt: candidate.respondedAt,
          usualResponseTimeMsSnapshot: candidate.usualResponseTimeMsSnapshot,
          statusTextForClient: candidate.statusTextForClient,
          developer: {
            id: candidate.developer.id,
            user: candidate.developer.user,
            level: candidate.developer.level,
            photoUrl: (candidate.developer as any).photoUrl ?? null,
            location: (candidate.developer as any).location ?? null,
            hourlyRateUsd: (candidate.developer as any).hourlyRateUsd ?? null,
            experienceYears: (candidate.developer as any).experienceYears ?? null,
            // expose whatsapp number for contact reveal when accepted
            whatsappNumber: (candidate.developer as any).whatsappNumber ?? null,
            skills: candidate.developer.skills.map((skill: any) => ({
              skill: { name: skill.skill.name },
              years: skill.years
            }))
          }
        }));
        
        // Debug log to check API response
    console.log('API /assignment response - candidates (before deduplication):', mappedCandidates.map(c => ({
      id: c.id,
      developerId: c.developerId,
      developerIdFromNested: c.developer.id,
      responseStatus: c.responseStatus,
      developerName: c.developer.user.name
    })));
    
    // Deduplicate candidates - keep only the latest one for each developer
    const uniqueCandidates = mappedCandidates.reduce((acc, candidate) => {
      const existingCandidate = acc[candidate.developer.id];
      if (!existingCandidate || candidate.assignedAt > existingCandidate.assignedAt) {
        acc[candidate.developer.id] = candidate;
      }
      return acc;
    }, {} as Record<string, any>);
    
    const finalCandidates = Object.values(uniqueCandidates);
    
    console.log('API /assignment response - candidates (after deduplication):', finalCandidates.map(c => ({
      id: c.id,
      developerId: c.developerId,
      developerIdFromNested: c.developer.id,
      responseStatus: c.responseStatus,
      developerName: c.developer.user.name
    })));
    
    // Debug specific developer
    const minhCandidate = finalCandidates.find(c => c.developer.user.name === 'Nguyen Vo Tan Minh');
    if (minhCandidate) {
      console.log('Minh candidate details (final):', {
        id: minhCandidate.id,
        developerId: minhCandidate.developerId,
        responseStatus: minhCandidate.responseStatus,
        batchId: minhCandidate.batchId,
        targetBatchId: targetBatchId
      });
    }
        
        return finalCandidates;
      })(),
      skills
    });

  } catch (error) {
    console.error("Error fetching assignment data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
