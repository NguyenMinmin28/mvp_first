// @ts-nocheck
import { prisma } from "@/core/database/db";
import type { Prisma } from "@prisma/client";

type DevLevel = Prisma.$Enums.DevLevel;

// Local copies of types to avoid cross-file dependency
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

// Local helper to compute dynamic pending limit
function getDynamicPendingLimit(existingBatchesCount: number): number {
  return Math.max(5 - existingBatchesCount, 1);
}

// Local helper for response time
function calculateResponseTime(recentCandidates: any[]): number {
  if (!recentCandidates || recentCandidates.length === 0) return 60000;
  const diffs = recentCandidates
    .map((c: any) => (c.respondedAt && c.assignedAt ? (c.respondedAt.getTime ? c.respondedAt.getTime() : new Date(c.respondedAt).getTime()) - (c.assignedAt.getTime ? c.assignedAt.getTime() : new Date(c.assignedAt).getTime()) : undefined))
    .filter((v: any) => typeof v === 'number');
  if (diffs.length === 0) return 60000;
  return Math.round(diffs.reduce((s: number, v: number) => s + v, 0) / diffs.length);
}

// Local helper for fair ordering using rotation cursor
async function applyFairOrdering(devs: any[], cursor: any): Promise<any[]> {
  const lastDeveloperIds = cursor?.lastDeveloperIds || (cursor?.lastDeveloperId ? [cursor.lastDeveloperId] : []);
  if (lastDeveloperIds.length > 0) {
    const lastIndex = devs.findIndex((dev: any) => lastDeveloperIds.includes(dev.id));
    if (lastIndex >= 0) {
      return [...devs.slice(lastIndex + 1), ...devs.slice(0, lastIndex + 1)];
    }
  }
  // Fallback: prioritize longest since last response, then fewer total acceptances
  return devs.sort((a: any, b: any) => {
    const aLast = a.assignmentCandidates?.[0]?.respondedAt ? new Date(a.assignmentCandidates[0].respondedAt).getTime() : 0;
    const bLast = b.assignmentCandidates?.[0]?.respondedAt ? new Date(b.assignmentCandidates[0].respondedAt).getTime() : 0;
    if (aLast !== bLast) return aLast - bLast;
    const aAccepted = (a.assignmentCandidates || []).filter((c: any) => c.responseStatus === 'accepted').length;
    const bAccepted = (b.assignmentCandidates || []).filter((c: any) => c.responseStatus === 'accepted').length;
    return aAccepted - bAccepted;
  });
}

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
   * Core algorithm: Select candidates allowing partial skill overlap, with prioritization and level quotas
   */
  static async selectCandidates(
    tx: any,
    skillsRequired: string[],
    clientUserId: string,
    projectId: string,
    selection: BatchSelectionCriteria,
    excludeDeveloperIds: string[] = [],
    existingBatchesCount: number = 0,
    options: { 
      requireWhatsApp?: boolean; 
      minSkillOverlap?: number; 
      preferFullMatch?: boolean; 
      maxPendingInvitesPerDev?: number;
      useRotationCursor?: boolean;
      avoidRepeatBatches?: number;
      minNewPerBatch?: number;
    } = {}
  ): Promise<DeveloperCandidate[]> {
    console.time("selectCandidates");
    
    const requireWhatsApp = options.requireWhatsApp !== false;
    const minSkillOverlap = typeof options.minSkillOverlap === 'number' ? options.minSkillOverlap : 1;
    const preferFullMatch = options.preferFullMatch !== false;
    const maxPendingInvitesPerDev = typeof options.maxPendingInvitesPerDev === 'number' ? options.maxPendingInvitesPerDev : this.MAX_PENDING_ACTIVE_INVITES_PER_DEV;
    const useRotationCursor = options.useRotationCursor !== false;
    const avoidRepeatBatches = typeof options.avoidRepeatBatches === 'number' ? options.avoidRepeatBatches : 0;
    const minNewPerBatch = Math.max(0, options.minNewPerBatch || 0);

    const reqSet = new Set(skillsRequired);

    // Over-limit developers across active batches to avoid spamming
    const pendingCounts = await tx.assignmentCandidate.groupBy({
      by: ['developerId'],
      where: {
        responseStatus: "pending",
        batch: { status: "active" },
        source: "AUTO_ROTATION",
      },
      _count: { developerId: true },
    });
    const overLimitDeveloperIds = pendingCounts
      .filter((p: any) => (p._count?.developerId || 0) >= maxPendingInvitesPerDev)
      .map((p: any) => p.developerId as string);

    const allExcludeIds = Array.from(new Set([...(excludeDeveloperIds || []), ...overLimitDeveloperIds]));

    // Base filters
    const baseWhere: any = {
      adminApprovalStatus: "approved",
      currentStatus: { in: ["available", "checking", "busy", "away"] },
      userId: { not: clientUserId },
      id: { notIn: allExcludeIds },
      // Do not re-invite devs currently pending/accepted in this project
      NOT: {
        assignmentCandidates: {
          some: {
            projectId: projectId,
            responseStatus: { in: ["pending", "accepted"] },
          },
        },
      },
      // Partial match: at least one required skill
      skills: {
        some: { skillId: { in: skillsRequired } },
      },
    };
    if (requireWhatsApp) {
      baseWhere.whatsappVerified = true;
    }

    // Fetch pool with only matching skills selected to compute overlap
    const pool = await tx.developerProfile.findMany({
      where: baseWhere,
      select: {
        id: true,
        level: true,
        skills: {
          where: { skillId: { in: skillsRequired } },
          select: { skillId: true },
        },
        assignmentCandidates: {
          where: { responseStatus: { in: ["accepted", "rejected"] } },
          select: { respondedAt: true, assignedAt: true },
          orderBy: { respondedAt: "desc" },
          take: 5,
        },
      },
      orderBy: [{ id: "asc" }],
      take: 300,
    });

    // Project-level invite history for exploration
    const invitedHistory = await tx.assignmentCandidate.findMany({
      where: { projectId },
      select: { developerId: true },
    });
    const invitedSet = new Set(invitedHistory.map((r: any) => r.developerId as string));

    // Cooldown: devs in last N batches of this project
    let recentSet = new Set<string>();
    if (avoidRepeatBatches > 0) {
      const recentBatches = await tx.assignmentBatch.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
        take: avoidRepeatBatches,
        select: { id: true }
      });
      const recentIds = recentBatches.map((b: any) => b.id);
      if (recentIds.length) {
        const recents = await tx.assignmentCandidate.findMany({
          where: { batchId: { in: recentIds } },
          select: { developerId: true },
        });
        recentSet = new Set(recents.map((r: any) => r.developerId as string));
      }
    }

    // Rotation cursor across required skills per level
    const cursorByLevel = new Map<DevLevel, Set<string>>();
    if (useRotationCursor) {
      const cursors = await tx.rotationCursor.findMany({
        where: { skillId: { in: skillsRequired }, level: { in: ["EXPERT","MID","FRESHER"] } },
        select: { level: true, lastDeveloperIds: true },
      });
      for (const c of cursors) {
        const L = c.level as DevLevel;
        const set = cursorByLevel.get(L) || new Set<string>();
        for (const id of (c.lastDeveloperIds || [])) set.add(id);
        cursorByLevel.set(L, set);
      }
    }

    // Score and filter by overlap
    type Scored = { id: string; level: DevLevel; overlapCount: number; overlapRatio: number; responseScore: number; usualResponseTimeMs: number };
    const toMs = (a?: Date | null, b?: Date | null) => (a && b ? (a.getTime() - b.getTime()) : undefined);
    const recentAvgMs = (rows: any[]) => {
      const diffs = rows
        .map((c: any) => toMs(c.respondedAt, c.assignedAt))
        .filter((v: any) => typeof v === 'number') as number[];
      if (diffs.length === 0) return 60000;
      return Math.round(diffs.reduce((s, v) => s + v, 0) / diffs.length);
    };

    const scoredRaw: (Scored & { score: number })[] = pool.map((dev: any) => {
      const overlapCount = (dev.skills || []).reduce((acc: number, s: any) => acc + (reqSet.has(s.skillId) ? 1 : 0), 0);
      const usualResponseTimeMs = recentAvgMs(dev.assignmentCandidates || []);
      const responseScore = 1_000_000 / (usualResponseTimeMs + 500);
      const base: Scored = {
        id: dev.id,
        level: dev.level,
        overlapCount,
        overlapRatio: skillsRequired.length ? overlapCount / skillsRequired.length : 0,
        responseScore,
        usualResponseTimeMs,
      };
      return { ...base, score: 0 };
    }).filter((d) => d.overlapCount >= minSkillOverlap);

    if (scoredRaw.length === 0) {
      console.timeEnd("selectCandidates");
      return [];
    }

    const fullCount = skillsRequired.length;
    const scoreValue = (d: Scored & { score: number }) => {
      const fullBoost = preferFullMatch && d.overlapCount === fullCount ? 2 : 0;
      const multiBoost = preferFullMatch && d.overlapCount > 1 && d.overlapCount < fullCount ? 1 : 0;
      let score = d.overlapCount * 10 + fullBoost * 5 + multiBoost * 2 + d.responseScore;
      // Penalize recent-in-project
      if (recentSet.has(d.id)) score -= 100; // strong cooldown
      // Penalize rotation cursor last picks
      if (cursorByLevel.get(d.level)?.has(d.id)) score -= 40;
      // Bonus for never invited in this project
      if (!invitedSet.has(d.id)) score += 60;
      return score;
    };

    // Split by level and sort by score
    const byLevel: Record<DevLevel, (Scored & { score: number })[]> = {
      FRESHER: [],
      MID: [],
      EXPERT: [],
    } as any;
    for (const s of scoredRaw) {
      s.score = scoreValue(s);
      if (byLevel[s.level]) byLevel[s.level].push(s);
    }
    for (const key of ["FRESHER", "MID", "EXPERT"] as DevLevel[]) {
      byLevel[key] = byLevel[key].sort((a, b) => b.score - a.score || b.overlapCount - a.overlapCount);
    }

    // Fill quotas, then borrow if needed
    const need = {
      FRESHER: selection.fresherCount,
      MID: selection.midCount,
      EXPERT: selection.expertCount,
    };
    const chosen: (Scored & { score: number })[] = [];
    const pickTop = (arr: (Scored & { score: number })[], n: number) => arr.slice(0, Math.max(0, n));

    for (const lvl of ["EXPERT", "MID", "FRESHER"] as DevLevel[]) {
      const got = pickTop(byLevel[lvl], need[lvl]);
      chosen.push(...got);
      byLevel[lvl] = byLevel[lvl].slice(got.length);
      need[lvl] -= got.length;
    }

    const shortage = Math.max(0, need.FRESHER) + Math.max(0, need.MID) + Math.max(0, need.EXPERT);
    if (shortage > 0) {
      const leftovers = [...byLevel.EXPERT, ...byLevel.MID, ...byLevel.FRESHER].sort((a, b) => b.score - a.score || b.overlapCount - a.overlapCount);
      chosen.push(...leftovers.slice(0, shortage));
    }

    // Exploration: ensure at least minNewPerBatch new (not previously invited) developers
    if (minNewPerBatch > 0) {
      const currentNew = chosen.filter(c => !invitedSet.has(c.id)).length;
      const needNew = Math.max(0, minNewPerBatch - currentNew);
      if (needNew > 0) {
        const leftovers = [...byLevel.EXPERT, ...byLevel.MID, ...byLevel.FRESHER]
          .filter(c => !invitedSet.has(c.id))
          .sort((a, b) => b.score - a.score || b.overlapCount - a.overlapCount);
        let i = 0;
        // Replace lowest-scoring previously-invited candidates
        for (let k = chosen.length - 1; k >= 0 && i < needNew; k--) {
          if (invitedSet.has(chosen[k].id)) {
            const newCandidate = leftovers[i++];
            if (!newCandidate) break;
            chosen[k] = newCandidate;
          }
        }
      }
    }

    // Top-up: fill up to 15 total candidates by best remaining regardless of level
    const desiredMaxBatchSize = 15;
    if (chosen.length < desiredMaxBatchSize) {
      const leftoversAll = [...byLevel.EXPERT, ...byLevel.MID, ...byLevel.FRESHER]
        .sort((a, b) => b.score - a.score || b.overlapCount - a.overlapCount);
      const remainingSlots = desiredMaxBatchSize - chosen.length;
      chosen.push(...leftoversAll.slice(0, remainingSlots));
    }

    const result: DeveloperCandidate[] = chosen.map((c) => ({
      developerId: c.id,
      level: c.level,
      skillIds: skillsRequired, // provide required skills for cursor updates; actual exact skills are available via overlap but not needed here
      usualResponseTimeMs: Math.round(c.usualResponseTimeMs || 60000),
    }));

    console.log(`Selected ${result.length} candidates with partial skill matching`);
    console.timeEnd("selectCandidates");
    return result;
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
