// @ts-nocheck
import { MongoClient, ObjectId } from 'mongodb';
import { prisma } from "@/core/database/db";
import { 
  BatchSelectionCriteria, 
  DeveloperCandidate,
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
 * Ultra-fast RotationService using native MongoDB driver for maximum performance
 * Bypasses Prisma overhead for critical operations
 */
export class RotationServiceNativeMongo {
  private static readonly DEFAULT_SELECTION: BatchSelectionCriteria = {
    fresherCount: 5,
    midCount: 5,
    expertCount: 3
  };

  private static readonly ACCEPTANCE_DEADLINE_MINUTES = 15;
  private static mongoClient: MongoClient | null = null;

  /**
   * Get MongoDB client (singleton)
   */
  private static async getMongoClient(): Promise<MongoClient> {
    if (!this.mongoClient) {
      const mongoUrl = process.env.DATABASE_URL;
      if (!mongoUrl) {
        throw new Error('DATABASE_URL not found');
      }
      this.mongoClient = new MongoClient(mongoUrl);
      await this.mongoClient.connect();
    }
    return this.mongoClient;
  }

  /**
   * Ultra-fast candidate selection using native MongoDB aggregation
   */
  static async selectCandidatesNativeMongo(
    skillsRequired: string[],
    clientUserId: string,
    projectId: string,
    selection: BatchSelectionCriteria,
    excludeDeveloperIds: string[] = []
  ): Promise<DeveloperCandidate[]> {
    console.time('selectCandidatesNativeMongo');
    
    const client = await this.getMongoClient();
    const db = client.db();
    
    const pipeline = [
      // Stage 1: Match base eligible developers
      {
        $match: {
          adminApprovalStatus: "approved",
          currentStatus: { $in: ["available", "checking", "busy", "away"] },
          userId: { $ne: new ObjectId(clientUserId) },
          whatsappVerified: true,
          ...(excludeDeveloperIds.length > 0 && { 
            _id: { $nin: excludeDeveloperIds.map(id => new ObjectId(id)) } 
          })
        }
      },
      
      // Stage 2: Join with skills and filter by required skills
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
                    { $in: ["$skillId", skillsRequired.map(id => new ObjectId(id))] }
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
                    { $eq: ["$projectId", new ObjectId(projectId)] },
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
      
      // Stage 6: Join with recent responses for response time
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
            { $limit: 3 }
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
      
      // Stage 8: Unwind skills
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
        $limit: 100
      }
    ];
    
    const result = await db.collection('DeveloperProfile').aggregate(pipeline, {
      allowDiskUse: true,
      maxTimeMS: 1000
    }).toArray();
    
    const candidates = result.map((doc: any) => ({
      developerId: String(doc.developerId),
      level: doc.level,
      skillIds: [String(doc.skillId)],
      usualResponseTimeMs: Math.round(doc.avgResponseTimeMs || 60000)
    }));
    
    // Deduplicate and rebalance
    const deduped = deduplicateCandidates(candidates, skillsRequired);
    const finalCandidates = rebalanceAndTrim(deduped, selection);
    
    console.timeEnd('selectCandidatesNativeMongo');
    console.log(`Native MongoDB selection found ${finalCandidates.length} candidates`);
    
    return finalCandidates;
  }

  /**
   * Ultra-fast batch generation using native MongoDB
   */
  static async generateBatchNativeMongo(
    projectId: string,
    customSelection?: Partial<BatchSelectionCriteria>
  ): Promise<BatchGenerationResult> {
    console.time('generateBatchNativeMongo');
    
    const selection = { ...this.DEFAULT_SELECTION, ...customSelection };
    
    // Get project data using Prisma (for compatibility)
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

    // Get blocked developers using native MongoDB
    const blockedDevelopers = await this.getBlockedDevelopersNativeMongo(projectId);

    // Select candidates using native MongoDB
    const candidates = await this.selectCandidatesNativeMongo(
      project.skillsRequired,
      project.client.userId,
      projectId,
      selection,
      blockedDevelopers
    );

    // Handle no candidates case
    if (candidates.length === 0) {
      console.log(`No candidates found for project ${projectId}, creating empty batch`);
      return await this.createEmptyBatchNativeMongo(projectId, selection);
    }

    // Create batch and candidates using Prisma (for compatibility)
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
      timeout: 5000
    });

    // Send notifications asynchronously
    setImmediate(async () => {
      try {
        const { NotificationService } = await import('./notification.service');
        await NotificationService.sendBatchNotifications(result.batchId);
      } catch (error) {
        console.error("Failed to send batch notifications:", error);
      }
    });

    console.timeEnd('generateBatchNativeMongo');
    return result;
  }

  /**
   * Get blocked developers using native MongoDB
   */
  private static async getBlockedDevelopersNativeMongo(projectId: string): Promise<string[]> {
    const client = await this.getMongoClient();
    const db = client.db();
    
    const pipeline = [
      {
        $match: {
          projectId: new ObjectId(projectId),
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
    
    const result = await db.collection('AssignmentCandidate').aggregate(pipeline).toArray();
    return result.map((doc: any) => String(doc.developerId));
  }

  /**
   * Create empty batch using Prisma
   */
  private static async createEmptyBatchNativeMongo(
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
   * Check if project can generate new batch - native MongoDB
   */
  static async canGenerateNewBatchNativeMongo(projectId: string): Promise<boolean> {
    try {
      const client = await this.getMongoClient();
      const db = client.db();
      
      // Count existing batches
      const batchCount = await db.collection('AssignmentBatch').countDocuments({
        projectId: new ObjectId(projectId)
      });

      if (batchCount >= 8) {
        return false;
      }

      // Check last batch status
      const lastBatch = await db.collection('AssignmentBatch').findOne(
        { projectId: new ObjectId(projectId) },
        { sort: { createdAt: -1 } }
      );

      if (lastBatch) {
        const candidatesCount = await db.collection('AssignmentCandidate').countDocuments({
          batchId: lastBatch._id
        });

        if (candidatesCount === 0) {
          // Check empty batches count
          const emptyBatchesCount = await db.collection('AssignmentBatch').countDocuments({
            projectId: new ObjectId(projectId),
            $expr: {
              $eq: [
                { $size: { $ifNull: ["$candidates", []] } },
                0
              ]
            }
          });

          return emptyBatchesCount < 3;
        }
      }

      return true;
    } catch (error) {
      console.error("Error checking if can generate new batch:", error);
      return true;
    }
  }

  /**
   * Auto-expire pending candidates - native MongoDB
   */
  static async expirePendingCandidatesNativeMongo(): Promise<number> {
    const client = await this.getMongoClient();
    const db = client.db();
    
    const result = await db.collection('AssignmentCandidate').updateMany(
      {
        responseStatus: "pending",
        acceptanceDeadline: { $lt: new Date() },
        source: "AUTO_ROTATION",
      },
      {
        $set: {
          responseStatus: "expired",
          respondedAt: new Date(),
        }
      }
    );

    return result.modifiedCount;
  }

  /**
   * Accept candidate - using Prisma for compatibility
   */
  static async acceptCandidateNativeMongo(candidateId: string, userId: string): Promise<{
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
   * Reject candidate - using Prisma for compatibility
   */
  static async rejectCandidateNativeMongo(candidateId: string, userId: string): Promise<{
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

  /**
   * Close MongoDB connection
   */
  static async closeConnection(): Promise<void> {
    if (this.mongoClient) {
      await this.mongoClient.close();
      this.mongoClient = null;
    }
  }
}
