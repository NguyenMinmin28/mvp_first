// @ts-nocheck
import { prisma } from "@/core/database/db";
import { RotationBatch, BatchGenerationResult } from './rotation-batch';
import { RotationCore } from './rotation-core';
import { 
  BatchSelectionCriteria, 
  DeveloperCandidate,
  handleTransientError
} from './rotation-helpers';
import { RotationCache } from './rotation-cache';

/**
 * Refactored RotationService - Main entry point
 * Reduced from ~1796 lines to ~200 lines by modularization
 */
export class RotationService {
  private static readonly DEFAULT_SELECTION: BatchSelectionCriteria = {
    fresherCount: 5,
    midCount: 5,
    expertCount: 3
  };

  /**
   * Check if project can generate new batch (hasn't exhausted developer pool)
   */
  static async canGenerateNewBatch(projectId: string): Promise<boolean> {
    return RotationBatch.canGenerateNewBatch(projectId);
  }

  /**
   * Main entry point for generating assignment batch
   */
  static async generateBatch(
    projectId: string,
    customSelection?: Partial<BatchSelectionCriteria>
  ): Promise<BatchGenerationResult> {
    return RotationBatch.generateBatch(projectId, customSelection);
  }

  /**
   * Core algorithm: Select candidates by skill and level with fair rotation
   */
  static async selectCandidates(
    tx: any,
    skillsRequired: string[],
    clientUserId: string,
    projectId: string,
    selection: BatchSelectionCriteria,
    excludeDeveloperIds: string[] = [],
    existingBatchesCount: number = 0
  ): Promise<DeveloperCandidate[]> {
    // Check cache first
    const cacheKey = RotationCache.generateKey(projectId, skillsRequired, selection);
    const cached = RotationCache.get(cacheKey);
    if (cached) {
      console.log("Cache hit for rotation candidates");
      return cached;
    }

    // Get candidates using core logic
    const candidates = await RotationCore.selectCandidates(
      tx,
      skillsRequired,
      clientUserId,
      projectId,
      selection,
      excludeDeveloperIds,
      existingBatchesCount
    );

    // Cache the result
    RotationCache.set(cacheKey, candidates);

    return candidates;
  }

  /**
   * Auto-expire pending candidates (only AUTO_ROTATION candidates with deadlines)
   */
  static async expirePendingCandidates(): Promise<number> {
    const result = await prisma.assignmentCandidate.updateMany({
      where: {
        responseStatus: "pending",
        acceptanceDeadline: { lt: new Date() },
        source: "AUTO_ROTATION", // Only expire auto-rotation candidates
      },
      data: {
        responseStatus: "expired",
        respondedAt: new Date(), // For accurate response time statistics
      },
    });

    return result.count;
  }

