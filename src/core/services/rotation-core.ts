// @ts-nocheck
import { prisma } from "@/core/database/db";
import type { Prisma } from "@prisma/client";
import { 
  DeveloperCandidate, 
  BatchSelectionCriteria, 
  getDynamicPendingLimit,
  calculateResponseTime,
  deduplicateCandidates,
  applyFairOrdering
} from './rotation-helpers';
import { rebalanceAndTrim } from './rotation-quota';

type DevLevel = Prisma.$Enums.DevLevel;

export class RotationCore {
  private static readonly MAX_PENDING_ACTIVE_INVITES_PER_DEV = 3;

  /**
   * Get skills that have available developers
   */
  static async getAvailableSkills(
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
  static async getAvailableSkillsNoWhatsApp(
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
  static async getCurrentlyBlockedDevelopers(
    tx: any,
    projectId: string,
    clientUserId: string,
    existingBatchesCount: number = 0
  ): Promise<string[]> {
    const dynamicLimit = getDynamicPendingLimit(existingBatchesCount);
    
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
    console.time("selectCandidates");
    
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
    const deduped = deduplicateCandidates(allCandidates, skillsRequired);
    console.log(`After deduplication: ${deduped.length} candidates`);
    
    // B3) Rebalance and trim to exact quotas with fallback
    const finalCandidates = rebalanceAndTrim(deduped, selection);
    console.log(`Final legacy candidates: ${finalCandidates.length}`);
    console.timeEnd("selectCandidates");
    return finalCandidates;
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
          developerId: { _count: { gte: this.MAX_PENDING_ACTIVE_INVITES_PER_DEV } },
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
    const orderedDevs = await applyFairOrdering(eligibleDevs, cursor);
    console.log(`After fair ordering: ${orderedDevs.length} developers for ${skillId}-${level}`);

    const result = orderedDevs.slice(0, maxCount).map((dev: any) => ({
      developerId: dev.id,
      level: dev.level,
      skillIds: [skillId],
      usualResponseTimeMs: calculateResponseTime(dev.assignmentCandidates),
    }));
    
    console.log(`Final result for ${skillId}-${level}: ${result.length} candidates`);
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
}
