import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/features/auth/auth";
import { IdeaSparkService } from "@/core/services/ideaspark.service";

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

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

    // TODO: Check if user is admin
    // if (session.user.role !== "ADMIN") {
    //   return NextResponse.json(
    //     { error: "Admin access required" },
    //     { status: 403 }
    //   );
    // }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");

    // Add timeout and better error handling
    const ideas = await Promise.race([
      ideaSparkService.getPendingIdeas(limit),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      )
    ]) as any[];

    return NextResponse.json({ ideas });
  } catch (error) {
    console.error("Error fetching pending ideas:", error);
    
    // Return empty array instead of error to prevent client crashes
    return NextResponse.json({ 
      ideas: [],
      error: error instanceof Error ? error.message : "Failed to fetch pending ideas"
    });
  }
}


