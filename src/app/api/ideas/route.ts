import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/features/auth/auth";
import { IdeaSparkService } from "@/core/services/ideaspark.service";
type IdeaStatus = string;
type IdeaAdminTag = string;

const ideaSparkService = new IdeaSparkService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as IdeaStatus;
    const tags = searchParams.get("tags")?.split(",") as IdeaAdminTag[];
    const search = searchParams.get("q");
    const cursor = searchParams.get("cursor");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skillIdsParam = searchParams.get("skillIds");
    const skillIds = skillIdsParam ? skillIdsParam.split(",").filter(Boolean) : undefined;

    const result = await ideaSparkService.getIdeasForWall({
      status: status as any,
      adminTags: tags as any,
      search: search || undefined,
      cursor: cursor || undefined,
      limit,
      skillIds,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching ideas:", error);
    return NextResponse.json(
      { error: "Failed to fetch ideas" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, summary, body: ideaBody, coverFileId, coverUrl, skillIds } = body;

    if (!title || !summary) {
      return NextResponse.json(
        { error: "Title and summary are required" },
        { status: 400 }
      );
    }

    const idea = await ideaSparkService.createIdea({
      authorId: session.user.id,
      title,
      summary,
      body: ideaBody,
      coverFileId,
      coverUrl,
      skillIds,
    });

    return NextResponse.json(idea, { status: 201 });
  } catch (error) {
    console.error("Error creating idea:", error);
    return NextResponse.json(
      { error: "Failed to create idea" },
      { status: 500 }
    );
  }
}
