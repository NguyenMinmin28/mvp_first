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
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");

    const ideas = await ideaSparkService.getUserIdeas(session.user.id, status as any);

    return NextResponse.json({ ideas: ideas.slice(0, limit) });
  } catch (error) {
    console.error("Error fetching user ideas:", error);
    return NextResponse.json(
      { error: "Failed to fetch user ideas" },
      { status: 500 }
    );
  }
}


