import { NextRequest, NextResponse } from "next/server";
import { getServerSessionUser } from "@/features/auth/auth-server";
import { prisma } from "@/core/database/db";

// GET /api/user/follow-notifications - Get follow notifications for current user
export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getServerSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit") ?? 20);
    const cursor = searchParams.get("cursor") ?? undefined;
    const onlyUnread = searchParams.get("only") === "unread";

    const where = {
      followerId: sessionUser.id,
      ...(onlyUnread ? { isRead: false } : {}),
    };

    const notifications = await prisma.followNotification.findMany({
      where,
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: "desc" },
      include: {
        developer: {
          select: {
            id: true,
            name: true,
            image: true,
            developerProfile: {
              select: {
                photoUrl: true,
              },
            },
          },
        },
      },
    });

    const hasMore = notifications.length > limit;
    const items = hasMore ? notifications.slice(0, -1) : notifications;
    const nextCursor = hasMore ? items[items.length - 1]?.id : null;

    // Get unread count
    const unreadCount = await prisma.followNotification.count({
      where: { followerId: sessionUser.id, isRead: false },
    });

    const formattedNotifications = items.map((notification) => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      metadata: notification.metadata,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
      developer: {
        id: notification.developer.id,
        name: notification.developer.name,
        image: notification.developer.image,
        photoUrl: notification.developer.developerProfile?.photoUrl,
      },
    }));

    return NextResponse.json({ 
      items: formattedNotifications, 
      nextCursor, 
      unreadCount 
    });
  } catch (error) {
    console.error("Error fetching follow notifications:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/user/follow-notifications - Mark notifications as read
export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getServerSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action, ids } = await request.json();
    if (!action) {
      return NextResponse.json({ error: "action required" }, { status: 400 });
    }

    if (action === "read") {
      await prisma.followNotification.updateMany({
        where: { 
          followerId: sessionUser.id, 
          id: { in: ids ?? [] } 
        },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true });
    }

    if (action === "read_all") {
      await prisma.followNotification.updateMany({
        where: { 
          followerId: sessionUser.id, 
          isRead: false 
        },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Error updating follow notifications:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
