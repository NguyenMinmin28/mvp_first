// @ts-nocheck
import { prisma } from "@/core/database/db";
import type { DeveloperCandidate, BatchSelectionCriteria } from './rotation-helpers';

/**
 * Optimized database operations using aggregation pipelines and bulk operations
 */
export class RotationDbOptimized {
  
  /**
   * Get blocked developers using single aggregation pipeline
   */
  static async getBlockedDevelopersOptimized(
    projectId: string,
    existingBatchesCount: number = 0
  ): Promise<string[]> {
    console.time('getBlockedDevelopersOptimized');
    
    const dynamicLimit = Math.max(5 - existingBatchesCount, 1);
    
    const pipeline = [
      // Stage 1: Get all assignment candidates for this project
      {
        $match: {
          projectId: projectId,
          responseStatus: { $in: ["pending", "accepted"] }
        }
      },
      // Stage 2: Group by developerId to get unique blocked developers
      {
        $group: {
          _id: "$developerId"
        }
      },
      // Stage 3: Project to get just the IDs
      {
        $project: {
          developerId: "$_id",
          _id: 0
        }
      }
    ];
    
    const overLimitPipeline = [
      // Stage 1: Get pending auto-rotation candidates
      {
        $match: {
          responseStatus: "pending",
          source: "AUTO_ROTATION"
        }
      },
      // Stage 2: Join with batch to filter active batches
      {
        $lookup: {
          from: "AssignmentBatch",
          localField: "batchId",
          foreignField: "_id",
          as: "batch"
        }
      },
      // Stage 3: Filter active batches
      {
        $match: {
          "batch.status": "active"
        }
      },
      // Stage 4: Group by developerId and count
      {
        $group: {
          _id: "$developerId",
          count: { $sum: 1 }
        }
      },
      // Stage 5: Filter over limit
      {
        $match: {
          count: { $gte: dynamicLimit }
        }
      },
      // Stage 6: Project to get just the IDs
      {
        $project: {
          developerId: "$_id",
          _id: 0
        }
      }
    ];
    
    const [blockedResult, overLimitResult] = await Promise.all([
      prisma.$runCommandRaw({
        aggregate: "AssignmentCandidate",
        pipeline,
        cursor: {}
      }),
      prisma.$runCommandRaw({
        aggregate: "AssignmentCandidate", 
        pipeline: overLimitPipeline,
        cursor: {}
      })
    ]);
    
    const blockedIds = blockedResult.cursor.firstBatch.map((doc: any) => doc.developerId);
    const overLimitIds = overLimitResult.cursor.firstBatch.map((doc: any) => doc.developerId);
    
    console.timeEnd('getBlockedDevelopersOptimized');
    console.log(`Blocked developers: ${blockedIds.length} (current), ${overLimitIds.length} (over-limit, limit=${dynamicLimit})`);
    
    return Array.from(new Set([...blockedIds, ...overLimitIds]));
  }
  
