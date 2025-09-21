import { RotationService } from "./rotation.service";
import { prisma } from "@/core/database/db";
import { logger } from "@/lib/logger";

export class ExpiryService {
  /**
   * Smart expiry service that expires candidates AND auto-refreshes fully expired batches
   * This should be run as a cron job every minute
   */
  static async expirePendingCandidates(): Promise<{
    expiredCount: number;
    refreshedBatches: number;
    processedAt: Date;
  }> {
    console.log("🔄 Running smart auto-expire job for pending candidates...");
    
    try {
      // Step 1: Expire pending candidates that have passed their deadline
      const expiredCount = await RotationService.expirePendingCandidates();
      
      // Step 2: Find and refresh batches where all candidates are expired
      // Temporarily disable batch refresh to debug the infinite loop issue
      let refreshedBatches = 0;
      
      try {
        // Add timeout to prevent infinite loops
        refreshedBatches = await Promise.race([
          this.refreshFullyExpiredBatches(),
          new Promise<number>((_, reject) => 
            setTimeout(() => reject(new Error("Batch refresh timeout after 60 seconds")), 60000)
          )
        ]);
      } catch (batchError) {
        console.warn("⚠️ Batch refresh failed, continuing with expire only:", batchError);
        // Don't throw error, just log and continue
      }
      
      console.log("✅ Smart auto-expire job completed:", {
        expiredCount,
        refreshedBatches,
        processedAt: new Date(),
      });

      return {
        expiredCount,
        refreshedBatches,
        processedAt: new Date(),
      };
    } catch (error) {
      console.error("❌ Error in smart auto-expire job:", error);
      throw error;
    }
  }

  /**
   * Find batches where all candidates are expired and create new batches
   */
  private static async refreshFullyExpiredBatches(): Promise<number> {
    const correlationId = logger.generateCorrelationId();
    logger.info("Checking for fully expired batches to refresh", { correlationId });

    try {
      // Find active batches where all candidates are expired
      const expiredBatches = await prisma.assignmentBatch.findMany({
        where: {
          status: "active",
          candidates: {
            every: {
              responseStatus: "expired"
            }
          }
        },
        include: {
          project: {
            select: {
              id: true,
              title: true,
              status: true,
              skillsRequired: true,
              clientId: true
            }
          },
          candidates: {
            select: {
              id: true,
              developerId: true,
              responseStatus: true
            }
          }
        }
      });

      logger.info(`Found ${expiredBatches.length} fully expired batches`, { correlationId });

      // Safety limit: only process max 5 batches per run to prevent overload
      const batchesToProcess = expiredBatches.slice(0, 5);
      if (expiredBatches.length > 5) {
        logger.warn(`Limiting batch refresh to 5 batches (found ${expiredBatches.length})`, { correlationId });
      }

      let refreshedCount = 0;

      for (const batch of batchesToProcess) {
        try {
          // Only refresh if project is still in assigning status
          if (batch.project.status !== "assigning") {
            logger.info(`Skipping batch ${batch.id} - project status is ${batch.project.status}`, { correlationId });
            continue;
          }

          logger.info(`Refreshing batch ${batch.id} for project ${batch.project.title}`, { correlationId });

          // Mark current batch as expired
          await prisma.assignmentBatch.update({
            where: { id: batch.id },
            data: {
              status: "expired",
              refreshReason: "auto-refresh-all-candidates-expired"
            }
          });

          // Use refreshBatch instead of generateBatch to avoid potential loops
          const newBatchResult = await RotationService.refreshBatch(batch.project.id);
          
          logger.info(`Successfully refreshed batch for project ${batch.project.title}`, {
            correlationId,
            oldBatchId: batch.id,
            newBatchId: newBatchResult.batchId,
            newCandidatesCount: newBatchResult.candidates.length
          });

          refreshedCount++;

        } catch (error) {
          logger.error(`Failed to refresh batch ${batch.id}`, error as Error, {
            correlationId,
            batchId: batch.id,
            projectId: batch.project.id
          });
          // Continue with other batches even if one fails
        }
      }

      logger.info(`Batch refresh completed`, {
        correlationId,
        totalExpiredBatches: expiredBatches.length,
        successfullyRefreshed: refreshedCount
      });

      return refreshedCount;

    } catch (error) {
      logger.error("Error in refreshFullyExpiredBatches", error as Error, { correlationId });
      throw error;
    }
  }

  /**
   * Clean up old expired/invalidated candidates (optional)
   * This can be run less frequently to keep database clean
   */
  static async cleanupOldCandidates(olderThanDays: number = 30): Promise<{
    deletedCount: number;
    processedAt: Date;
  }> {
    console.log("🔄 Running cleanup job for old candidates...");
    
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      // You can implement this if needed
      // const result = await prisma.assignmentCandidate.deleteMany({
      //   where: {
      //     responseStatus: { in: ["expired", "invalidated"] },
      //     assignedAt: { lt: cutoffDate },
      //   },
      // });

      console.log("✅ Cleanup job completed");

      return {
        deletedCount: 0, // result.count
        processedAt: new Date(),
      };
    } catch (error) {
      console.error("❌ Error in cleanup job:", error);
      throw error;
    }
  }
}
