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
    const developerIds: string[] = Array.isArray(body?.developerIds) ? body.developerIds : [];
    if (developerIds.length === 0) {
      return NextResponse.json({ map: {} });
    }

    const clientProfile = await prisma.clientProfile.findUnique({ where: { userId: sessionUser.id } });
    if (!clientProfile) {
      return NextResponse.json({ error: "Client profile not found" }, { status: 404 });
    }

    const favorites = await prisma.favoriteDeveloper.findMany({
      where: {
        clientId: clientProfile.id,
        developerId: { in: developerIds },
      },
      select: { developerId: true },
    });

    const map: Record<string, boolean> = {};
    for (const id of developerIds) map[id] = false;
    for (const fav of favorites) map[fav.developerId] = true;

    return NextResponse.json({ map });
  } catch (error) {
    console.error("Error in check-bulk favorites:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


