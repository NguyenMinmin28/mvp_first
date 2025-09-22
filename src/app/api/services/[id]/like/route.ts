import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/database/db";
import { getServerSessionUser } from "@/features/auth/auth-server";

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getServerSessionUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const serviceId = params.id;
    console.log('Like API called:', { userId: user.id, serviceId });

    // Fetch service and its developer to prevent self-like
    const service = await (prisma as any).service.findUnique({
      where: { id: serviceId },
      include: { developer: { select: { userId: true } } },
    });

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    if (service.developer?.userId === user.id) {
      return NextResponse.json({ error: "You cannot like your own service" }, { status: 400 });
    }

    // Toggle like
    const existing = await (prisma as any).serviceLike.findUnique({
      where: {
        userId_serviceId: { userId: user.id, serviceId },
      },
    });

    console.log('Existing like:', existing);

    let liked = false;
    if (existing) {
      console.log('Removing like...');
      await (prisma as any).serviceLike.delete({ where: { id: existing.id } });
      await (prisma as any).service.update({
        where: { id: serviceId },
        data: { likesCount: { decrement: 1 } },
      });
      liked = false;
    } else {
      console.log('Adding like...');
      await (prisma as any).serviceLike.create({
        data: { userId: user.id, serviceId },
      });
      await (prisma as any).service.update({
        where: { id: serviceId },
        data: { likesCount: { increment: 1 } },
      });
      liked = true;
    }

    const updated = await (prisma as any).service.findUnique({
      where: { id: serviceId },
      select: { likesCount: true },
    });

    console.log('Final result:', { liked, likeCount: updated?.likesCount ?? 0 });
    return NextResponse.json({ liked, likeCount: updated?.likesCount ?? 0 });
  } catch (error) {
    console.error("Error toggling service like:", error);
    return NextResponse.json({ error: "Failed to toggle like" }, { status: 500 });
  }
}


