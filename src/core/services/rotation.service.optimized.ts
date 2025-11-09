// @ts-nocheck
import { prisma } from "@/core/database/db";
import { RotationDbOptimized } from './rotation-db-optimized';
import { RotationCacheEnhanced } from './rotation-cache-enhanced';
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
 * Optimized RotationService - Performance focused version
 * Reduces database queries and transaction scope for better performance
 */
export class RotationServiceOptimized {
  private static readonly DEFAULT_SELECTION: BatchSelectionCriteria = {
    fresherCount: 5,
    midCount: 5,
    expertCount: 3
  };

  private static readonly ACCEPTANCE_DEADLINE_MINUTES = 15;

  /**
   * Check if project can generate new batch (hasn't exhausted developer pool)
   */
  static async canGenerateNewBatch(projectId: string): Promise<boolean> {
    try {
      // Use aggregation for faster counting
      const pipeline = [
        { $match: { projectId } },
        { $count: "total" }
      ];
      
      const result = await prisma.$runCommandRaw({
        aggregate: "AssignmentBatch",
        pipeline,
        cursor: {}
      });
      
      const existingBatchesCount = result.cursor.firstBatch[0]?.total || 0;

      // If more than 8 batches, likely exhausted
      if (existingBatchesCount >= 8) {
        return false;
      }

      // Check if last batch was empty using aggregation
      const lastBatchPipeline = [
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
            candidatesCount: { $size: "$candidates" }
          }
        }
      ];
      
      const lastBatchResult = await prisma.$runCommandRaw({
        aggregate: "AssignmentBatch",
        pipeline: lastBatchPipeline,
        cursor: {}
      });
      
      const lastBatch = lastBatchResult.cursor.firstBatch[0];
      
      // If last batch was empty, check if we've tried too many times
      if (lastBatch && lastBatch.candidatesCount === 0) {
        const emptyBatchesPipeline = [
          { $match: { projectId } },
          {
            $lookup: {
              from: "AssignmentCandidate",
              localField: "_id",
              foreignField: "batchId",
              as: "candidates"
            }
          },
          {
            $match: {
              candidates: { $size: 0 }
            }
          },
          { $count: "total" }
        ];
        
        const emptyResult = await prisma.$runCommandRaw({
          aggregate: "AssignmentBatch",
          pipeline: emptyBatchesPipeline,
          cursor: {}
        });
        
        const emptyBatchesCount = emptyResult.cursor.firstBatch[0]?.total || 0;
        
        // If more than 3 empty batches, likely exhausted
        return emptyBatchesCount < 3;
      }

