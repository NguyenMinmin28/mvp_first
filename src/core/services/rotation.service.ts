// @ts-nocheck
import { prisma } from "@/core/database/db";
import type { Prisma } from "@prisma/client";
import { NotificationService } from "./notification.service";
type DevLevel = Prisma.$Enums.DevLevel;

export interface BatchSelectionCriteria {
  fresherCount: number;
  midCount: number;
  expertCount: number;
}

export interface DeveloperCandidate {
  developerId: string;
  level: DevLevel;
  skillIds: string[];
  usualResponseTimeMs: number;
}

export interface BatchGenerationResult {
  batchId: string;
  candidates: DeveloperCandidate[];
  selection: BatchSelectionCriteria;
}

export class RotationService {
  private static readonly DEFAULT_SELECTION: BatchSelectionCriteria = {
    fresherCount: 5,
    midCount: 5,
    expertCount: 3
  };

  private static readonly ACCEPTANCE_DEADLINE_MINUTES = 15;
  // Allow developers to appear in multiple active batches concurrently up to this limit
  private static readonly MAX_PENDING_ACTIVE_INVITES_PER_DEV = 3;
  
  /**
   * Get dynamic pending limit based on batch count - more lenient as project progresses
   */
  private static getDynamicPendingLimit(existingBatchesCount: number): number {
    return Math.max(5 - existingBatchesCount, 1);
  }

  /**
   * Adaptive quota system - adjust level quotas when pool is limited
   */
  private static adaptiveQuota(
    target: BatchSelectionCriteria, 
    found: Record<DevLevel, number>
  ): BatchSelectionCriteria {
    const totalNeed = target.fresherCount + target.midCount + target.expertCount;
    const totalFound = found.FRESHER + found.MID + found.EXPERT;

    if (totalFound < totalNeed) {
      console.log(`Adaptive quota: Found ${totalFound} candidates, need ${totalNeed}. Adjusting quotas...`);
      
      // Allow filling expert slots with mid-level developers
      if (found.EXPERT < target.expertCount && found.MID > 0) {
        const expertShortfall = target.expertCount - found.EXPERT;
        const midAvailable = found.MID;
        const canPromote = Math.min(expertShortfall, midAvailable);
        
        if (canPromote > 0) {
          console.log(`Promoting ${canPromote} MID developers to EXPERT slots`);
          found.EXPERT += canPromote;
          found.MID -= canPromote;
        }
      }
      
      // Allow filling mid slots with fresher developers
      if (found.MID < target.midCount && found.FRESHER > 0) {
        const midShortfall = target.midCount - found.MID;
        const fresherAvailable = found.FRESHER;
        const canPromote = Math.min(midShortfall, fresherAvailable);
        
        if (canPromote > 0) {
          console.log(`Promoting ${canPromote} FRESHER developers to MID slots`);
          found.MID += canPromote;
          found.FRESHER -= canPromote;
        }
      }
    }

    return {
      fresherCount: Math.min(target.fresherCount, found.FRESHER),
      midCount: Math.min(target.midCount, found.MID),
      expertCount: Math.min(target.expertCount, found.EXPERT)
    };
  }
  
  // Simple in-memory cache for rotation results (5 second TTL)
  private static rotationCache = new Map<string, { result: DeveloperCandidate[], timestamp: number }>();
  private static readonly CACHE_TTL_MS = 5000;
  
  /**
   * Clear rotation cache for a specific project or all cache
   */
  private static clearRotationCache(projectId?: string) {
    if (projectId) {
      // Clear cache entries for specific project
      for (const [key] of this.rotationCache) {
        if (key.startsWith(`${projectId}-`)) {
          this.rotationCache.delete(key);
        }
      }
    } else {
      // Clear all cache
      this.rotationCache.clear();
    }
  }

  /**
   * Get skills that have available developers
   */
  private static async getAvailableSkills(
    tx: any,
    skillsRequired: string[]
  ): Promise<string[]> {
    const availableSkills: string[] = [];
    
    for (const skillId of skillsRequired) {
      const count = await tx.developerProfile.count({
        where: {
          adminApprovalStatus: "approved",
          currentStatus: { in: ["available", "checking", "busy", "away"] },
          whatsappVerified: true,
          skills: {
            some: { skillId }
          }
        }
      });
      
      if (count > 0) {
        availableSkills.push(skillId);
        console.log(`Skill ${skillId}: ${count} developers available`);
      } else {
        console.log(`Skill ${skillId}: 0 developers available`);
      }
    }
    
    return availableSkills;
  }

  /**
   * Get skills that have available developers (without WhatsApp requirement)
   */
  private static async getAvailableSkillsNoWhatsApp(
    tx: any,
    skillsRequired: string[]
  ): Promise<string[]> {
    const availableSkills: string[] = [];
    
    for (const skillId of skillsRequired) {
      const count = await tx.developerProfile.count({
        where: {
          adminApprovalStatus: "approved",
          currentStatus: { in: ["available", "checking", "busy", "away"] },
          // No whatsappVerified requirement
          skills: {
            some: { skillId }
          }
        }
      });
      
      if (count > 0) {
        availableSkills.push(skillId);
        console.log(`Skill ${skillId} (no WhatsApp): ${count} developers available`);
      } else {
        console.log(`Skill ${skillId} (no WhatsApp): 0 developers available`);
      }
    }
    
    return availableSkills;
  }

