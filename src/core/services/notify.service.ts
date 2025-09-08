import { prisma } from "@/core/database/db";

export interface NotifyInput {
  type: string;
  actorUserId?: string;
  projectId?: string;
  payload?: Record<string, any>;
  recipients: string[]; // userIds
}

/**
 * Create a notification and fan-out to recipients via NotificationUser rows
 */
export async function notify({
  type,
  actorUserId,
  projectId,
  payload = {},
  recipients,
}: NotifyInput): Promise<string> {
  console.log(`🔔 Notify service called: type=${type}, actorUserId=${actorUserId}, recipients=${recipients.join(',')}`);
  
  // For quota notifications, check if we already sent one recently to avoid spam
  if (type === "quota.project_limit_reached" && actorUserId) {
    console.log(`🔍 Checking for existing quota notification for user ${actorUserId}`);
    
    const existingNotification = await (prisma as any).notification.findFirst({
      where: {
        type: "quota.project_limit_reached",
        actorUserId,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      include: {
        users: {
          where: { userId: actorUserId }
        }
      }
    });

    console.log(`🔍 Existing notification found:`, existingNotification ? 'YES' : 'NO');
    if (existingNotification) {
      console.log(`🔍 Existing notification details:`, {
        id: existingNotification.id,
        createdAt: existingNotification.createdAt,
        usersCount: existingNotification.users.length
      });
    }

    // TEMPORARILY DISABLE DEDUPLICATION FOR TESTING
    // If notification already exists and user has received it, don't send again
    // if (existingNotification && existingNotification.users.length > 0) {
    //   console.log(`⏭️ Quota notification already sent to user ${actorUserId}, skipping`);
    //   return existingNotification.id;
    // }
  }

  console.log(`📝 Creating new notification...`);
  const notification = await (prisma as any).notification.create({
    data: {
      type,
      actorUserId,
      projectId,
      payload,
    },
  });

  console.log(`📝 Notification created with ID: ${notification.id}`);

  if (recipients.length > 0) {
    console.log(`👥 Creating notification users for ${recipients.length} recipients...`);
    await (prisma as any).notificationUser.createMany({
      data: recipients.map((userId) => ({ userId, notificationId: notification.id })),
    });
    console.log(`👥 Notification users created successfully`);
  }

  console.log(`✅ Notify service completed successfully`);
  return notification.id;
}

/** Mark notifications as read for a user */
export async function markNotificationsRead(userId: string, ids: string[]): Promise<number> {
  const res = await (prisma as any).notificationUser.updateMany({
    where: { userId, id: { in: ids } },
    data: { readAt: new Date() },
  });
  return res.count;
}

/** Mark all unread notifications as read for a user */
export async function markAllNotificationsRead(userId: string): Promise<number> {
  const res = await (prisma as any).notificationUser.updateMany({
    where: { userId, readAt: null, archivedAt: null },
    data: { readAt: new Date() },
  });
  return res.count;
}

/** Archive notifications for a user */
export async function archiveNotifications(userId: string, ids: string[]): Promise<number> {
  const res = await (prisma as any).notificationUser.updateMany({
    where: { userId, id: { in: ids } },
    data: { archivedAt: new Date() },
  });
  return res.count;
}


