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

    const ideas = await ideaSparkService.getUserBookmarkedIdeas(session.user.id);

    return NextResponse.json({ ideas });
  } catch (error) {
    console.error("Error fetching bookmarked ideas:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookmarked ideas" },
      { status: 500 }
    );
  }
}