  /**
   * Accept candidate - atomic first-accept
   */
  static async acceptCandidate(candidateId: string, userId: string): Promise<{
    success: boolean;
    message: string;
    project?: any;
  }> {
    return await prisma.$transaction(async (tx: any) => {
      // 1. Find and validate candidate with project info
      const candidate = await tx.assignmentCandidate.findUnique({
        where: { id: candidateId },
        include: {
          batch: {
            include: {
              project: {
                include: {
                  client: { include: { user: true } }
                }
              }
            }
          },
          developer: { include: { user: true } }
        },
      });

      if (!candidate) {
        throw new Error("Candidate not found");
      }

      // 2. Validate eligibility
      if (candidate.developer.userId !== userId) {
        throw new Error("You can only accept your own assignments");
      }

      if (candidate.responseStatus !== "pending") {
        throw new Error(`Cannot accept candidate with status: ${candidate.responseStatus}`);
      }

      // Check deadline only for auto-rotation candidates (manual invites have null deadline)
      if (candidate.acceptanceDeadline && new Date() > candidate.acceptanceDeadline) {
        throw new Error("Acceptance deadline has passed");
      }

      if (candidate.batch.status !== "active") {
        throw new Error(`Cannot accept candidate from ${candidate.batch.status} batch`);
      }

      if (candidate.batch.project.currentBatchId !== candidate.batchId) {
        throw new Error("This batch is no longer current");
      }

      if (candidate.isFirstAccepted) {
        throw new Error("This candidate has already been marked as first accepted");
      }

      // Prevent accepting own project
      if (candidate.batch.project.client.userId === userId) {
        throw new Error("You cannot accept your own project");
      }

      // 3. Atomic project claim (critical for race prevention)
      const projectClaim = await tx.project.updateMany({
        where: {
          id: candidate.projectId,
          currentBatchId: candidate.batchId,
          contactRevealEnabled: false,
          status: { in: ["assigning", "submitted"] },
        },
        data: {
          status: "accepted",
          contactRevealEnabled: true,
          contactRevealedDeveloperId: candidate.developerId,
        },
      });

      if (projectClaim.count !== 1) {
        throw new Error("Project already accepted by another developer or batch replaced");
      }

      // 4. Update candidate with additional validation in WHERE clause
      const updated = await tx.assignmentCandidate.updateMany({
        where: {
          id: candidateId,
          responseStatus: "pending",
          isFirstAccepted: false,
          // For manual invites (acceptanceDeadline = null), don't check deadline
          // For auto-rotation, check deadline
          OR: [
            { acceptanceDeadline: null }, // Manual invites
            { acceptanceDeadline: { gte: new Date() } } // Auto-rotation with valid deadline
          ]
        },
        data: {
          responseStatus: "accepted",
          respondedAt: new Date(),
          isFirstAccepted: true,
        },
      });

      if (updated.count !== 1) {
        throw new Error("Candidate no longer pending or deadline passed");
      }

      // 5. Mark batch as completed
      await tx.assignmentBatch.update({
        where: { id: candidate.batchId },
        data: { status: "completed" },
      });

      // 6. Create ContactGrant for client to view developer contact
      await tx.contactGrant.upsert({
        where: {
          clientId_developerId_projectId: {
            clientId: candidate.batch.project.client.id,
            developerId: candidate.developerId,
            projectId: candidate.projectId
          }
        },
        create: {
          clientId: candidate.batch.project.client.id,
          developerId: candidate.developerId,
          projectId: candidate.projectId,
          reason: 'ACCEPTED_PROJECT',
          allowEmail: true,
          allowPhone: true,
          allowWhatsApp: true
        },
        update: {} // idempotent - don't update if already exists
      });

      return {
        success: true,
        message: "Assignment accepted successfully! The client can now contact you.",
        project: candidate.batch.project,
      };
    });
  }

  /**
   * Reject candidate - atomic rejection
   */
  static async rejectCandidate(candidateId: string, userId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    return await prisma.$transaction(async (tx: any) => {
      // 1. Find and validate candidate
      const candidate = await tx.assignmentCandidate.findUnique({
        where: { id: candidateId },
        include: {
          developer: { include: { user: true } },
          batch: true,
        },
      });

      if (!candidate) {
        throw new Error("Candidate not found");
      }

      // 2. Validate eligibility
      if (candidate.developer.userId !== userId) {
        throw new Error("You can only reject your own assignments");
      }

      if (candidate.responseStatus !== "pending") {
        throw new Error(`Cannot reject candidate with status: ${candidate.responseStatus}`);
      }

      if (candidate.batch.status !== "active") {
        throw new Error(`Cannot reject candidate from ${candidate.batch.status} batch`);
      }

      // 3. Update candidate with validation in WHERE clause
      const updated = await tx.assignmentCandidate.updateMany({
        where: {
          id: candidateId,
          responseStatus: "pending",
          // Allow rejection even after deadline for better UX
        },
        data: {
          responseStatus: "rejected",
          respondedAt: new Date(),
        },
      });

      if (updated.count !== 1) {
        throw new Error("Candidate no longer pending or deadline passed");
      }

      return {
        success: true,
        message: "Assignment rejected successfully.",
      };
    });
  }

