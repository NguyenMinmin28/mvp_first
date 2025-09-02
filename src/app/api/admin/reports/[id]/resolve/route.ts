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

    const body = await request.json();
    const { action, note } = body;

    if (!action || !['dismiss', 'warn', 'takedown'].includes(action)) {
      return NextResponse.json(
        { error: "Valid action is required: dismiss, warn, or takedown" },
        { status: 400 }
      );
    }

    const report = await ideaSparkService.resolveReport(
      params.id,
      session.user.id,
      action as any,
      note
    );

    return NextResponse.json(report);
  } catch (error) {
    console.error("Error resolving report:", error);
    return NextResponse.json(
      { error: "Failed to resolve report" },
      { status: 500 }
    );
  }
}


