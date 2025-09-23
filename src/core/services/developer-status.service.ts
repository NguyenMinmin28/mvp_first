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
}