  /**
   * Get developers currently blocked (pending/accepted in this project)
   */
  private static async getCurrentlyBlockedDevelopers(
    tx: any,
    projectId: string,
    clientUserId: string,
    existingBatchesCount: number = 0
  ): Promise<string[]> {
    const dynamicLimit = this.getDynamicPendingLimit(existingBatchesCount);
    
    const [blockedRows, overLimitRows] = await Promise.all([
      // Exclude developers who are currently pending/accepted in this project
      tx.assignmentCandidate.findMany({
        where: { 
          projectId, 
          responseStatus: { in: ["pending", "accepted"] }
        },
        select: { developerId: true },
      }),
      // Use dynamic limit for over-limit check
      tx.assignmentCandidate.groupBy({
        by: ["developerId"],
        where: { 
          responseStatus: "pending", 
          batch: { status: "active" }, 
          source: "AUTO_ROTATION"
        },
        _count: { developerId: true },
        having: { developerId: { _count: { gte: dynamicLimit } } },
      }),
    ]);
    
    const blockedIds = blockedRows.map((r: any) => r.developerId);
    const overLimitIds = overLimitRows.map((r: any) => r.developerId);
    
    console.log(`Blocked developers: ${blockedIds.length} (current), ${overLimitIds.length} (over-limit, limit=${dynamicLimit})`);
    
    return Array.from(new Set([...blockedIds, ...overLimitIds]));
  }

