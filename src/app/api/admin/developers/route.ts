import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/features/auth/auth";
import { prisma } from "@/core/database/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const developers = await prisma.developerProfile.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        skills: {
          include: {
            skill: {
              select: {
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            assignmentCandidates: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      developers,
    });
  } catch (error) {
    console.error("Error fetching developers for admin:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
