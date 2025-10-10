import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/features/auth/auth";
import { DeveloperStatusService } from "@/core/services/developer-status.service";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Record login activity for developers
    if (session.user.role === "DEVELOPER") {
      await DeveloperStatusService.recordLoginActivity(session.user.id);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error recording login activity:", error);
    return NextResponse.json(
      { error: "Failed to record login activity" },
      { status: 500 }
    );
  }
}

