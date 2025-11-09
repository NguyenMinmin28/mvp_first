import { prisma } from "@/core/database/db";
import { FollowNotificationService } from "./follow-notification.service";

export class DeveloperStatusService {
  /**
   * Update developer account status (online/offline) - for login/logout
   */
  static async updateAccountStatus(
    userId: string,
    newAccountStatus: "online" | "offline"
  ): Promise<void> {
    try {
      console.log(`🔄 Updating developer account status for user ${userId} to ${newAccountStatus}`);

      const developerProfile = await prisma.developerProfile.findUnique({
        where: { userId },
      });

      if (!developerProfile) {
        console.log(`❌ No developer profile found for user ${userId}`);
        return;
      }

      const oldAccountStatus = developerProfile.accountStatus;
      console.log(`📊 Account status change: ${oldAccountStatus} → ${newAccountStatus}`);

      // Update account status (online/offline) - does NOT affect availabilityStatus
      // Preserve availabilityStatus when updating accountStatus
      // IMPORTANT: Do NOT update currentStatus here - it's deprecated and should only be updated
      // when availabilityStatus changes, not when accountStatus changes
      await prisma.developerProfile.update({
        where: { userId },
        data: {
          accountStatus: newAccountStatus,
          // Do NOT update currentStatus - preserve it to maintain availability information
          // currentStatus is deprecated and should only be updated via updateAvailabilityStatus
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
            status: newAccountStatus,
            action: oldAccountStatus !== newAccountStatus ? "account_status_change" : "account_status_update",
            timestamp: new Date(),
          },
        });
        console.log(`📝 Activity log recorded for developer ${developerProfile.id}`);
      } catch (e) {
        console.warn("⚠️ Could not record activity log", e);
      }

      console.log(`✅ Developer account status updated successfully`);
    } catch (error) {
      console.error("Error updating developer account status:", error);
      throw error;
    }
  }

  /**
   * Update developer availability status (available/not_available) - for project availability
   */
  static async updateAvailabilityStatus(
    userId: string,
    newAvailabilityStatus: "available" | "not_available"
  ): Promise<void> {
    try {
      console.log(`🔄 Updating developer availability status for user ${userId} to ${newAvailabilityStatus}`);

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

      const oldAvailabilityStatus = developerProfile.availabilityStatus;
      console.log(`📊 Availability status change: ${oldAvailabilityStatus} → ${newAvailabilityStatus}`);

      // Update availability status (available/not_available) - does NOT affect accountStatus
      await prisma.developerProfile.update({
        where: { userId },
        data: {
          availabilityStatus: newAvailabilityStatus,
          // Keep currentStatus for backward compatibility during migration
          // Only update currentStatus if it was available/not_available, preserve online/offline from accountStatus
          currentStatus: newAvailabilityStatus === "available" ? "available" : "not_available",
        }
      });

      // Record activity log
      try {
        await prisma.developerActivityLog.create({
          data: {
            developerId: developerProfile.id,
            status: newAvailabilityStatus,
            action: oldAvailabilityStatus !== newAvailabilityStatus ? "availability_status_change" : "availability_status_update",
            timestamp: new Date(),
          },
        });
        console.log(`📝 Activity log recorded for developer ${developerProfile.id}`);
      } catch (e) {
        console.warn("⚠️ Could not record activity log", e);
      }

      console.log(`✅ Developer availability status updated successfully`);

      // Only notify followers if status changed TO "available"
      if (oldAvailabilityStatus !== "available" && newAvailabilityStatus === "available") {
        console.log(`🔔 Availability status changed to available, notifying followers...`);
        
        try {
          await FollowNotificationService.notifyAvailabilityChange(
            developerProfile.id,
            developerProfile.user.name || "Developer",
            newAvailabilityStatus
          );
          console.log(`📢 Availability change notifications sent successfully`);
        } catch (notificationError) {
          console.error(`❌ Failed to send availability notifications:`, notificationError);
          // Don't throw error to avoid breaking the main flow
        }
      } else {
        console.log(`ℹ️ No notification needed (availability: ${oldAvailabilityStatus} → ${newAvailabilityStatus})`);
      }
    } catch (error) {
      console.error("Error updating developer availability status:", error);
      throw error;
    }
  }

  /**
   * DEPRECATED: Update developer status (legacy method for backward compatibility)
   * Use updateAccountStatus() or updateAvailabilityStatus() instead
   */
  static async updateDeveloperStatus(
    userId: string,
    newStatus: "available" | "not_available" | "online" | "offline"
  ): Promise<void> {
    try {
      console.log(`🔄 [DEPRECATED] Updating developer status for user ${userId} to ${newStatus}`);

      // Determine which status type this is
      if (newStatus === "online" || newStatus === "offline") {
        await this.updateAccountStatus(userId, newStatus);
      } else if (newStatus === "available" || newStatus === "not_available") {
        await this.updateAvailabilityStatus(userId, newStatus);
      } else {
        throw new Error(`Invalid status: ${newStatus}`);
      }
    } catch (error) {
      console.error("Error updating developer status:", error);
      throw error;
    }
  }

  /**
   * Set developer account status to offline (for logout)
   */
  static async setDeveloperOffline(userId: string): Promise<void> {
    await this.updateAccountStatus(userId, "offline");
  }

  /**
   * Set developer account status to online (for login)
   */
  static async setDeveloperOnline(userId: string): Promise<void> {
    await this.updateAccountStatus(userId, "online");
  }

  /**
   * Set developer availability status to available (ready to accept projects)
   */
  static async setDeveloperAvailable(userId: string): Promise<void> {
    await this.updateAvailabilityStatus(userId, "available");
  }

  /**
   * Set developer availability status to not_available (not ready to accept projects)
   */
  static async setDeveloperNotAvailable(userId: string): Promise<void> {
    await this.updateAvailabilityStatus(userId, "not_available");
  }

  /**
   * DEPRECATED: Set developer status to busy (for logout) - use setDeveloperOffline
   */
  static async setDeveloperBusy(userId: string): Promise<void> {
    await this.setDeveloperOffline(userId);
  }

  /**
   * Record login activity and set status to online
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

      // Set account status to online when logging in
      await this.setDeveloperOnline(userId);

      // Record login activity
      await prisma.developerActivityLog.create({
        data: {
          developerId: developerProfile.id,
          status: "online",
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
   * Record logout activity and set status to offline
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

      // Set account status to offline when logging out
      await this.setDeveloperOffline(userId);

      // Record logout activity
      await prisma.developerActivityLog.create({
        data: {
          developerId: developerProfile.id,
          status: "offline",
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
