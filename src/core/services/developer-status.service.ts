import { prisma } from "@/core/database/db";
import { FollowNotificationService } from "./follow-notification.service";

export class DeveloperStatusService {
  /**
   * Update developer status and notify followers if status changes to available
   */
  static async updateDeveloperStatus(
    userId: string,
    newStatus: "available" | "busy" | "checking" | "away"
  ): Promise<void> {
    try {
      console.log(`🔄 Updating developer status for user ${userId} to ${newStatus}`);

      // Get current developer profile
      const developerProfile = await prisma.developerProfile.findUnique({
        where: { userId },
        include: {
          user: {
            select: {
              name: true,
            }
          }
        }
      });

      if (!developerProfile) {
        console.log(`❌ No developer profile found for user ${userId}`);
        return;
      }

      const oldStatus = developerProfile.currentStatus;
      console.log(`📊 Status change: ${oldStatus} → ${newStatus}`);

      // Update the status
      await prisma.developerProfile.update({
        where: { userId },
        data: {
          currentStatus: newStatus,
        }
      });

      // Record activity timestamp on the owning user
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { lastLoginAt: new Date() },
        });
      } catch (e) {
        console.warn("⚠️ Could not update user.lastLoginAt while recording status activity", e);
      }

      // Record activity log
      try {
        await prisma.developerActivityLog.create({
          data: {
            developerId: developerProfile.id,
            status: newStatus,
            action: oldStatus !== newStatus ? "status_change" : "status_update",
            timestamp: new Date(),
          },
        });
        console.log(`📝 Activity log recorded for developer ${developerProfile.id}`);
      } catch (e) {
        console.warn("⚠️ Could not record activity log", e);
      }

      console.log(`✅ Developer status updated successfully`);

      // Only notify followers if status changed TO "available"
      if (oldStatus !== "available" && newStatus === "available") {
        console.log(`🔔 Status changed to available, notifying followers...`);
        
        try {
          await FollowNotificationService.notifyAvailabilityChange(
            developerProfile.id, // Use developer profile ID
            developerProfile.user.name || "Developer",
            newStatus
          );
          console.log(`📢 Availability change notifications sent successfully`);
        } catch (notificationError) {
          console.error(`❌ Failed to send availability notifications:`, notificationError);
          // Don't throw error to avoid breaking the main flow
        }
      } else {
        console.log(`ℹ️ No notification needed (status: ${oldStatus} → ${newStatus})`);
      }

    } catch (error) {
      console.error("Error updating developer status:", error);
      throw error;
    }
  }

  /**
   * Set developer status to busy (for logout)
   */
  static async setDeveloperBusy(userId: string): Promise<void> {
    await this.updateDeveloperStatus(userId, "busy");
  }

  /**
   * Set developer status to available (for login)
   */
  static async setDeveloperAvailable(userId: string): Promise<void> {
    await this.updateDeveloperStatus(userId, "available");
  }

  /**
   * Record login activity
   */
  static async recordLoginActivity(userId: string): Promise<void> {
    try {
      const developerProfile = await prisma.developerProfile.findUnique({
        where: { userId },
      });

      if (!developerProfile) {
        console.log(`❌ No developer profile found for user ${userId}`);
        return;
      }

      // Record login activity
      await prisma.developerActivityLog.create({
        data: {
          developerId: developerProfile.id,
          status: "available",
          action: "login",
          timestamp: new Date(),
        },
      });

      console.log(`📝 Login activity recorded for developer ${developerProfile.id}`);
    } catch (error) {
      console.error("Error recording login activity:", error);
    }
  }

  /**
   * Record logout activity
   */
  static async recordLogoutActivity(userId: string): Promise<void> {
    try {
      const developerProfile = await prisma.developerProfile.findUnique({
        where: { userId },
      });

      if (!developerProfile) {
        console.log(`❌ No developer profile found for user ${userId}`);
        return;
      }

      // Record logout activity
      await prisma.developerActivityLog.create({
        data: {
          developerId: developerProfile.id,
          status: "busy",
          action: "logout",
          timestamp: new Date(),
        },
      });

      console.log(`📝 Logout activity recorded for developer ${developerProfile.id}`);
    } catch (error) {
      console.error("Error recording logout activity:", error);
    }
  }

  /**
   * Get latest activity logs for a developer
   */
  static async getLatestActivityLogs(developerId: string, limit: number = 4) {
    try {
      const logs = await prisma.developerActivityLog.findMany({
        where: { developerId },
        orderBy: { timestamp: 'desc' },
        take: limit,
      });

      return logs;
    } catch (error) {
      console.error("Error getting activity logs:", error);
      return [];
    }
  }
}
