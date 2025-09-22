import { NextRequest, NextResponse } from "next/server";
import { getServerSessionUser } from "@/features/auth/auth-server";
import { prisma } from "@/core/database/db";

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getServerSessionUser();
    if (!sessionUser || sessionUser.role !== "CLIENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const userIds: string[] = Array.isArray(body?.userIds) ? body.userIds : [];
    if (userIds.length === 0) {
      return NextResponse.json({ map: {} });
    }

    // Using prisma any to avoid strict type coupling to optional Follow model
    const follows = await (prisma as any).follow.findMany({
      where: {
        followerId: sessionUser.id,
        followingId: { in: userIds },
      },
      select: { followingId: true },
    });

    const map: Record<string, boolean> = {};
    for (const id of userIds) map[id] = false;
    for (const f of follows) map[f.followingId] = true;

    return NextResponse.json({ map });
  } catch (error) {
    console.error("Error in check-bulk follow:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