  /**
   * Refresh batch - replace individual pending candidates while preserving accepted ones
   */
  static async refreshBatch(
    projectId: string,
    customSelection?: Partial<BatchSelectionCriteria>
  ): Promise<BatchGenerationResult> {
    return handleTransientError(async () => {
      const result = await prisma.$transaction(async (tx: any) => {
        // Get current batch with candidates
        const project = await tx.project.findUnique({
          where: { id: projectId },
          select: { 
            currentBatchId: true,
            currentBatch: {
              include: {
                candidates: {
                  select: {
                    id: true,
                    responseStatus: true,
                    developerId: true,
                    level: true,
                    usualResponseTimeMsSnapshot: true,
                    acceptanceDeadline: true,
                    assignedAt: true,
                    respondedAt: true
                  }
                }
              }
            }
          },
        });

        if (project?.currentBatchId) {
          // Get accepted candidates to preserve them
          const acceptedCandidates = project.currentBatch?.candidates?.filter(
            (candidate: any) => candidate.responseStatus === "accepted"
          ) || [];

          // Get all non-accepted candidates to replace them (pending, rejected, expired, invalidated)
          const nonAcceptedCandidates = project.currentBatch?.candidates?.filter(
            (candidate: any) => candidate.responseStatus !== "accepted"
          ) || [];

          console.log(`Refreshing batch: ${acceptedCandidates.length} accepted, ${nonAcceptedCandidates.length} non-accepted to replace`);

          // Calculate how many new candidates we need to add to reach target batch size (15)
          const targetBatchSize = 15;
          const currentAcceptedCount = acceptedCandidates.length;
          const neededNewCandidates = Math.max(0, targetBatchSize - currentAcceptedCount);
          
          console.log(`Target batch size: ${targetBatchSize}, current accepted: ${currentAcceptedCount}, need ${neededNewCandidates} new candidates`);

          // Invalidate all non-accepted candidates
          const invalidateResult = await tx.assignmentCandidate.updateMany({
            where: {
              batchId: project.currentBatchId,
              responseStatus: { not: "accepted" },
            },
            data: {
              responseStatus: "invalidated",
              invalidatedAt: new Date(),
            },
          });
          
          console.log(`🔄 Invalidated ${invalidateResult.count} non-accepted candidates in batch ${project.currentBatchId}`);

          // If we need new candidates, generate them using the same logic as generateBatch
          const replacementCandidates: DeveloperCandidate[] = [];
          
          if (neededNewCandidates > 0) {
            console.log(`🔄 Generating ${neededNewCandidates} new candidates to reach target batch size`);
            
            // Get project details for candidate selection
            const projectDetails = await tx.project.findUnique({
              where: { id: projectId },
              include: {
                client: { include: { user: true } },
              },
            });

            if (projectDetails) {
              // Use the same selection logic as generateBatch
              const selection = { ...this.DEFAULT_SELECTION, ...customSelection };
              
              // Get accepted developer IDs to exclude them
              const acceptedIds = acceptedCandidates.map(c => c.developerId);
              
              // Count existing batches to determine exclusion strategy
              const existingBatchesCount = await tx.assignmentBatch.count({
                where: { projectId }
              });

              // Progressive exclusion strategy - less aggressive
              let excludeDeveloperIds: string[] = [...acceptedIds];
              
              if (existingBatchesCount >= 5) {
                // Only after 5+ batches, exclude developers from recent batches
                console.log(`Project ${projectId} has ${existingBatchesCount} batches, excluding developers from recent batches`);
                const recentBatches = await tx.assignmentBatch.findMany({
                  where: { projectId },
                  orderBy: { createdAt: 'desc' },
                  take: 2,
                  select: { id: true }
                });
                
                if (recentBatches.length > 0) {
                  const recentBatchIds = recentBatches.map(b => b.id);
                  const recentlyAssigned = await tx.assignmentCandidate.findMany({
                    where: { 
                      projectId,
                      batchId: { in: recentBatchIds }
                    },
                    select: { developerId: true },
                    distinct: ['developerId']
                  });
                  const recentIds = recentlyAssigned.map(ac => ac.developerId);
                  excludeDeveloperIds = Array.from(new Set([...acceptedIds, ...recentIds]));
                  console.log(`Excluding ${excludeDeveloperIds.length} developers (including ${acceptedIds.length} accepted + ${recentIds.length} from recent batches)`);
                }
              } else if (existingBatchesCount >= 3) {
                // After 3+ batches, only exclude developers from the most recent batch
                console.log(`Project ${projectId} has ${existingBatchesCount} batches, excluding developers from last batch`);
                const lastBatch = await tx.assignmentBatch.findFirst({
                  where: { projectId },
                  orderBy: { createdAt: 'desc' },
                  select: { id: true }
                });
                
                if (lastBatch) {
                  const lastBatchAssigned = await tx.assignmentCandidate.findMany({
                    where: { 
                      projectId,
                      batchId: lastBatch.id
                    },
                    select: { developerId: true },
                    distinct: ['developerId']
                  });
                  const lastBatchIds = lastBatchAssigned.map(ac => ac.developerId);
                  excludeDeveloperIds = Array.from(new Set([...acceptedIds, ...lastBatchIds]));
                  console.log(`Excluding ${excludeDeveloperIds.length} developers (including ${acceptedIds.length} accepted + ${lastBatchIds.length} from last batch)`);
                }
              }
              
              // Generate new candidates using the same algorithm as generateBatch
              const newCandidates = await this.selectCandidates(
                tx,
                projectDetails.skillsRequired,
                projectDetails.client.userId,
                projectId,
                selection,
                excludeDeveloperIds, // Exclude already accepted developers and potentially all previously assigned
                existingBatchesCount
              );

              // Take only the number we need
              const candidatesToAdd = newCandidates.slice(0, neededNewCandidates);
              
              console.log(`🔄 Generated ${candidatesToAdd.length} new candidates`);

              // Create new candidates in the same batch
              const acceptanceDeadline = new Date(Date.now() + 15 * 60 * 1000);
              
              for (const candidate of candidatesToAdd) {
                try {
                  await tx.assignmentCandidate.create({
                    data: {
                      batchId: project.currentBatchId,
                      projectId: projectId,
                      developerId: candidate.developerId,
                      level: candidate.level,
                      assignedAt: new Date(),
                      acceptanceDeadline,
                      responseStatus: "pending" as const,
                      usualResponseTimeMsSnapshot: candidate.usualResponseTimeMs,
                      statusTextForClient: "developer is checking",
                      isFirstAccepted: false,
                      source: "AUTO_ROTATION",
                    },
                  });

                  replacementCandidates.push(candidate);
                  console.log(`✅ Added new candidate ${candidate.developerId} to batch`);
                } catch (error) {
                  console.error(`Error creating new candidate ${candidate.developerId}:`, error);
                }
              }
            }
          }

          // If we found some replacements, send notifications
          if (replacementCandidates.length > 0) {
            try {
              const { NotificationService } = await import('./notification.service');
              await NotificationService.sendBatchNotifications(project.currentBatchId);
            } catch (error) {
              console.error("Failed to send notifications for replacement candidates:", error);
            }
          }

          // Return the updated batch
          const allCandidates = [
            ...acceptedCandidates.map((candidate: any) => ({
              developerId: candidate.developerId,
              level: candidate.level,
              skillIds: [], // Will be populated from developer skills
              usualResponseTimeMs: candidate.usualResponseTimeMsSnapshot,
            })),
            ...replacementCandidates
          ];

          console.log(`🔄 Refresh batch completed: ${acceptedCandidates.length} accepted + ${replacementCandidates.length} new candidates = ${allCandidates.length} total (target: ${targetBatchSize})`);

          return {
            batchId: project.currentBatchId,
            candidates: allCandidates,
            selection: customSelection || this.DEFAULT_SELECTION,
          };
        }

        // Generate new batch using internal method to avoid nested transaction
        return await RotationBatch.generateBatch(projectId, customSelection);
      }, {
        timeout: 30000, // 30 seconds timeout
      });

      // Post-commit cursor updates
      try {
        const skillsRequired = Array.from(new Set(result.candidates.flatMap((c: any) => c.skillIds)));
        if (skillsRequired.length > 0) {
          await RotationBatch.updateRotationCursors(prisma as any, skillsRequired, result.candidates);
        }
      } catch (_) {
        // Non-critical
      }

      return result;
    });
  }
}
