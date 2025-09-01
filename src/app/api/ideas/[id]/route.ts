import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/auth";
import { IdeaSparkService } from "@/core/services/ideaspark.service";

const ideaSparkService = new IdeaSparkService();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const idea = await ideaSparkService.getIdeaById(params.id);
    
    if (!idea) {
      return NextResponse.json(
        { error: "Idea not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(idea);
  } catch (error) {
    console.error("Error fetching idea:", error);
    return NextResponse.json(
      { error: "Failed to fetch idea" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case "like":
        const likeResult = await ideaSparkService.toggleLike(params.id, session.user.id);
        return NextResponse.json(likeResult);

      case "bookmark":
        const bookmarkResult = await ideaSparkService.toggleBookmark(params.id, session.user.id);
        return NextResponse.json(bookmarkResult);

      case "comment":
        if (!data.content) {
          return NextResponse.json(
            { error: "Comment content is required" },
            { status: 400 }
          );
        }
        const comment = await ideaSparkService.addComment({
          ideaId: params.id,
          userId: session.user.id,
          content: data.content,
          parentId: data.parentId,
        });
        return NextResponse.json(comment);

      case "connect":
        const connect = await ideaSparkService.connectWithAuthor({
          ideaId: params.id,
          fromUserId: session.user.id,
          message: data.message,
        });
        return NextResponse.json(connect);

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error processing idea action:", error);
    return NextResponse.json(
      { error: "Failed to process action" },
      { status: 500 }
    );
  }
}
