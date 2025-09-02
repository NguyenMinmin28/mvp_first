import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/auth";
import { IdeaSparkService } from "@/core/services/ideaspark.service";

const ideaSparkService = new IdeaSparkService();

export async function PATCH(
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
    const { adminTags } = body;

    if (!adminTags || !Array.isArray(adminTags)) {
      return NextResponse.json(
        { error: "Admin tags array is required" },
        { status: 400 }
      );
    }

    const idea = await ideaSparkService.updateIdeaTags(
      params.id,
      session.user.id,
      adminTags
    );

    return NextResponse.json(idea);
  } catch (error) {
    console.error("Error updating idea tags:", error);
    return NextResponse.json(
      { error: "Failed to update idea tags" },
      { status: 500 }
    );
  }
}