  /**
   * Get available skills using single aggregation pipeline
   */
  static async getAvailableSkillsOptimized(
    skillsRequired: string[]
  ): Promise<string[]> {
    console.time('getAvailableSkillsOptimized');
    
    const pipeline = [
      // Stage 1: Match approved developers with WhatsApp
      {
        $match: {
          adminApprovalStatus: "approved",
          currentStatus: { $in: ["available", "online"] }, // Only include available and online developers
          whatsappVerified: true
        }
      },
      // Stage 2: Join with skills
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
      // Stage 3: Unwind skills
      {
        $unwind: "$skills"
      },
      // Stage 4: Filter by required skills
      {
        $match: {
          "skills.skillId": { $in: skillsRequired }
        }
      },
      // Stage 5: Group by skillId and count
      {
        $group: {
          _id: "$skills.skillId",
          count: { $sum: 1 }
        }
      },
      // Stage 6: Filter skills with available developers
      {
        $match: {
          count: { $gt: 0 }
        }
      },
      // Stage 7: Project to get skillId
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
    
    const availableSkills = result.cursor.firstBatch.map((doc: any) => {
      console.log(`Skill ${doc.skillId}: ${doc.count} developers available`);
      return doc.skillId;
    });
    
    console.timeEnd('getAvailableSkillsOptimized');
    return availableSkills;
  }
  
  /**
   * Get candidates using optimized aggregation pipeline
   */
  static async getCandidatesOptimized(
    skillsRequired: string[],
    clientUserId: string,
    projectId: string,
    selection: BatchSelectionCriteria,
    excludeDeveloperIds: string[] = []
  ): Promise<DeveloperCandidate[]> {
    console.time('getCandidatesOptimized');
    
    const pipeline = [
      // Stage 1: Match base eligible developers
      {
        $match: {
          adminApprovalStatus: "approved",
          currentStatus: { $in: ["available", "online"] }, // Only include available and online developers
          userId: { $ne: clientUserId },
          whatsappVerified: true,
          ...(excludeDeveloperIds.length > 0 && { _id: { $nin: excludeDeveloperIds } })
        }
      },
      
      // Stage 2: Join with skills
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
      
      // Stage 3: Filter by required skills
      {
        $match: {
          "skills.skillId": { $in: skillsRequired }
        }
      },
      
      // Stage 4: Join with assignment candidates to exclude current project
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
      
      // Stage 6: Join with recent responses for response time calculation
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
      
      // Stage 7: Calculate average response time
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
      
      // Stage 9: Filter to only required skills
      {
        $match: {
          "skills.skillId": { $in: skillsRequired }
        }
      },
      
      // Stage 10: Project final fields
      {
        $project: {
          developerId: "$_id",
          level: 1,
          skillId: "$skills.skillId",
          avgResponseTimeMs: 1,
          _id: 0
        }
      },
      
      // Stage 11: Sort for consistent ordering
      {
        $sort: {
          level: 1,
          avgResponseTimeMs: 1,
          developerId: 1
        }
      },
      
      // Stage 12: Limit to reasonable number
      {
        $limit: 200
      }
    ];
    
    const result = await prisma.$runCommandRaw({
      aggregate: "DeveloperProfile",
      pipeline,
      cursor: {},
      allowDiskUse: true,
      maxTimeMS: 2000
    });
    
    const candidates = result.cursor.firstBatch.map((doc: any) => ({
      developerId: String(doc.developerId),
      level: doc.level,
      skillIds: [String(doc.skillId)],
      usualResponseTimeMs: Math.round(doc.avgResponseTimeMs || 60000)
    }));
    
    console.timeEnd('getCandidatesOptimized');
    console.log(`Found ${candidates.length} candidates using optimized pipeline`);
    
    return candidates;
  }
  
  /**
   * Bulk create assignment candidates
   */
  static async bulkCreateCandidates(
    tx: any,
    batchId: string,
    projectId: string,
    candidates: DeveloperCandidate[]
  ): Promise<void> {
    console.time('bulkCreateCandidates');
    
    const acceptanceDeadline = new Date(Date.now() + 15 * 60 * 1000);
    
    const candidateData = candidates.map((candidate) => ({
      batchId,
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
    }));
    
    // Use createMany for bulk insert
    await tx.assignmentCandidate.createMany({
      data: candidateData,
      skipDuplicates: true
    });
    
    console.timeEnd('bulkCreateCandidates');
    console.log(`Bulk created ${candidates.length} candidates`);
  }
  
  /**
   * Bulk invalidate candidates
   */
  static async bulkInvalidateCandidates(
    tx: any,
    batchId: string
  ): Promise<number> {
    console.time('bulkInvalidateCandidates');
    
    const result = await tx.assignmentCandidate.updateMany({
      where: {
        batchId,
        responseStatus: { not: "accepted" },
      },
      data: {
        responseStatus: "invalidated",
        invalidatedAt: new Date(),
      },
    });
    
    console.timeEnd('bulkInvalidateCandidates');
    console.log(`Bulk invalidated ${result.count} candidates`);
    
    return result.count;
  }
  
  /**
   * Get project with minimal data using aggregation
   */
  static async getProjectOptimized(
    tx: any,
    projectId: string
  ): Promise<any> {
    console.time('getProjectOptimized');
    
    const pipeline = [
      {
        $match: { _id: projectId }
      },
      {
        $lookup: {
          from: "ClientProfile",
          localField: "clientId",
          foreignField: "_id",
          as: "client"
        }
      },
      {
        $unwind: "$client"
      },
      {
        $lookup: {
          from: "User",
          localField: "client.userId",
          foreignField: "_id",
          as: "clientUser"
        }
      },
      {
        $unwind: "$clientUser"
      },
      {
        $project: {
          _id: 1,
          skillsRequired: 1,
          status: 1,
          currentBatchId: 1,
          "client.userId": 1
        }
      }
    ];
    
    const result = await tx.$runCommandRaw({
      aggregate: "Project",
      pipeline,
      cursor: {}
    });
    
    const project = result.cursor.firstBatch[0];
    console.timeEnd('getProjectOptimized');
    
    return project;
  }
}
