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
          await NotificationService.sendBatchNotifications(result.batch.id);
        } catch (error) {
          console.error("Failed to send batch notifications:", error);
          // Non-critical; don't fail the batch creation
        }

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

      if (!["submitted", "assigning"].includes(project.status)) {
        throw new Error(`Cannot generate batch for project with status: ${project.status}`);
      }

      // 2. Generate candidates using rotation algorithm
      const candidates = await this.selectCandidates(
        tx,
        project.skillsRequired,
        project.client.userId,
        projectId,
        selection
      );

      // Handle case where no candidates found
      if (candidates.length === 0) {
        throw new Error("No eligible candidates found for this project");
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
        })),
      });

      // 5. Update project currentBatchId and status
      await tx.project.update({
        where: { id: projectId },
        data: { 
          currentBatchId: batch.id,
          status: "assigning",
        },
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
    selection: BatchSelectionCriteria
  ): Promise<DeveloperCandidate[]> {
    const allCandidates: DeveloperCandidate[] = [];
    const levels: Array<{ level: DevLevel; count: number }> = [
      { level: "EXPERT", count: selection.expertCount },
      { level: "MID", count: selection.midCount },
      { level: "FRESHER", count: selection.fresherCount },
    ];

    // B1) Get pool by (skill, level)
    for (const skill of skillsRequired) {
      for (const { level, count } of levels) {
        const candidates = await this.getCandidatesForSkillLevel(
          tx,
          skill,
          level,
          clientUserId,
          projectId,
          count
        );
        allCandidates.push(...candidates);
      }
    }

    // B2) Deduplicate candidates
    const deduped = this.deduplicateCandidates(allCandidates, skillsRequired);
    
    // B3) Rebalance and trim to exact quotas with fallback
    return this.rebalanceAndTrim(deduped, selection);
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
    maxCount: number
  ): Promise<DeveloperCandidate[]> {
    // First try to get rotation cursor
    const cursor = await this.getRotationCursor(tx, skillId, level);

    // Precompute developers who are pending in active batches and count per developer
    // Optimize: Use aggregation query instead of fetching all records
    const pendingCounts = await tx.assignmentCandidate.groupBy({
      by: ['developerId'],
      where: {
        responseStatus: "pending",
        batch: { status: "active" },
      },
      _count: {
        developerId: true,
      },
      having: {
        developerId: {
          _count: {
            gte: RotationService.MAX_PENDING_ACTIVE_INVITES_PER_DEV,
          },
        },
      },
    });
    
    const overLimitDeveloperIds = pendingCounts.map(p => p.developerId as string);

    // Build base query for eligible developers - optimized for performance
    const eligibleDevs = await tx.developerProfile.findMany({
      where: {
        adminApprovalStatus: "approved",
        currentStatus: { in: ["available", "checking", "busy", "away"] },
        level,
        userId: { not: clientUserId },
        whatsappVerified: true, // Chỉ lấy những developer đã verify WhatsApp
        skills: {
          some: { skillId },
        },
        // Avoid only developers who already reached the concurrent pending limit
        id: { notIn: overLimitDeveloperIds },
        // Don't re-invite developers who are currently pending/accepted for this project; allow rejected/invalidated to be re-invited on refresh
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

    // Apply fair ordering
    const orderedDevs = await this.applyFairOrdering(eligibleDevs, cursor);

    return orderedDevs.slice(0, maxCount).map((dev: any) => ({
      developerId: dev.id,
      level: dev.level,
      skillIds: [skillId],
      usualResponseTimeMs: this.calculateResponseTime(dev.assignmentCandidates),
    }));
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

    // Trim excess from each level
    byLevel.EXPERT = byLevel.EXPERT.slice(0, selection.expertCount);
    byLevel.MID = byLevel.MID.slice(0, selection.midCount);
    byLevel.FRESHER = byLevel.FRESHER.slice(0, selection.fresherCount);

    // Calculate needs for fallback
    const needExpert = selection.expertCount - byLevel.EXPERT.length;
    const needMid = selection.midCount - byLevel.MID.length;

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
    const finalNeedMid = (selection.midCount - byLevel.MID.length);
    if (finalNeedMid > 0) {
      const fromFresher = byLevel.FRESHER.splice(0, Math.min(finalNeedMid, byLevel.FRESHER.length));
      byLevel.MID.push(...fromFresher);
    }

    return [...byLevel.FRESHER, ...byLevel.MID, ...byLevel.EXPERT];
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
   * Auto-expire pending candidates
   */
  static async expirePendingCandidates(): Promise<number> {
    const result = await prisma.assignmentCandidate.updateMany({
      where: {
        responseStatus: "pending",
        acceptanceDeadline: { lt: new Date() },
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

      if (new Date() > candidate.acceptanceDeadline) {
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
          acceptanceDeadline: { gte: new Date() }, // Double-check deadline
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
   * Refresh batch - invalidate current and generate new one
   */
  static async refreshBatch(
    projectId: string,
    customSelection?: Partial<BatchSelectionCriteria>
  ): Promise<BatchGenerationResult> {
    const result = await prisma.$transaction(async (tx: any) => {
      // Get current batch
      const project = await tx.project.findUnique({
        where: { id: projectId },
        select: { currentBatchId: true },
      });

      if (project?.currentBatchId) {
        // Mark old batch as replaced
        await tx.assignmentBatch.update({
          where: { id: project.currentBatchId },
          data: { status: "replaced" },
        });

        // Invalidate pending candidates
        await tx.assignmentCandidate.updateMany({
          where: {
            batchId: project.currentBatchId,
            responseStatus: "pending",
          },
          data: {
            responseStatus: "invalidated",
            invalidatedAt: new Date(),
          },
        });
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
}
