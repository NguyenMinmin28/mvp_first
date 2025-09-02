import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/auth";
import { IdeaSparkService } from "@/core/services/ideaspark.service";

const ideaSparkService = new IdeaSparkService();

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

    // TODO: Check if user is admin
    // if (session.user.role !== "ADMIN") {
    //   return NextResponse.json(
    //     { error: "Admin access required" },
    //     { status: 403 }
    //   );
    // }

    const idea = await ideaSparkService.togglePinIdea(
      params.id,
      session.user.id
    );

    return NextResponse.json(idea);
  } catch (error) {
    console.error("Error toggling idea pin:", error);
    return NextResponse.json(
      { error: "Failed to toggle idea pin" },
      { status: 500 }
    );
  }
}


