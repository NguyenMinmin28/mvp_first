import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/auth";
import { prisma as db } from "@/core/database/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "CLIENT") {
      return NextResponse.json(
        { error: "Only clients can access subscriptions" },
        { status: 403 }
      );
    }

    // Get client profile
    const clientProfile = await db.clientProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        subscriptions: {
          include: {
            package: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!clientProfile) {
      return NextResponse.json({ subscriptions: [] });
    }

    return NextResponse.json({
      subscriptions: clientProfile.subscriptions,
    });
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
