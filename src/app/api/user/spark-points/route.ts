import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/auth";
import { IdeaSparkService } from "@/core/services/ideaspark.service";

const ideaSparkService = new IdeaSparkService();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const includeHistory = searchParams.get("history") === "true";
    const limit = parseInt(searchParams.get("limit") || "20");

    const [totalPoints, history] = await Promise.all([
      ideaSparkService.getUserSparkPoints(session.user.id),
      includeHistory ? ideaSparkService.getUserSparkHistory(session.user.id, limit) : null,
    ]);

    return NextResponse.json({
      totalPoints,
      history: includeHistory ? history : undefined,
    });
  } catch (error) {
    console.error("Error fetching spark points:", error);
    return NextResponse.json(
      { error: "Failed to fetch spark points" },
      { status: 500 }
    );
  }
}