  /**
   * Check if project can generate new batch (hasn't exhausted developer pool)
   */
  static async canGenerateNewBatch(projectId: string): Promise<boolean> {
    try {
      // Count existing batches
      const existingBatchesCount = await prisma.assignmentBatch.count({
        where: { projectId }
      });

      // If more than 8 batches, likely exhausted
      if (existingBatchesCount >= 8) {
        return false;
      }

      // Check if last batch was empty (no candidates found)
      const lastBatch = await prisma.assignmentBatch.findFirst({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
        include: {
          candidates: true
        }
      });

      // If last batch was empty, check if we've tried too many times
      if (lastBatch && lastBatch.candidates.length === 0) {
        const emptyBatchesCount = await prisma.assignmentBatch.count({
          where: { 
            projectId,
            candidates: {
              none: {}
            }
          }
        });
        
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
   * Main entry point for generating assignment batch
   */
  static async generateBatch(
    projectId: string,
    customSelection?: Partial<BatchSelectionCriteria>
  ): Promise<BatchGenerationResult> {
    let attempt = 0;
    while (true) {
      try {
        const result = await prisma.$transaction(async (tx: any) => {
          return await this._generateBatchWithTx(tx, projectId, customSelection);
        }, {
          timeout: 30000, // 30 seconds timeout
        });
        // Post-commit cursor updates to avoid transaction aborts
        try {
          const skillsRequired = Array.from(
            new Set(result.candidates.flatMap((c: any) => c.skillIds))
          );
          if (skillsRequired.length > 0) {
            await this.updateRotationCursors(prisma as any, skillsRequired, result.candidates);
          }
        } catch (_) {
          // Non-critical; ignore cursor update failures
        }

        // Send WhatsApp notifications for new batch
        try {
          await NotificationService.sendBatchNotifications(result.batchId);
        } catch (error) {
          console.error("Failed to send batch notifications:", error);
          // Non-critical; don't fail the batch creation
        }

        // Clear cache for this project since we created a new batch
        this.clearRotationCache(projectId);

        return result;
      } catch (err: any) {
        const message: string = err?.message || '';
        const isTransient = /deadlock|write conflict|Transaction API error: Transaction .* has been aborted/i.test(message);
        if (!isTransient || attempt >= 2) {
          throw err;
        }
        attempt += 1;
      }
    }
  }

  /**
   * Internal method to generate batch within existing transaction
   */
  private static async _generateBatchWithTx(
    tx: any,
    projectId: string,
    customSelection?: Partial<BatchSelectionCriteria>
  ): Promise<BatchGenerationResult> {
    const selection = { ...this.DEFAULT_SELECTION, ...customSelection };
      // 1. Get project and validate
      const project = await tx.project.findUnique({
        where: { id: projectId },
        include: {
          client: { include: { user: true } },
        },
      });

      if (!project) {
        throw new Error("Project not found");
      }

      // Allow generation for submitted, assigning, and accepted statuses
      // Only block for in_progress and completed
      if (["in_progress", "completed"].includes(project.status)) {
        throw new Error(`Cannot generate batch for project with status: ${project.status}`);
      }

      // Count existing batches to determine exclusion strategy
      const existingBatchesCount = await tx.assignmentBatch.count({
        where: { projectId }
      });

      // Progressive exclusion strategy - less aggressive
      let excludeDeveloperIds: string[] = [];
      
      if (existingBatchesCount >= 5) {
        // Only after 5+ batches, exclude developers who were assigned in the last 2 batches
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
          excludeDeveloperIds = recentlyAssigned.map(ac => ac.developerId);
          console.log(`Excluding ${excludeDeveloperIds.length} developers from recent batches`);
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
          excludeDeveloperIds = lastBatchAssigned.map(ac => ac.developerId);
          console.log(`Excluding ${excludeDeveloperIds.length} developers from last batch`);
        }
      }

      // 2. Check available skills first
      const availableSkills = await this.getAvailableSkills(tx, project.skillsRequired);
      console.log(`Available skills: ${availableSkills.length}/${project.skillsRequired.length}`);
      
      if (availableSkills.length === 0) {
        console.log("No WhatsApp verified developers available, trying without WhatsApp requirement...");
        
        // Try without WhatsApp verification
        const availableSkillsNoWhatsApp = await this.getAvailableSkillsNoWhatsApp(tx, project.skillsRequired);
        console.log(`Available skills (no WhatsApp): ${availableSkillsNoWhatsApp.length}/${project.skillsRequired.length}`);
        
        if (availableSkillsNoWhatsApp.length === 0) {
          console.log("No developers available for any required skills (even without WhatsApp)");
          // Create an empty, completed batch
          const emptyBatch = await tx.assignmentBatch.create({
            data: {
              projectId,
              batchNumber: await this.getNextBatchNumber(tx, projectId),
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
        
        // Use skills without WhatsApp requirement
        availableSkills.push(...availableSkillsNoWhatsApp);
      }

      // 3. Generate candidates using rotation algorithm with available skills
      const candidates = await this.selectCandidates(
        tx,
        availableSkills, // Use only available skills
        project.client.userId,
        projectId,
        selection,
        excludeDeveloperIds,
        existingBatchesCount
      );

      // Handle case where no candidates found: create an empty batch to stop infinite searching on UI
      if (candidates.length === 0) {
        // Only mark as exhausted if we've tried many times with many exclusions
        const isExhausted = existingBatchesCount >= 6 && excludeDeveloperIds.length > 20;
        
        console.log(`No candidates found for project ${projectId} (${existingBatchesCount} batches, ${excludeDeveloperIds.length} excluded). Creating ${isExhausted ? 'exhausted' : 'empty'} batch.`);
        
        // Create an empty, completed batch and mark it as current for the project
        const emptyBatch = await tx.assignmentBatch.create({
          data: {
            projectId,
            batchNumber: await this.getNextBatchNumber(tx, projectId),
            status: "completed",
            selection: selection as any,
            createdAt: new Date(),
          },
        });

        await tx.project.update({
          where: { id: projectId },
          data: { 
            currentBatchId: emptyBatch.id,
            // Keep project status as submitted so client can manually assign
            status: "submitted"
          },
        });

        return {
          batchId: emptyBatch.id,
          candidates: [],
          selection,
        };
      }

      // 3. Create AssignmentBatch
      const batch = await tx.assignmentBatch.create({
        data: {
          projectId,
          batchNumber: await this.getNextBatchNumber(tx, projectId),
          status: "active",
          selection: selection as any, // JSON field
          createdAt: new Date(),
        },
      });

      // 4. Create AssignmentCandidates
      const acceptanceDeadline = new Date(
        Date.now() + this.ACCEPTANCE_DEADLINE_MINUTES * 60 * 1000
      );

      await tx.assignmentCandidate.createMany({
        data: candidates.map((candidate: any) => ({
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
          source: "AUTO_ROTATION", // 👈 thêm
        })),
      });

      // 5. Update project currentBatchId and status
      // Only update status to "assigning" if project is still in "submitted" status
      // Don't change status if project already has accepted candidates
      const updateData: any = { 
        currentBatchId: batch.id,
      };
      
      if (project.status === "submitted") {
        updateData.status = "assigning";
      }
      
      await tx.project.update({
        where: { id: projectId },
        data: updateData,
      });

      // 6. Cursor updates are performed post-commit in generateBatch

      return {
        batchId: batch.id,
        candidates,
        selection,
      };
  }

  /**
   * Core algorithm: Select candidates by skill and level with fair rotation
   */
  private static async selectCandidates(
    tx: any,
    skillsRequired: string[],
    clientUserId: string,
    projectId: string,
    selection: BatchSelectionCriteria,
    excludeDeveloperIds: string[] = [],
    existingBatchesCount: number = 0
  ): Promise<DeveloperCandidate[]> {
    console.time("selectCandidates");
    
    // Check cache first
    const cacheKey = `${projectId}-${skillsRequired.sort().join(',')}-${JSON.stringify(selection)}`;
    const cached = this.rotationCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL_MS) {
      console.log("Cache hit for rotation candidates");
      console.timeEnd("selectCandidates");
      return cached.result;
    }
    
    // Use legacy method directly since aggregation pipeline has issues
    console.log("Using legacy method with skills:", skillsRequired, "excludeIds:", excludeDeveloperIds.length);
    const allCandidates: DeveloperCandidate[] = [];
    const levels: Array<{ level: DevLevel; count: number }> = [
      { level: "EXPERT", count: selection.expertCount },
      { level: "MID", count: selection.midCount },
      { level: "FRESHER", count: selection.fresherCount },
    ];

    // B1) Get pool by (skill, level)
    for (const skill of skillsRequired) {
      for (const { level, count } of levels) {
        console.log(`Getting candidates for skill: ${skill}, level: ${level}, count: ${count}`);
        const candidates = await this.getCandidatesForSkillLevel(
          tx,
          skill,
          level,
          clientUserId,
          projectId,
          count,
          excludeDeveloperIds
        );
        console.log(`Found ${candidates.length} candidates for ${skill}-${level}`);
        allCandidates.push(...candidates);
      }
    }

    console.log(`Total candidates from legacy method: ${allCandidates.length}`);

    // B2) Deduplicate candidates
    const deduped = this.deduplicateCandidates(allCandidates, skillsRequired);
    console.log(`After deduplication: ${deduped.length} candidates`);
    
    // B3) Rebalance and trim to exact quotas with fallback
    const finalCandidates = this.rebalanceAndTrim(deduped, selection);
    console.log(`Final legacy candidates: ${finalCandidates.length}`);
    return finalCandidates;

    /* Aggregation pipeline disabled due to type mismatch issues
    try {
      // Single optimized aggregation pipeline to replace all nested queries
      const aggregationPipeline = [
        // Stage 1: Match base eligible developers (relaxed WhatsApp requirement)
        {
          $match: {
            adminApprovalStatus: "approved",
            currentStatus: { $in: ["available", "checking", "busy", "away"] },
            userId: { $ne: clientUserId },
            whatsappVerified: { $in: [true, false] }, // Relaxed WhatsApp requirement
            ...(excludeDeveloperIds.length > 0 && { _id: { $nin: excludeDeveloperIds } })
          }
        },
        
        // Stage 2: Join with skills to filter by required skills
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
        
        // Stage 3: Filter developers who have at least one required skill (relaxed)
        {
          $match: {
            "skills.skillId": { $in: skillsRequired }
          }
        },
        
        // Stage 4: Join with assignment candidates to exclude currently pending/accepted in this project
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
        
        // Stage 5: Exclude developers currently in this project
        {
          $match: {
            inProject: { $size: 0 }
          }
        },
        
        // Stage 6: Check pending count to avoid over-limit developers (with dynamic limit)
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
                      { $eq: ["$responseStatus", "pending"] },
                      { $eq: ["$source", "AUTO_ROTATION"] }
                    ]
                  }
                }
              },
              {
                $lookup: {
                  from: "AssignmentBatch",
                  localField: "batchId",
                  foreignField: "_id",
                  as: "batch"
                }
              },
              {
                $match: {
                  "batch.status": "active"
                }
              },
              {
                $group: {
                  _id: "$developerId",
                  count: { $sum: 1 }
                }
              },
              {
                $match: {
                  count: { $gte: this.getDynamicPendingLimit(existingBatchesCount) }
                }
              }
            ],
            as: "pendingCounts"
          }
        },
        
        // Stage 7: Exclude over-limit developers
        {
          $match: {
            pendingCounts: { $size: 0 }
          }
        },
        
        // Stage 8: Calculate response time from recent assignments
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
              { $limit: 5 }
            ],
            as: "recentResponses"
          }
        },
        
        // Stage 9: Calculate average response time
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
        
        // Stage 10: Unwind skills to get one row per developer-skill combination
        {
          $unwind: "$skills"
        },
        
        // Stage 11: Filter to only required skills
        {
          $match: {
            "skills.skillId": { $in: skillsRequired }
          }
        },
        
        // Stage 12: Project final fields
        {
          $project: {
            developerId: "$_id",
            level: 1,
            skillId: "$skills.skillId",
            avgResponseTimeMs: 1,
            _id: 0
          }
        },
        
        // Stage 13: Sort for consistent ordering
        {
          $sort: {
            level: 1,
            avgResponseTimeMs: 1,
            developerId: 1
          }
        },
        
        // Stage 14: Limit to reasonable number
        {
          $limit: 200
        }
      ];

      console.log("Starting aggregation with pipeline:", JSON.stringify(aggregationPipeline, null, 2));
      console.log("Skills required:", skillsRequired);
      console.log("Exclude developer IDs:", excludeDeveloperIds.length);
      
      console.time("aggregation");
      const result = await (prisma as any).$runCommandRaw({
        aggregate: "DeveloperProfile",
        pipeline: aggregationPipeline,
        cursor: { batchSize: 100 },
        allowDiskUse: true,
        maxTimeMS: 3000
      });
      console.timeEnd("aggregation");
      console.log("Aggregation result:", JSON.stringify(result, null, 2));

      let candidates = result.cursor.firstBatch || [];
      console.log(`After aggregation: ${candidates.length} candidates found`);
      
      // No need for WhatsApp fallback since we already relaxed the requirement

      // If still no candidates after fallback, try with fewer exclusions
      if (candidates.length === 0 && excludeDeveloperIds.length > 0) {
        console.log(`No candidates found after excluding ${excludeDeveloperIds.length} developers. Trying with reduced exclusions...`);
        
        // Try again with only excluding developers currently pending/accepted in this project
        const reducedExcludeIds = await this.getCurrentlyBlockedDevelopers(tx, projectId, clientUserId, existingBatchesCount);
        console.log(`Retrying with reduced exclusions: ${reducedExcludeIds.length} developers`);
        
        const reducedPipeline = JSON.parse(JSON.stringify(aggregationPipeline));
        if (reducedExcludeIds.length > 0) {
          reducedPipeline[0].$match._id = { $nin: reducedExcludeIds };
        } else {
          delete reducedPipeline[0].$match._id;
        }
        
        console.log("Trying reduced exclusions pipeline:", JSON.stringify(reducedPipeline, null, 2));
        const reducedResult = await (prisma as any).$runCommandRaw({
          aggregate: "DeveloperProfile",
          pipeline: reducedPipeline,
          cursor: { batchSize: 100 },
          allowDiskUse: true,
          maxTimeMS: 3000
        });
        console.log("Reduced exclusions result:", JSON.stringify(reducedResult, null, 2));
        
        candidates = reducedResult.cursor.firstBatch || [];
        console.log(`Found ${candidates.length} candidates with reduced exclusions`);
      }

      console.log(`Found ${candidates.length} candidates from aggregation`);

      // Transform to DeveloperCandidate format
      const transformedCandidates: DeveloperCandidate[] = candidates.map((doc: any) => ({
        developerId: String(doc.developerId),
        level: doc.level,
        skillIds: [String(doc.skillId)],
        usualResponseTimeMs: Math.round(doc.avgResponseTimeMs || 60000)
      }));

      // Deduplicate and rebalance
      const deduped = this.deduplicateCandidates(transformedCandidates, skillsRequired);
      const finalCandidates = this.rebalanceAndTrim(deduped, selection);
      
      // Cache the result
      this.rotationCache.set(cacheKey, {
        result: finalCandidates,
        timestamp: Date.now()
      });
      
      console.timeEnd("selectCandidates");
      console.log(`Final candidates: ${finalCandidates.length}`);
      
      return finalCandidates;
      
    } catch (error) {
      console.error("Aggregation failed, falling back to legacy method:", error);
      console.timeEnd("selectCandidates");
      
      // Fallback to original method
      console.log("Using legacy method with skills:", skillsRequired, "excludeIds:", excludeDeveloperIds.length);
      const allCandidates: DeveloperCandidate[] = [];
      const levels: Array<{ level: DevLevel; count: number }> = [
        { level: "EXPERT", count: selection.expertCount },
        { level: "MID", count: selection.midCount },
        { level: "FRESHER", count: selection.fresherCount },
      ];

      // B1) Get pool by (skill, level)
      for (const skill of skillsRequired) {
        for (const { level, count } of levels) {
          console.log(`Getting candidates for skill: ${skill}, level: ${level}, count: ${count}`);
          const candidates = await this.getCandidatesForSkillLevel(
            tx,
            skill,
            level,
            clientUserId,
            projectId,
            count,
            excludeDeveloperIds
          );
          console.log(`Found ${candidates.length} candidates for ${skill}-${level}`);
          allCandidates.push(...candidates);
        }
      }

      console.log(`Total candidates from legacy method: ${allCandidates.length}`);

      // B2) Deduplicate candidates
      const deduped = this.deduplicateCandidates(allCandidates, skillsRequired);
      console.log(`After deduplication: ${deduped.length} candidates`);
      
      // B3) Rebalance and trim to exact quotas with fallback
      const finalCandidates = this.rebalanceAndTrim(deduped, selection);
      console.log(`Final legacy candidates: ${finalCandidates.length}`);
      return finalCandidates;
    }
    */
  }

  /**
   * Get eligible candidates for specific skill and level
   */
  private static async getCandidatesForSkillLevel(
    tx: any,
    skillId: string,
    level: DevLevel,
    clientUserId: string,
    projectId: string,
    maxCount: number,
    additionalExcludeIds: string[] = [],
    precomputedOverLimitIds?: string[]
  ): Promise<DeveloperCandidate[]> {
    console.log(`getCandidatesForSkillLevel: skill=${skillId}, level=${level}, maxCount=${maxCount}, excludeIds=${additionalExcludeIds.length}`);
    
    // First try to get rotation cursor
    const cursor = await this.getRotationCursor(tx, skillId, level);
    console.log(`Rotation cursor for ${skillId}-${level}:`, cursor);

    // Use precomputed over-limit list to avoid N+1 groupBy calls
    let overLimitDeveloperIds: string[] = Array.isArray(precomputedOverLimitIds)
      ? precomputedOverLimitIds
      : [];
    if (overLimitDeveloperIds.length === 0 && !precomputedOverLimitIds) {
      const pendingCounts = await tx.assignmentCandidate.groupBy({
        by: ['developerId'],
        where: {
          responseStatus: "pending",
          batch: { status: "active" },
          source: "AUTO_ROTATION",
        },
        _count: { developerId: true },
        having: {
          developerId: { _count: { gte: RotationService.MAX_PENDING_ACTIVE_INVITES_PER_DEV } },
        },
      });
      overLimitDeveloperIds = pendingCounts.map((p: any) => p.developerId as string);
    }
    const allExcludeIds = [...overLimitDeveloperIds, ...additionalExcludeIds];
    console.log(`All exclude IDs for ${skillId}-${level}: ${allExcludeIds.length} (overLimit: ${overLimitDeveloperIds.length}, additional: ${additionalExcludeIds.length})`);

    // Build base query for eligible developers - optimized for performance
    console.log(`Querying eligible developers for ${skillId}-${level}...`);
    let eligibleDevs = await tx.developerProfile.findMany({
      where: {
        adminApprovalStatus: "approved",
        currentStatus: { in: ["available", "checking", "busy", "away"] },
        level,
        userId: { not: clientUserId },
        whatsappVerified: true, // Chỉ lấy những developer đã verify WhatsApp
        skills: {
          some: { skillId },
        },
        // Avoid developers who already reached the concurrent pending limit or are in additional exclude list
        id: { notIn: allExcludeIds },
        // Don't re-invite developers who are currently pending or accepted for this project
        // Allow re-inviting developers who have rejected, expired, or invalidated
        NOT: {
          assignmentCandidates: {
            some: {
              projectId: projectId,
              responseStatus: { in: ["pending", "accepted"] },
            },
          },
        },
      },
      select: {
        id: true,
        level: true,
        skills: { 
          where: { skillId },
          select: { skillId: true }
        },
        assignmentCandidates: {
          where: { responseStatus: { in: ["accepted", "rejected"] } },
          select: { respondedAt: true },
          orderBy: { respondedAt: "desc" },
          take: 5, // For calculating response time
        },
      },
      orderBy: [{ id: "asc" }], // Stable ordering for rotation
      take: Math.min(maxCount * 2, 50), // Limit to reasonable number for performance
    });
    console.log(`Found ${eligibleDevs.length} eligible developers for ${skillId}-${level} (WhatsApp verified)`);

    // Fallback: if no WhatsApp-verified candidates found, relax whatsappVerified constraint
    if (eligibleDevs.length === 0) {
      console.log(`No WhatsApp verified candidates for ${skillId}-${level}, trying fallback...`);
      eligibleDevs = await tx.developerProfile.findMany({
        where: {
          adminApprovalStatus: "approved",
          currentStatus: { in: ["available", "checking", "busy", "away"] },
          level,
          userId: { not: clientUserId },
          // whatsappVerified removed in fallback
          skills: {
            some: { skillId },
          },
          id: { notIn: allExcludeIds },
          NOT: {
            assignmentCandidates: {
              some: {
                projectId: projectId,
                responseStatus: { in: ["pending", "accepted"] },
              },
            },
          },
        },
        select: {
          id: true,
          level: true,
          skills: { 
            where: { skillId },
            select: { skillId: true }
          },
          assignmentCandidates: {
            where: { responseStatus: { in: ["accepted", "rejected"] } },
            select: { respondedAt: true },
            orderBy: { respondedAt: "desc" },
            take: 5,
          },
        },
        orderBy: [{ id: "asc" }],
        take: Math.min(maxCount * 2, 50),
      });
      console.log(`Found ${eligibleDevs.length} eligible developers for ${skillId}-${level} (fallback, no WhatsApp requirement)`);
    }

    // Apply fair ordering
    const orderedDevs = await this.applyFairOrdering(eligibleDevs, cursor);
    console.log(`After fair ordering: ${orderedDevs.length} developers for ${skillId}-${level}`);

    const result = orderedDevs.slice(0, maxCount).map((dev: any) => ({
      developerId: dev.id,
      level: dev.level,
      skillIds: [skillId],
      usualResponseTimeMs: this.calculateResponseTime(dev.assignmentCandidates),
    }));
    
    console.log(`Final result for ${skillId}-${level}: ${result.length} candidates`);
    return result;
  }

  /**
   * Apply fair ordering based on rotation cursor or fallback strategy
   */
  private static async applyFairOrdering(devs: any[], cursor: any): Promise<any[]> {
    // Support both old format (lastDeveloperId) and new format (lastDeveloperIds)
    const lastDeveloperIds = cursor?.lastDeveloperIds || (cursor?.lastDeveloperId ? [cursor.lastDeveloperId] : []);
    
    if (lastDeveloperIds.length > 0) {
      // Find position of last batch of developers and rotate from there
      const lastIndex = devs.findIndex((dev: any) => lastDeveloperIds.includes(dev.id));
      if (lastIndex >= 0) {
        return [...devs.slice(lastIndex + 1), ...devs.slice(0, lastIndex + 1)];
      }
    }

    // Fallback: sort by fairness metrics
    return devs.sort((a: any, b: any) => {
      const aLastResponse = a.assignmentCandidates[0]?.respondedAt || new Date(0);
      const bLastResponse = b.assignmentCandidates[0]?.respondedAt || new Date(0);
      
      // Prioritize who responded longest ago
      if (aLastResponse.getTime() !== bLastResponse.getTime()) {
        return aLastResponse.getTime() - bLastResponse.getTime();
      }

      // Secondary: fewer total acceptances
      const aAccepted = a.assignmentCandidates.filter((c: any) => c.responseStatus === "accepted").length;
      const bAccepted = b.assignmentCandidates.filter((c: any) => c.responseStatus === "accepted").length;
      
      return aAccepted - bAccepted;
    });
  }

  /**
   * Remove duplicate developers, only if same developer + same level + same skill combination
   */
  private static deduplicateCandidates(
    candidates: DeveloperCandidate[],
    skillsRequired: string[]
  ): DeveloperCandidate[] {
    // Only remove duplicates if same developer + same level + same skill combination
    const seen = new Set<string>();
    return candidates.filter(candidate => {
      const key = `${candidate.developerId}-${candidate.level}-${candidate.skillIds.sort().join(',')}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Calculate average response time from recent candidates
   */
  private static calculateResponseTime(recentCandidates: any[]): number {
    if (recentCandidates.length === 0) return 60000; // Default 60s instead of 0

    const responseTimes = recentCandidates
      .filter((c: any) => c.respondedAt && c.assignedAt)
      .map((c: any) => c.respondedAt.getTime() - c.assignedAt.getTime());

    if (responseTimes.length === 0) return 60000; // Default 60s

    return Math.round(responseTimes.reduce((sum: any, time: any) => sum + time, 0) / responseTimes.length);
  }

  /**
   * Rebalance and trim candidates to exact quotas with fallback
   */
  private static rebalanceAndTrim(
    candidates: DeveloperCandidate[],
    selection: BatchSelectionCriteria
  ): DeveloperCandidate[] {
    const byLevel = {
      FRESHER: [] as DeveloperCandidate[],
      MID: [] as DeveloperCandidate[],
      EXPERT: [] as DeveloperCandidate[],
    };

    // Group by level
    for (const candidate of candidates) {
      byLevel[candidate.level].push(candidate);
    }

    // Count available candidates by level
    const found = {
      FRESHER: byLevel.FRESHER.length,
      MID: byLevel.MID.length,
      EXPERT: byLevel.EXPERT.length
    };

    // Use adaptive quota to adjust selection based on available candidates
    const adaptiveSelection = this.adaptiveQuota(selection, found);
    
    console.log(`Adaptive selection: FRESHER=${adaptiveSelection.fresherCount}, MID=${adaptiveSelection.midCount}, EXPERT=${adaptiveSelection.expertCount}`);

    // Trim excess from each level using adaptive selection
    byLevel.EXPERT = byLevel.EXPERT.slice(0, adaptiveSelection.expertCount);
    byLevel.MID = byLevel.MID.slice(0, adaptiveSelection.midCount);
    byLevel.FRESHER = byLevel.FRESHER.slice(0, adaptiveSelection.fresherCount);

    // Calculate needs for fallback
    const needExpert = adaptiveSelection.expertCount - byLevel.EXPERT.length;
    const needMid = adaptiveSelection.midCount - byLevel.MID.length;

    // Fallback: Expert <- Mid <- Fresher
    if (needExpert > 0) {
      const fromMid = byLevel.MID.splice(0, Math.min(needExpert, byLevel.MID.length));
      byLevel.EXPERT.push(...fromMid);
      
      const stillNeed = needExpert - fromMid.length;
      if (stillNeed > 0) {
        const fromFresher = byLevel.FRESHER.splice(0, Math.min(stillNeed, byLevel.FRESHER.length));
        byLevel.EXPERT.push(...fromFresher);
      }
    }

    // Fallback: Mid <- Fresher
    const finalNeedMid = (adaptiveSelection.midCount - byLevel.MID.length);
    if (finalNeedMid > 0) {
      const fromFresher = byLevel.FRESHER.splice(0, Math.min(finalNeedMid, byLevel.FRESHER.length));
      byLevel.MID.push(...fromFresher);
    }

    const result = [...byLevel.FRESHER, ...byLevel.MID, ...byLevel.EXPERT];
    console.log(`Final rebalanced candidates: ${result.length} (FRESHER=${byLevel.FRESHER.length}, MID=${byLevel.MID.length}, EXPERT=${byLevel.EXPERT.length})`);
    
    return result;
  }

  /**
   * Get rotation cursor for skill and level
   */
  private static async getRotationCursor(tx: any, skillId: string, level: DevLevel) {
    return await tx.rotationCursor.findUnique({
      where: { skillId_level: { skillId, level } },
    });
  }

  /**
   * Update rotation cursors after batch generation
   */
  private static async updateRotationCursors(
    tx: any,
    skillsRequired: string[],
    candidates: DeveloperCandidate[]
  ): Promise<void> {
    const updates: Array<{ skillId: string; level: DevLevel; lastDeveloperIds: string[] }> = [];

    // Group by skill and level to find last used developers
    for (const skillId of skillsRequired) {
      for (const level of ["EXPERT", "MID", "FRESHER"] as DevLevel[]) {
        const relevantCandidates = candidates.filter(
          (c) => c.level === level && c.skillIds.includes(skillId)
        );
        
        if (relevantCandidates.length > 0) {
          // Use all candidates selected for this (skill, level)
          const lastDeveloperIds = relevantCandidates.map(c => c.developerId);
          updates.push({
            skillId,
            level,
            lastDeveloperIds,
          });
        }
      }
    }

    // Batch update cursors with minimal retry on transient write conflicts
    for (const update of updates) {
      let attempt = 0;
      while (true) {
        try {
          await tx.rotationCursor.upsert({
            where: { skillId_level: { skillId: update.skillId, level: update.level } },
            create: {
              skillId: update.skillId,
              level: update.level,
              lastDeveloperIds: update.lastDeveloperIds,
            },
            update: {
              lastDeveloperIds: update.lastDeveloperIds,
            },
          });
          break;
        } catch (err: any) {
          const message: string = err?.message || '';
          const isTransient = /deadlock|write conflict|Transaction failed due to a write conflict/i.test(message);
          const isTxnAborted = /Transaction API error: Transaction .* has been aborted/i.test(message);
          if (!isTransient || attempt >= 2) {
            // Best-effort fallback outside the current transaction if it was aborted
            if (isTransient || isTxnAborted) {
              try {
                await (prisma as any).rotationCursor.upsert({
                  where: { skillId_level: { skillId: update.skillId, level: update.level } },
                  create: {
                    skillId: update.skillId,
                    level: update.level,
                    lastDeveloperIds: update.lastDeveloperIds,
                  },
                  update: {
                    lastDeveloperIds: update.lastDeveloperIds,
                  },
                });
                break;
              } catch (_) {
                // Ignore fallback failure; not critical to batch success
                break;
              }
            }
            throw err;
          }
          attempt += 1;
        }
      }
    }
  }

  /**
   * Get next batch number for project
   */
  private static async getNextBatchNumber(tx: any, projectId: string): Promise<number> {
    const lastBatch = await tx.assignmentBatch.findFirst({
      where: { projectId },
      orderBy: { batchNumber: "desc" },
      select: { batchNumber: true },
    });

    return (lastBatch?.batchNumber || 0) + 1;
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
            const acceptanceDeadline = new Date(Date.now() + this.ACCEPTANCE_DEADLINE_MINUTES * 60 * 1000);
            
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
      return await this._generateBatchWithTx(tx, projectId, customSelection);
    }, {
      timeout: 30000, // 30 seconds timeout
    });

    // Post-commit cursor updates
    try {
      const skillsRequired = Array.from(new Set(result.candidates.flatMap((c: any) => c.skillIds)));
      if (skillsRequired.length > 0) {
        await this.updateRotationCursors(prisma as any, skillsRequired, result.candidates);
      }
    } catch (_) {
      // Non-critical
    }

    return result;
  }

  /**
   * Find a replacement candidate for a specific level
   */
  private static async findReplacementCandidate(
    tx: any,
    projectId: string,
    level: DevLevel,
    excludeDeveloperIds: string[]
  ): Promise<DeveloperCandidate | null> {
    // Get project to find required skills
    const project = await tx.project.findUnique({
      where: { id: projectId },
      select: { skillsRequired: true, client: { select: { userId: true } } }
    });

    if (!project) return null;

    console.log(`🔍 Finding replacement for level ${level}, excluding ${excludeDeveloperIds.length} developers`);

    // Try to find a replacement for each required skill
    for (const skillId of project.skillsRequired) {
      const candidates = await this.getCandidatesForSkillLevel(
        tx,
        skillId,
        level,
        project.client.userId,
        projectId,
        1, // Only need 1 candidate
        excludeDeveloperIds // 👈 truyền thẳng vào
      );

      console.log(`🔍 Skill ${skillId}, level ${level}: found ${candidates.length} candidates`);

      if (candidates.length > 0) {
        console.log(`✅ Found replacement: ${candidates[0].developerId}`);
        return candidates[0];
      }
    }

    console.log(`❌ No replacement found for level ${level}`);
    return null;
  }
}
