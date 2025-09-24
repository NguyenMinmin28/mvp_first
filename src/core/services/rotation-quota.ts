// @ts-nocheck
import type { BatchSelectionCriteria, DeveloperCandidate } from './rotation-helpers';
import type { Prisma } from "@prisma/client";

type DevLevel = Prisma.$Enums.DevLevel;

/**
 * Adaptive quota system - adjust level quotas when pool is limited
 */
export function adaptiveQuota(
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

/**
 * Rebalance and trim candidates to exact quotas with fallback
 */
export function rebalanceAndTrim(
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
  const adaptiveSelection = adaptiveQuota(selection, found);
  
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
