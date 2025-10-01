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
    
    // Use currentBatchId as primary, only fallback to batch with accepted if currentBatchId is null
    let targetBatchId = project.currentBatchId;
    if (!targetBatchId && batchWithAccepted) {
      console.log('No currentBatchId, using batch with accepted candidates as fallback');
      targetBatchId = batchWithAccepted.id;
    }
    
    console.log('Using targetBatchId:', targetBatchId, 'instead of currentBatchId:', project.currentBatchId);
    
    if (targetBatchId) {
      const fetchCandidatesForBatch = async (batchId: string) => {
        // Use raw query to avoid Prisma BSON decoding of null updatedAt in legacy docs
        const raw = await (prisma as any).assignmentCandidate.findRaw({
          filter: {
            batchId: { $oid: batchId },
            responseStatus: { $in: ["pending", "accepted"] }
          },
          options: {
            projection: {
              _id: 1,
              batchId: 1,
              developerId: 1,
              level: 1,
              responseStatus: 1,
              acceptanceDeadline: 1,
              assignedAt: 1,
              respondedAt: 1,
              usualResponseTimeMsSnapshot: 1,
              statusTextForClient: 1,
            }
          }
        });

        // Map ObjectIds to strings and shape like Prisma result
        const toHexId = (v: any): string => {
          if (!v) return "";
          if (typeof v === "string") return v;
          if (typeof v === "object" && typeof v.$oid === "string") return v.$oid;
          if (typeof v.toString === "function") return v.toString();
          try { return JSON.parse(JSON.stringify(v)).$oid ?? String(v); } catch { return String(v); }
        };

        const candidates = (raw as any[]).map((doc: any) => {
          // Derive created time from Mongo ObjectId when date fields are missing
          const oid = doc._id;
          let objectIdTime: Date | null = null;
          try {
            // Mongo ObjectId timestamp is first 4 bytes (seconds since epoch)
            const hex = (typeof oid === 'object' && oid?.$oid) ? String(oid.$oid) : String(oid);
            if (hex && hex.length >= 8) {
              const seconds = parseInt(hex.substring(0, 8), 16);
              if (!Number.isNaN(seconds)) objectIdTime = new Date(seconds * 1000);
            }
          } catch {}

          const assignedAt = doc.assignedAt ? new Date(doc.assignedAt) : (objectIdTime ?? null);
          let acceptanceDeadline = doc.acceptanceDeadline ? new Date(doc.acceptanceDeadline) : null;
          if (!acceptanceDeadline && assignedAt && doc.responseStatus === 'pending') {
            // Fallback: 15 minutes from assignedAt/ObjectId time
            acceptanceDeadline = new Date(assignedAt.getTime() + 15 * 60 * 1000);
          }

          return {
            id: toHexId(doc._id),
            batchId: toHexId(doc.batchId),
            developerId: toHexId(doc.developerId),
            level: doc.level,
            responseStatus: doc.responseStatus,
            acceptanceDeadline,
            assignedAt,
            respondedAt: doc.respondedAt ? new Date(doc.respondedAt) : null,
            usualResponseTimeMsSnapshot: doc.usualResponseTimeMsSnapshot,
            statusTextForClient: doc.statusTextForClient,
          };
        });

        // Batch fetch developer profiles and users
        const developerIds = [...new Set(candidates.map(c => c.developerId))];
        const developers = await prisma.developerProfile.findMany({
          where: { id: { in: developerIds } },
          select: {
            id: true,
            level: true,
            photoUrl: true as any,
            location: true as any,
            hourlyRateUsd: true as any,
            experienceYears: true as any,
            whatsappNumber: true as any,
            user: { select: { id: true, name: true, email: true, image: true } },
            skills: { include: { skill: { select: { name: true } } } },
          }
        });
        const devById = new Map(developers.map(d => [d.id, d]));
        return candidates.map(c => ({
          ...c,
          developer: devById.get(c.developerId) as any,
        }));
      };

      // First try targetBatchId
      candidates = await fetchCandidatesForBatch(targetBatchId);

      // If empty, fallback to most recent batch that has any pending/accepted candidates
      if (candidates.length === 0) {
        const fallbackBatch = await prisma.assignmentBatch.findFirst({
          where: {
            projectId: params.id,
            candidates: {
              some: { responseStatus: { in: ["pending", "accepted"] } }
            }
          },
          orderBy: { createdAt: 'desc' }
        });
        if (fallbackBatch && fallbackBatch.id !== targetBatchId) {
          console.log('Fallback to batch with candidates:', { id: fallbackBatch.id, batchNumber: (fallbackBatch as any).batchNumber });
          targetBatchId = fallbackBatch.id;
          candidates = await fetchCandidatesForBatch(targetBatchId);
        }
      }

      // If still empty, fallback to latest batch and include expired so UI can show context and CTA
      if (candidates.length === 0) {
        const latestBatch = await prisma.assignmentBatch.findFirst({
          where: { projectId: params.id },
          orderBy: { createdAt: 'desc' }
        });
        if (latestBatch) {
          targetBatchId = latestBatch.id;
          // Raw + join developers manually (include expired)
          const raw = await (prisma as any).assignmentCandidate.findRaw({
            filter: {
              batchId: { $oid: targetBatchId },
              responseStatus: { $in: ["pending", "accepted", "expired"] }
            },
            options: {
              projection: {
                _id: 1,
                batchId: 1,
                developerId: 1,
                level: 1,
                responseStatus: 1,
                acceptanceDeadline: 1,
                assignedAt: 1,
                respondedAt: 1,
                usualResponseTimeMsSnapshot: 1,
                statusTextForClient: 1,
              }
            }
          });
          const toHexId = (v: any): string => {
            if (!v) return "";
            if (typeof v === "string") return v;
            if (typeof v === "object" && typeof v.$oid === "string") return v.$oid;
            if (typeof v.toString === "function") return v.toString();
            try { return JSON.parse(JSON.stringify(v)).$oid ?? String(v); } catch { return String(v); }
          };

          const mapped = (raw as any[]).map((doc: any) => ({
            id: toHexId(doc._id),
            batchId: toHexId(doc.batchId),
            developerId: toHexId(doc.developerId),
            level: doc.level,
            responseStatus: doc.responseStatus,
            acceptanceDeadline: doc.acceptanceDeadline ? new Date(doc.acceptanceDeadline) : null,
            assignedAt: doc.assignedAt ? new Date(doc.assignedAt) : null,
            respondedAt: doc.respondedAt ? new Date(doc.respondedAt) : null,
            usualResponseTimeMsSnapshot: doc.usualResponseTimeMsSnapshot,
            statusTextForClient: doc.statusTextForClient,
          }));
          const devIds = [...new Set(mapped.map(c => c.developerId))];
          const devs = await prisma.developerProfile.findMany({
            where: { id: { in: devIds } },
            select: {
              id: true,
              level: true,
              photoUrl: true as any,
              location: true as any,
              hourlyRateUsd: true as any,
              experienceYears: true as any,
              whatsappNumber: true as any,
              user: { select: { id: true, name: true, email: true, image: true } },
              skills: { include: { skill: { select: { name: true } } } },
            }
          });
          const mapDev = new Map(devs.map(d => [d.id, d]));
          candidates = mapped.map(c => ({ ...c, developer: mapDev.get(c.developerId) as any }));
          console.log('Fallback including expired - candidates count:', candidates.length);
        }
      }

      console.log('Query result - candidates count:', candidates.length);
      console.log('Query result - responseStatus counts:', candidates.reduce((acc, c) => {
        acc[c.responseStatus] = (acc[c.responseStatus] || 0) + 1;
        return acc;
      }, {} as Record<string, number>));
      
      const recentResponses = candidates.filter(c => c.respondedAt && 
        new Date(c.respondedAt).getTime() > Date.now() - 5 * 60 * 1000);
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

    // Determine lock status: only lock if project status is in_progress/completed (not just accepted)
    const locked = ["in_progress", "completed"].includes(project.status as any);

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
          batchId: candidate.batchId, // Add batchId for deduplication logic
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
    
    // Deduplicate candidates - prioritize candidates from current batch, then by assignedAt
    const uniqueCandidates = mappedCandidates.reduce((acc, candidate) => {
      const existingCandidate = acc[candidate.developer.id];
      if (!existingCandidate) {
        acc[candidate.developer.id] = candidate;
      } else {
        // Prioritize candidate from current batch (targetBatchId)
        const isCurrentBatch = candidate.batchId === targetBatchId;
        const isExistingCurrentBatch = existingCandidate.batchId === targetBatchId;
        
        if (isCurrentBatch && !isExistingCurrentBatch) {
          // Current batch candidate takes priority
          acc[candidate.developer.id] = candidate;
        } else if (!isCurrentBatch && isExistingCurrentBatch) {
          // Keep existing current batch candidate
          // Do nothing
        } else {
          // Both from same batch type, use latest assignedAt
          if (candidate.assignedAt > existingCandidate.assignedAt) {
            acc[candidate.developer.id] = candidate;
          }
        }
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
      skills,
      searching: !targetBatchId // If there is no batch yet, front-end can show searching state
    });

  } catch (error) {
    console.error("Error fetching assignment data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
