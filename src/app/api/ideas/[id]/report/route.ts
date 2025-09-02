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

    const body = await request.json();
    const { reason } = body;

    if (!reason) {
      return NextResponse.json(
        { error: "Reason is required" },
        { status: 400 }
      );
    }

    const report = await ideaSparkService.reportIdea({
      ideaId: params.id,
      reporterId: session.user.id,
      reason,
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error("Error reporting idea:", error);
    return NextResponse.json(
      { error: "Failed to report idea" },
      { status: 500 }
    );
  }
}


