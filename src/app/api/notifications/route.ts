import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/auth";
import { prisma } from "@/core/database/db";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") ?? 20);
  const cursor = searchParams.get("cursor") ?? undefined;
  const only = searchParams.get("only");
  const onlyUnread = only === "unread";

  console.log(`🔔 Notification API called for user ${session.user.id}, limit: ${limit}, onlyUnread: ${onlyUnread}`);

  const where = {
    userId: session.user.id,
    ...(onlyUnread ? { readAt: null } : {}),
  };

  console.log(`🔔 Query where clause:`, where);

  // First, let's check what notifications exist for this user
  const allUserNotifications = await (prisma as any).notificationUser.findMany({
    where: { userId: session.user.id },
    include: { notification: true },
  });
  console.log(`🔔 All notifications for user (raw):`, allUserNotifications.map((r: any) => ({
    id: r.id,
    userId: r.userId,
    readAt: r.readAt,
    archivedAt: r.archivedAt,
    notificationId: r.notificationId,
    notificationType: r.notification?.type,
    notificationCreatedAt: r.notification?.createdAt
  })));

  const rows = await (prisma as any).notificationUser.findMany({
    where,
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { id: "desc" },
    include: { notification: true },
  });

  console.log(`🔔 Found ${rows.length} notification users`);
  
  // Debug: Log raw rows data
  if (rows.length > 0) {
    console.log(`🔔 Raw notification data:`, rows.map((r: any) => ({
      id: r.id,
      userId: r.userId,
      readAt: r.readAt,
      archivedAt: r.archivedAt,
      notificationId: r.notificationId,
      notificationType: r.notification?.type,
      notificationCreatedAt: r.notification?.createdAt
    })));
  }

  // Load actor avatars in one query for performance
  const actorIds = Array.from(new Set(rows.map((r: any) => r.notification?.actorUserId).filter(Boolean)));
  let actorsById: Record<string, { id?: string | null; name?: string | null; image?: string | null; photoUrl?: string | null }> = {};
  if (actorIds.length > 0) {
    const actors = await (prisma as any).user.findMany({
      where: { id: { in: actorIds } },
      select: {
        id: true,
        name: true,
        image: true,
        developerProfile: { select: { id: true, photoUrl: true } }
      }
    });
    actorsById = Object.fromEntries(
      actors.map((u: any) => [u.id, { 
        id: u.developerProfile?.id ?? null, // Use DeveloperProfile.id for navigation
        name: u.name, 
        image: u.image, 
        photoUrl: u.developerProfile?.photoUrl ?? null 
      }])
    );
  }

  const items = rows.slice(0, limit).map((r: any) => ({
    id: r.id,
    read: !!r.readAt,
    createdAt: r.notification.createdAt,
    type: r.notification.type,
    projectId: r.notification.projectId,
    payload: r.notification.payload,
    actor: actorsById[r.notification?.actorUserId || ""] || null,
  }));
  const nextCursor = rows.length > limit ? rows[rows.length - 1].id : null;
  // Compute unread count robustly (Mongo documents may omit null fields)
  const allForUser = await (prisma as any).notificationUser.findMany({
    where: { userId: session.user.id },
    select: { readAt: true },
  });
  const unreadCount = allForUser.filter((r: any) => !r.readAt).length;

  console.log(`🔔 Returning ${items.length} items, unreadCount: ${unreadCount}`);
  
  // Debug: Also check total notifications for this user
  const totalNotifications = await (prisma as any).notificationUser.count({ where: { userId: session.user.id } });
  console.log(`🔔 Total notifications for user: ${totalNotifications}`);

  return NextResponse.json({ items, nextCursor, unreadCount });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { action, ids } = await request.json();
  if (!action) return NextResponse.json({ error: "action required" }, { status: 400 });

  if (action === "read") {
    await (prisma as any).notificationUser.updateMany({ where: { userId: session.user.id, id: { in: ids ?? [] } }, data: { readAt: new Date() } });
    return NextResponse.json({ success: true });
  }
  if (action === "read_all") {
    await (prisma as any).notificationUser.updateMany({ where: { userId: session.user.id, readAt: null, archivedAt: null }, data: { readAt: new Date() } });
    return NextResponse.json({ success: true });
  }
  if (action === "archive") {
    await (prisma as any).notificationUser.updateMany({ where: { userId: session.user.id, id: { in: ids ?? [] } }, data: { archivedAt: new Date() } });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}


