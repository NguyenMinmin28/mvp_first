import { prisma } from "@/core/database/db";

export interface FollowNotificationData {
  developerId: string;
  type: "portfolio_update" | "review_received" | "availability_change" | "idea_posted";
  title: string;
  message: string;
  metadata?: any;
}

export class FollowNotificationService {
  /**
   * Send follow notifications to all followers of a developer
   */
  static async notifyFollowers(data: FollowNotificationData): Promise<void> {
    try {
      // Get all followers of this developer
      const followers = await prisma.follow.findMany({
        where: { followingId: data.developerId },
        select: { followerId: true },
      });

      if (followers.length === 0) {
        return; // No followers to notify
      }

      // Create notifications for all followers
      const notifications = followers.map((follow) => ({
        followerId: follow.followerId,
        developerId: data.developerId,
        type: data.type,
        title: data.title,
        message: data.message,
        metadata: data.metadata || {},
      }));

      await prisma.followNotification.createMany({
        data: notifications,
      });

      console.log(`📢 Sent ${notifications.length} follow notifications for ${data.type}`);
    } catch (error) {
      console.error("Error sending follow notifications:", error);
      // Don't throw error to avoid breaking the main flow
    }
  }

  /**
   * Notify followers when developer updates portfolio
   */
  static async notifyPortfolioUpdate(developerId: string, developerName: string): Promise<void> {
    await this.notifyFollowers({
      developerId,
      type: "portfolio_update",
      title: "Portfolio Updated",
      message: `${developerName} has updated their portfolio with new projects and skills.`,
      metadata: { developerName },
    });
  }

  /**
   * Notify followers when developer receives a new review
   */
  static async notifyReviewReceived(
    developerId: string, 
    developerName: string, 
    reviewId: string,
    rating: number,
    clientName: string
  ): Promise<void> {
    await this.notifyFollowers({
      developerId,
      type: "review_received",
      title: "New Review Received",
      message: `${developerName} received a ${rating}-star review from ${clientName}.`,
      metadata: { 
        developerName, 
        reviewId, 
        rating, 
        clientName 
      },
    });
  }

  /**
   * Notify followers when developer changes availability status
   */
  static async notifyAvailabilityChange(
    developerId: string, 
    developerName: string, 
    oldStatus: string, 
    newStatus: string
  ): Promise<void> {
    const statusLabels: Record<string, string> = {
      available: "Available",
      checking: "Checking",
      busy: "Busy",
      away: "Away",
    };

    await this.notifyFollowers({
      developerId,
      type: "availability_change",
      title: "Availability Status Changed",
      message: `${developerName} is now ${statusLabels[newStatus] || newStatus}.`,
      metadata: { 
        developerName, 
        oldStatus, 
        newStatus 
      },
    });
  }

  /**
   * Notify followers when developer posts a new idea
   */
  static async notifyIdeaPosted(
    developerId: string, 
    developerName: string, 
    ideaId: string,
    ideaTitle: string
  ): Promise<void> {
    await this.notifyFollowers({
      developerId,
      type: "idea_posted",
      title: "New Idea Posted",
      message: `${developerName} posted a new idea: "${ideaTitle}".`,
      metadata: { 
        developerName, 
        ideaId, 
        ideaTitle 
      },
    });
  }

  /**
   * Get follower count for a developer
   */
  static async getFollowerCount(developerId: string): Promise<number> {
    try {
      return await prisma.follow.count({
        where: { followingId: developerId },
      });
    } catch (error) {
      console.error("Error getting follower count:", error);
      return 0;
    }
  }

  /**
   * Check if a client follows a developer
   */
  static async isFollowing(clientId: string, developerId: string): Promise<boolean> {
    try {
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: clientId,
            followingId: developerId,
          },
        },
      });
      return !!follow;
    } catch (error) {
      console.error("Error checking follow status:", error);
      return false;
    }
  }
}
