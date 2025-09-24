// @ts-nocheck
import { prisma } from "@/core/database/db";
import { 
  BatchSelectionCriteria, 
  DeveloperCandidate,
  handleTransientError,
  getNextBatchNumber,
  deduplicateCandidates
} from './rotation-helpers';
import { rebalanceAndTrim } from './rotation-quota';

export interface BatchGenerationResult {
  batchId: string;
  candidates: DeveloperCandidate[];
  selection: BatchSelectionCriteria;
}

/**
 * Ultra-fast RotationService - Maximum performance version
 * Uses single aggregation pipeline and minimal database operations
 */
export class RotationServiceUltraFast {
  private static readonly DEFAULT_SELECTION: BatchSelectionCriteria = {
    fresherCount: 5,
    midCount: 5,
    expertCount: 3
  };

  private static readonly ACCEPTANCE_DEADLINE_MINUTES = 15;

  /**
   * Ultra-fast candidate selection using single aggregation pipeline
   */
  static async selectCandidatesUltraFast(
    skillsRequired: string[],
    clientUserId: string,
    projectId: string,
    selection: BatchSelectionCriteria,
    excludeDeveloperIds: string[] = []
  ): Promise<DeveloperCandidate[]> {
    console.time('selectCandidatesUltraFast');
    
    const pipeline = [
      // Stage 1: Match base eligible developers
      {
        $match: {
          adminApprovalStatus: "approved",
          currentStatus: { $in: ["available", "checking", "busy", "away"] },
          userId: { $ne: clientUserId },
          whatsappVerified: true,
          ...(excludeDeveloperIds.length > 0 && { _id: { $nin: excludeDeveloperIds } })
        }
      },
      
      // Stage 2: Join with skills and filter by required skills in one step
      {
        $lookup: {
          from: "DeveloperSkill",
          let: { devId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$developerProfileId", "$$devId"] },
                    { $in: ["$skillId", skillsRequired] }
                  ]
                }
              }
            }
          ],
          as: "skills"
        }
      },
      
      // Stage 3: Filter developers who have required skills
      {
        $match: {
          skills: { $ne: [] }
        }
      },
      
      // Stage 4: Join with assignment candidates to exclude current project (optimized)
      {
        $lookup: {
          from: "AssignmentCandidate",
          let: { devId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$developerId", "$$devId"] },
                    { $eq: ["$projectId", projectId] },
                    { $in: ["$responseStatus", ["pending", "accepted"]] }
                  ]
                }
              }
            },
            { $limit: 1 }
          ],
          as: "inProject"
        }
      },
      
      // Stage 5: Exclude developers in current project
      {
        $match: {
          inProject: { $size: 0 }
        }
      },
      
      // Stage 6: Join with recent responses for response time (simplified)
      {
        $lookup: {
          from: "AssignmentCandidate",
          let: { devId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$developerId", "$$devId"] },
                    { $in: ["$responseStatus", ["accepted", "rejected"]] },
                    { $ne: ["$respondedAt", null] },
                    { $ne: ["$assignedAt", null] }
                  ]
                }
              }
            },
            {
              $addFields: {
                responseTimeMs: {
                  $subtract: ["$respondedAt", "$assignedAt"]
                }
              }
            },
            { $sort: { respondedAt: -1 } },
            { $limit: 3 } // Reduced from 5 to 3 for speed
          ],
          as: "recentResponses"
        }
      },
      
      // Stage 7: Calculate average response time (simplified)
      {
        $addFields: {
          avgResponseTimeMs: {
            $cond: {
              if: { $gt: [{ $size: "$recentResponses" }, 0] },
              then: {
                $avg: "$recentResponses.responseTimeMs"
              },
              else: 60000
            }
          }
        }
      },
      
      // Stage 8: Unwind skills to get one row per developer-skill combination
      {
        $unwind: "$skills"
      },
      
      // Stage 9: Project final fields
      {
        $project: {
          developerId: "$_id",
          level: 1,
          skillId: "$skills.skillId",
          avgResponseTimeMs: 1,
          _id: 0
        }
      },
      
      // Stage 10: Sort for consistent ordering
      {
        $sort: {
          level: 1,
          avgResponseTimeMs: 1,
          developerId: 1
        }
      },
      
      // Stage 11: Limit to reasonable number
      {
        $limit: 100 // Reduced from 200 to 100 for speed
      }
    ];
    
    const result = await prisma.$runCommandRaw({
      aggregate: "DeveloperProfile",
      pipeline,
      cursor: {},
      allowDiskUse: true,
      maxTimeMS: 1000 // Reduced timeout to 1 second
    });
    
    const candidates = result.cursor.firstBatch.map((doc: any) => ({
      developerId: String(doc.developerId),
      level: doc.level,
      skillIds: [String(doc.skillId)],
      usualResponseTimeMs: Math.round(doc.avgResponseTimeMs || 60000)
    }));
    
    // Deduplicate and rebalance
    const deduped = deduplicateCandidates(candidates, skillsRequired);
    const finalCandidates = rebalanceAndTrim(deduped, selection);
    
    console.timeEnd('selectCandidatesUltraFast');
    console.log(`Ultra-fast selection found ${finalCandidates.length} candidates`);
    
    return finalCandidates;
  }

  /**
   * Ultra-fast batch generation
   */
  static async generateBatchUltraFast(
    projectId: string,
    customSelection?: Partial<BatchSelectionCriteria>
  ): Promise<BatchGenerationResult> {
    console.time('generateBatchUltraFast');
    
    const selection = { ...this.DEFAULT_SELECTION, ...customSelection };
    
    // Get project data in single query
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        skillsRequired: true,
        status: true,
        currentBatchId: true,
        client: {
          select: {
            userId: true
          }
        }
      }
    });

    if (!project) {
      throw new Error("Project not found");
    }

    if (["in_progress", "completed"].includes(project.status)) {
      throw new Error(`Cannot generate batch for project with status: ${project.status}`);
    }

    // Get blocked developers in single aggregation
    const blockedDevelopers = await this.getBlockedDevelopersUltraFast(projectId);

    // Select candidates using ultra-fast method
    const candidates = await this.selectCandidatesUltraFast(
      project.skillsRequired,
      project.client.userId,
      projectId,
      selection,
      blockedDevelopers
    );

    // Handle no candidates case
    if (candidates.length === 0) {
      console.log(`No candidates found for project ${projectId}, creating empty batch`);
      return await this.createEmptyBatchUltraFast(projectId, selection);
    }

    // Create batch and candidates in single transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create batch
      const batch = await tx.assignmentBatch.create({
        data: {
          projectId,
          batchNumber: await getNextBatchNumber(tx, projectId),
          status: "active",
          selection: selection as any,
          createdAt: new Date(),
        },
      });

      // Bulk create candidates
      const acceptanceDeadline = new Date(Date.now() + this.ACCEPTANCE_DEADLINE_MINUTES * 60 * 1000);
      
      await tx.assignmentCandidate.createMany({
        data: candidates.map((candidate) => ({
          batchId: batch.id,
          projectId,
          developerId: candidate.developerId,
          level: candidate.level,
          assignedAt: new Date(),
          acceptanceDeadline,
          responseStatus: "pending" as const,
          usualResponseTimeMsSnapshot: candidate.usualResponseTimeMs,
          statusTextForClient: "developer is checking",
          isFirstAccepted: false,
          source: "AUTO_ROTATION",
        }))
      });

      // Update project
      await tx.project.update({
        where: { id: projectId },
        data: { 
          currentBatchId: batch.id,
          status: "assigning"
        },
      });

      return {
        batchId: batch.id,
        candidates,
        selection,
      };
    }, {
      timeout: 5000 // Reduced timeout to 5 seconds
    });

    // Send notifications asynchronously (outside transaction)
    setImmediate(async () => {
      try {
        const { NotificationService } = await import('./notification.service');
        await NotificationService.sendBatchNotifications(result.batchId);
      } catch (error) {
        console.error("Failed to send batch notifications:", error);
      }
    });

    console.timeEnd('generateBatchUltraFast');
    return result;
  }

  /**
   * Ultra-fast blocked developers query
   */
  private static async getBlockedDevelopersUltraFast(projectId: string): Promise<string[]> {
    const pipeline = [
      {
        $match: {
          projectId: projectId,
          responseStatus: { $in: ["pending", "accepted"] }
        }
      },
      {
        $group: {
          _id: "$developerId"
        }
      },
      {
        $project: {
          developerId: "$_id",
          _id: 0
        }
      }
    ];
    
    const result = await prisma.$runCommandRaw({
      aggregate: "AssignmentCandidate",
      pipeline,
      cursor: {}
    });
    
    return result.cursor.firstBatch.map((doc: any) => doc.developerId);
  }

  /**
   * Create empty batch ultra-fast
   */
  private static async createEmptyBatchUltraFast(
    projectId: string,
    selection: BatchSelectionCriteria
  ): Promise<BatchGenerationResult> {
    const result = await prisma.$transaction(async (tx) => {
      const emptyBatch = await tx.assignmentBatch.create({
        data: {
          projectId,
          batchNumber: await getNextBatchNumber(tx, projectId),
          status: "completed",
          selection: selection as any,
          createdAt: new Date(),
        },
      });

      await tx.project.update({
        where: { id: projectId },
        data: { 
          currentBatchId: emptyBatch.id,
          status: "submitted"
        },
      });

      return {
        batchId: emptyBatch.id,
        candidates: [],
        selection,
      };
    });

    return result;
  }

  /**
   * Check if project can generate new batch - ultra-fast
   */
  static async canGenerateNewBatchUltraFast(projectId: string): Promise<boolean> {
    try {
      // Single aggregation to check batch count and last batch status
      const pipeline = [
        { $match: { projectId } },
        { $sort: { createdAt: -1 } },
        { $limit: 1 },
        {
          $lookup: {
            from: "AssignmentCandidate",
            localField: "_id",
            foreignField: "batchId",
            as: "candidates"
          }
        },
        {
          $project: {
            batchCount: { $size: [] }, // This will be calculated differently
            candidatesCount: { $size: "$candidates" }
          }
        }
      ];
      
      const result = await prisma.$runCommandRaw({
        aggregate: "AssignmentBatch",
        pipeline,
        cursor: {}
      });
      
      const lastBatch = result.cursor.firstBatch[0];
      
      // Simple check: if last batch was empty, likely exhausted
      if (lastBatch && lastBatch.candidatesCount === 0) {
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error checking if can generate new batch:", error);
      return true;
    }
  }

  /**
   * Auto-expire pending candidates - ultra-fast
   */
  static async expirePendingCandidatesUltraFast(): Promise<number> {
    const result = await prisma.assignmentCandidate.updateMany({
      where: {
        responseStatus: "pending",
        acceptanceDeadline: { lt: new Date() },
        source: "AUTO_ROTATION",
      },
      data: {
        responseStatus: "expired",
        respondedAt: new Date(),
      },
    });

    return result.count;
  }

  /**
   * Accept candidate - simplified version
   */
  static async acceptCandidateUltraFast(candidateId: string, userId: string): Promise<{
    success: boolean;
    message: string;
    project?: any;
  }> {
    return await prisma.$transaction(async (tx: any) => {
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

      if (candidate.developer.userId !== userId) {
        throw new Error("You can only accept your own assignments");
      }

      if (candidate.responseStatus !== "pending") {
        throw new Error(`Cannot accept candidate with status: ${candidate.responseStatus}`);
      }

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

      if (candidate.batch.project.client.userId === userId) {
        throw new Error("You cannot accept your own project");
      }

      // Atomic project claim
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

      // Update candidate
      const updated = await tx.assignmentCandidate.updateMany({
        where: {
          id: candidateId,
          responseStatus: "pending",
          isFirstAccepted: false,
          OR: [
            { acceptanceDeadline: null },
            { acceptanceDeadline: { gte: new Date() } }
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

      // Mark batch as completed
      await tx.assignmentBatch.update({
        where: { id: candidate.batchId },
        data: { status: "completed" },
      });

      // Create ContactGrant
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
        update: {}
      });

      return {
        success: true,
        message: "Assignment accepted successfully! The client can now contact you.",
        project: candidate.batch.project,
      };
    });
  }

  /**
   * Reject candidate - simplified version
   */
  static async rejectCandidateUltraFast(candidateId: string, userId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    return await prisma.$transaction(async (tx: any) => {
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

      if (candidate.developer.userId !== userId) {
        throw new Error("You can only reject your own assignments");
      }

      if (candidate.responseStatus !== "pending") {
        throw new Error(`Cannot reject candidate with status: ${candidate.responseStatus}`);
      }

      if (candidate.batch.status !== "active") {
        throw new Error(`Cannot reject candidate from ${candidate.batch.status} batch`);
      }

      const updated = await tx.assignmentCandidate.updateMany({
        where: {
          id: candidateId,
          responseStatus: "pending",
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
}
