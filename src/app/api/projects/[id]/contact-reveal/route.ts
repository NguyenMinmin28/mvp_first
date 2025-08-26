import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/auth";
import { prisma } from "@/core/database/db";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projectId = params.id;

    console.log("🔄 Client revealing contact for project:", projectId, "by user:", session.user.id);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Find and validate project
      const project = await tx.project.findUnique({
        where: { id: projectId },
        include: {
          client: { include: { user: true } },
          contactRevealedDeveloper: {
            include: { user: true }
          },
          currentBatch: true,
        },
      });

      if (!project) {
        throw new Error("Project not found");
      }

      // 2. Validate access
      if (project.client.userId !== session.user.id) {
        throw new Error("You can only reveal contact for your own projects");
      }

      if (!project.contactRevealEnabled) {
        throw new Error("Contact reveal is not enabled for this project. No developer has accepted yet.");
      }

      if (!project.contactRevealedDeveloperId || !project.contactRevealedDeveloper) {
        throw new Error("No developer assigned to this project");
      }

      // 3. Check if already revealed (optional - allow multiple reveals)
      const existingReveal = await tx.contactRevealEvent.findFirst({
        where: {
          projectId,
          clientId: project.clientId,
          developerId: project.contactRevealedDeveloperId,
        },
        orderBy: { revealedAt: "desc" },
      });

      // 4. Get client IP and user agent
      const ip = request.headers.get("x-forwarded-for") || 
                request.headers.get("x-real-ip") || 
                "unknown";
      const userAgent = request.headers.get("user-agent") || "unknown";

      // 5. Create contact reveal event
      const revealEvent = await tx.contactRevealEvent.create({
        data: {
          projectId,
          clientId: project.clientId,
          developerId: project.contactRevealedDeveloperId,
          batchId: project.currentBatchId!,
          channel: "whatsapp", // Default channel
          revealedAt: new Date(),
          countsAgainstLimit: true, // Will be used for subscription quota
          ip,
          userAgent,
        },
      });

      // 6. TODO: Check and update subscription quota here
      // await this.updateSubscriptionQuota(tx, project.clientId);

      console.log("✅ Contact revealed successfully:", {
        projectId,
        developerId: project.contactRevealedDeveloperId,
        revealEventId: revealEvent.id,
        isFirstReveal: !existingReveal,
      });

      return {
        revealEvent,
        developer: {
          id: project.contactRevealedDeveloper.id,
          name: project.contactRevealedDeveloper.user.name,
          email: project.contactRevealedDeveloper.user.email,
          whatsappNumber: project.contactRevealedDeveloper.whatsappNumber,
          whatsappVerified: project.contactRevealedDeveloper.whatsappVerified,
          linkedinUrl: project.contactRevealedDeveloper.linkedinUrl,
          usualResponseTimeMs: project.contactRevealedDeveloper.usualResponseTimeMs,
          level: project.contactRevealedDeveloper.level,
        },
        project: {
          id: project.id,
          title: project.title,
          status: project.status,
        },
        isFirstReveal: !existingReveal,
        message: existingReveal 
          ? "Contact information retrieved again"
          : "Contact information revealed successfully!",
      };
    });

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error("❌ Error revealing contact:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
