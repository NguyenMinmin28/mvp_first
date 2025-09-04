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
    const { message } = body;

    const result = await ideaSparkService.connectWithAuthor({
      ideaId: params.id,
      fromUserId: session.user.id,
      message,
    });
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error connecting with author:", error);
    return NextResponse.json(
      { error: error.message || "Failed to connect with author" },
      { status: 500 }
    );
  }
}
