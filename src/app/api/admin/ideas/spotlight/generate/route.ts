import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/auth";
import { IdeaSparkService } from "@/core/services/ideaspark.service";

const ideaSparkService = new IdeaSparkService();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // TODO: Check if user is admin
    // if (session.user.role !== "ADMIN") {
    //   return NextResponse.json(
    //     { error: "Admin access required" },
    //     { status: 403 }
    //   );
    // }

    const body = await request.json();
    const { weekStart } = body;

    let targetWeekStart: Date;
    if (weekStart) {
      targetWeekStart = new Date(weekStart);
    } else {
      // Default to current week
      const now = new Date();
      const day = now.getUTCDay();
      const diff = now.getUTCDate() - day + (day === 0 ? -6 : 1);
      targetWeekStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), diff));
    }

    const spotlights = await ideaSparkService.generateWeeklySpotlight(targetWeekStart);

    return NextResponse.json({
      message: "Weekly spotlight generated successfully",
      weekStart: targetWeekStart,
      spotlights,
    });
  } catch (error) {
    console.error("Error generating weekly spotlight:", error);
    return NextResponse.json(
      { error: "Failed to generate weekly spotlight" },
      { status: 500 }
    );
  }
}