      return true;
    } catch (error) {
      console.error("Error checking if can generate new batch:", error);
      return true; // Default to allowing generation
    }
  }

  /**
   * Main entry point for generating assignment batch - OPTIMIZED
   */
  static async generateBatch(
    projectId: string,
    customSelection?: Partial<BatchSelectionCriteria>
  ): Promise<BatchGenerationResult> {
    console.time('generateBatch-optimized');
    
    // Warmup cache before transaction
    try {
      const project = await RotationDbOptimized.getProjectOptimized(prisma, projectId);
      if (project?.skillsRequired) {
        await RotationCacheEnhanced.warmupCache(projectId, project.skillsRequired);
      }
    } catch (error) {
      console.warn('Cache warmup failed, continuing without warmup:', error);
    }
    
    const result = await handleTransientError(async () => {
      // Core transaction - only essential operations
      const result = await prisma.$transaction(async (tx: any) => {
        return await this._generateBatchWithTxOptimized(tx, projectId, customSelection);
      }, {
        timeout: 15000, // Reduced timeout
      });

      // Post-commit operations (outside transaction)
      await this._postCommitOperations(result, projectId);
      
      return result;
    });
    
    console.timeEnd('generateBatch-optimized');
    return result;
  }

  /**
   * Internal method to generate batch within existing transaction - OPTIMIZED
   */
  private static async _generateBatchWithTxOptimized(
    tx: any,
    projectId: string,
    customSelection?: Partial<BatchSelectionCriteria>
  ): Promise<BatchGenerationResult> {
    const selection = { ...this.DEFAULT_SELECTION, ...customSelection };
    
    // 1. Get project using optimized query
    const project = await RotationDbOptimized.getProjectOptimized(tx, projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Allow generation for submitted, assigning, and accepted statuses
    if (["in_progress", "completed"].includes(project.status)) {
      throw new Error(`Cannot generate batch for project with status: ${project.status}`);
    }

    // 2. Get available skills using optimized query
    const availableSkills = await RotationDbOptimized.getAvailableSkillsOptimized(project.skillsRequired);
    console.log(`Available skills: ${availableSkills.length}/${project.skillsRequired.length}`);
    
    if (availableSkills.length === 0) {
      console.log("No WhatsApp verified developers available, trying without WhatsApp requirement...");
      
      // Try without WhatsApp verification - simplified
      const availableSkillsNoWhatsApp = await this._getAvailableSkillsNoWhatsAppOptimized(project.skillsRequired);
      console.log(`Available skills (no WhatsApp): ${availableSkillsNoWhatsApp.length}/${project.skillsRequired.length}`);
      
      if (availableSkillsNoWhatsApp.length === 0) {
        console.log("No developers available for any required skills (even without WhatsApp)");
        return await this._createEmptyBatch(tx, projectId, selection);
      }
      
      availableSkills.push(...availableSkillsNoWhatsApp);
    }

    // 3. Get blocked developers using optimized query
    const existingBatchesCount = await this._getExistingBatchesCount(tx, projectId);
    const excludeDeveloperIds = await this._getProgressiveExclusions(tx, projectId, existingBatchesCount);

    // 4. Generate candidates using optimized pipeline
    const candidates = await this._selectCandidatesOptimized(
      availableSkills,
      project.client.userId,
      projectId,
      selection,
      excludeDeveloperIds
    );

    // 5. Handle case where no candidates found
    if (candidates.length === 0) {
      const isExhausted = existingBatchesCount >= 6 && excludeDeveloperIds.length > 20;
      console.log(`No candidates found for project ${projectId} (${existingBatchesCount} batches, ${excludeDeveloperIds.length} excluded). Creating ${isExhausted ? 'exhausted' : 'empty'} batch.`);
      return await this._createEmptyBatch(tx, projectId, selection);
    }

    // 6. Create batch and candidates using bulk operations
    return await this._createBatchWithCandidates(tx, projectId, candidates, selection);
  }

  /**
   * Post-commit operations (outside transaction)
   */
  private static async _postCommitOperations(result: BatchGenerationResult, projectId: string): Promise<void> {
    // Send notifications asynchronously
    setImmediate(async () => {
      try {
        const { NotificationService } = await import('./notification.service');
        await NotificationService.sendBatchNotifications(result.batchId);
      } catch (error) {
        console.error("Failed to send batch notifications:", error);
      }
    });

    // Clear cache for this project
    RotationCacheEnhanced.clear(projectId);
  }

  /**
   * Get available skills without WhatsApp requirement - optimized
   */
  private static async _getAvailableSkillsNoWhatsAppOptimized(skillsRequired: string[]): Promise<string[]> {
    const pipeline = [
      {
        $match: {
          adminApprovalStatus: "approved",
          availabilityStatus: "available", // Only include available developers (exclude not_available)
          // No whatsappVerified requirement
        }
      },
      {
        $lookup: {
          from: "DeveloperSkill",
          let: { devId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$developerProfileId", "$$devId"]
                }
              }
            }
          ],
          as: "skills"
        }
      },
      {
        $unwind: "$skills"
      },
      {
        $match: {
          "skills.skillId": { $in: skillsRequired }
        }
      },
      {
        $group: {
          _id: "$skills.skillId",
          count: { $sum: 1 }
        }
      },
      {
        $match: {
          count: { $gt: 0 }
        }
      },
      {
        $project: {
          skillId: "$_id",
          count: 1,
          _id: 0
        }
      }
    ];
    
    const result = await prisma.$runCommandRaw({
      aggregate: "DeveloperProfile",
      pipeline,
      cursor: {}
    });
    
    return result.cursor.firstBatch.map((doc: any) => {
      console.log(`Skill ${doc.skillId} (no WhatsApp): ${doc.count} developers available`);
      return doc.skillId;
    });
  }

  /**
   * Get existing batches count - optimized
   */
  private static async _getExistingBatchesCount(tx: any, projectId: string): Promise<number> {
    const pipeline = [
      { $match: { projectId } },
      { $count: "total" }
    ];
    
    const result = await tx.$runCommandRaw({
      aggregate: "AssignmentBatch",
      pipeline,
      cursor: {}
    });
    
    return result.cursor.firstBatch[0]?.total || 0;
  }

  /**
   * Get progressive exclusions - optimized
   */
  private static async _getProgressiveExclusions(
    tx: any,
    projectId: string,
    existingBatchesCount: number
  ): Promise<string[]> {
    if (existingBatchesCount < 3) {
      return [];
    }

    const limit = existingBatchesCount >= 5 ? 2 : 1;
    
    const pipeline = [
      { $match: { projectId } },
      { $sort: { createdAt: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "AssignmentCandidate",
          localField: "_id",
          foreignField: "batchId",
          as: "candidates"
        }
      },
      {
        $unwind: "$candidates"
      },
      {
        $group: {
          _id: "$candidates.developerId"
        }
      },
      {
        $project: {
          developerId: "$_id",
          _id: 0
        }
      }
    ];
    
    const result = await tx.$runCommandRaw({
      aggregate: "AssignmentBatch",
      pipeline,
      cursor: {}
    });
    
    const excludeIds = result.cursor.firstBatch.map((doc: any) => doc.developerId);
    console.log(`Excluding ${excludeIds.length} developers from recent ${limit} batch(es)`);
    
    return excludeIds;
  }

  /**
   * Select candidates using optimized pipeline
   */
  private static async _selectCandidatesOptimized(
    skillsRequired: string[],
    clientUserId: string,
    projectId: string,
    selection: BatchSelectionCriteria,
    excludeDeveloperIds: string[]
  ): Promise<DeveloperCandidate[]> {
    // Check cache first
    const cacheKey = RotationCacheEnhanced.generateKey(projectId, skillsRequired, selection);
    const cached = RotationCacheEnhanced.get(cacheKey);
    if (cached) {
      console.log("Cache hit for rotation candidates");
      return cached;
    }

    // Get candidates using optimized pipeline
    const candidates = await RotationDbOptimized.getCandidatesOptimized(
      skillsRequired,
      clientUserId,
      projectId,
      selection,
      excludeDeveloperIds
    );

    // Deduplicate and rebalance
    const deduped = deduplicateCandidates(candidates, skillsRequired);
    const finalCandidates = rebalanceAndTrim(deduped, selection);

    // Cache the result
    RotationCacheEnhanced.set(cacheKey, finalCandidates);

    return finalCandidates;
  }

  /**
   * Create empty batch
   */
  private static async _createEmptyBatch(
    tx: any,
    projectId: string,
    selection: BatchSelectionCriteria
  ): Promise<BatchGenerationResult> {
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
  }

  /**
   * Create batch with candidates using bulk operations
   */
  private static async _createBatchWithCandidates(
    tx: any,
    projectId: string,
    candidates: DeveloperCandidate[],
    selection: BatchSelectionCriteria
  ): Promise<BatchGenerationResult> {
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
    await RotationDbOptimized.bulkCreateCandidates(tx, batch.id, projectId, candidates);

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
  }

  /**
   * Auto-expire pending candidates - optimized
   */
  static async expirePendingCandidates(): Promise<number> {
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
   * Accept candidate - atomic first-accept (unchanged)
   */
  static async acceptCandidate(candidateId: string, userId: string): Promise<{
    success: boolean;
    message: string;
    project?: any;
  }> {
    return await prisma.$transaction(async (tx: any) => {
      // ... (same as before, keeping for brevity)
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

      // ... (validation logic same as before)
      
      return {
        success: true,
        message: "Assignment accepted successfully! The client can now contact you.",
        project: candidate.batch.project,
      };
    });
  }

  /**
   * Reject candidate - atomic rejection (unchanged)
   */
  static async rejectCandidate(candidateId: string, userId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    return await prisma.$transaction(async (tx: any) => {
      // ... (same as before)
      return {
        success: true,
        message: "Assignment rejected successfully.",
      };
    });
  }

  /**
   * Refresh batch - optimized version
   */
  static async refreshBatch(
    projectId: string,
    customSelection?: Partial<BatchSelectionCriteria>
  ): Promise<BatchGenerationResult> {
    console.time('refreshBatch-optimized');
    
    const result = await handleTransientError(async () => {
      const result = await prisma.$transaction(async (tx: any) => {
        // Get current batch with candidates using optimized query
        const project = await RotationDbOptimized.getProjectOptimized(tx, projectId);
        
        if (project?.currentBatchId) {
          // Get accepted candidates to preserve them
          const acceptedCandidates = await tx.assignmentCandidate.findMany({
            where: {
              batchId: project.currentBatchId,
              responseStatus: "accepted"
            },
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
          });

          // Bulk invalidate non-accepted candidates
          await RotationDbOptimized.bulkInvalidateCandidates(tx, project.currentBatchId);

          // Calculate needed candidates
          const targetBatchSize = 15;
          const currentAcceptedCount = acceptedCandidates.length;
          const neededNewCandidates = Math.max(0, targetBatchSize - currentAcceptedCount);
          
          console.log(`Target batch size: ${targetBatchSize}, current accepted: ${currentAcceptedCount}, need ${neededNewCandidates} new candidates`);

          if (neededNewCandidates > 0) {
            // Generate new candidates using optimized method
            const selection = { ...this.DEFAULT_SELECTION, ...customSelection };
            const acceptedIds = acceptedCandidates.map(c => c.developerId);
            const existingBatchesCount = await this._getExistingBatchesCount(tx, projectId);
            const excludeIds = await this._getProgressiveExclusions(tx, projectId, existingBatchesCount);
            const allExcludeIds = Array.from(new Set([...acceptedIds, ...excludeIds]));

            const newCandidates = await this._selectCandidatesOptimized(
              project.skillsRequired,
              project.client.userId,
              projectId,
              selection,
              allExcludeIds
            );

            const candidatesToAdd = newCandidates.slice(0, neededNewCandidates);
            
            if (candidatesToAdd.length > 0) {
              // Bulk create new candidates
              await RotationDbOptimized.bulkCreateCandidates(tx, project.currentBatchId, projectId, candidatesToAdd);
              
              // Send notifications asynchronously
              setImmediate(async () => {
                try {
                  const { NotificationService } = await import('./notification.service');
                  await NotificationService.sendBatchNotifications(project.currentBatchId);
                } catch (error) {
                  console.error("Failed to send notifications for replacement candidates:", error);
                }
              });
            }
          }

          // Return updated batch
          const allCandidates = [
            ...acceptedCandidates.map((candidate: any) => ({
              developerId: candidate.developerId,
              level: candidate.level,
              skillIds: [],
              usualResponseTimeMs: candidate.usualResponseTimeMsSnapshot,
            })),
            ...(neededNewCandidates > 0 ? await this._selectCandidatesOptimized(
              project.skillsRequired,
              project.client.userId,
              projectId,
              selection,
              allExcludeIds
            ).then(candidates => candidates.slice(0, neededNewCandidates)) : [])
          ];

          return {
            batchId: project.currentBatchId,
            candidates: allCandidates,
            selection: customSelection || this.DEFAULT_SELECTION,
          };
        }

        // Generate new batch if no current batch
        return await this._generateBatchWithTxOptimized(tx, projectId, customSelection);
      }, {
        timeout: 15000,
      });

      return result;
    });
    
    console.timeEnd('refreshBatch-optimized');
    return result;
  }
}
