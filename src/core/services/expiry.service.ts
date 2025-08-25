import { RotationService } from "./rotation.service";

export class ExpiryService {
  /**
   * Auto-expire pending candidates that have passed their deadline
   * This should be run as a cron job every minute
   */
  static async expirePendingCandidates(): Promise<{
    expiredCount: number;
    processedAt: Date;
  }> {
    console.log("🔄 Running auto-expire job for pending candidates...");
    
    try {
      const expiredCount = await RotationService.expirePendingCandidates();
      
      console.log("✅ Auto-expire job completed:", {
        expiredCount,
        processedAt: new Date(),
      });

      return {
        expiredCount,
        processedAt: new Date(),
      };
    } catch (error) {
      console.error("❌ Error in auto-expire job:", error);
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
