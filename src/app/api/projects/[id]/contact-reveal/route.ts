import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/auth";
import { prisma } from "@/core/database/db";
import { requireContactRevealQuota, incrementUsageAfterSuccess } from "@/modules/billing/gating.middleware";
import { billingService } from "@/modules/billing/billing.service";
import { logger } from "@/lib/logger";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  try {
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projectId = params.id;

    // Apply gating for contact reveal quota
    const gateResult = await requireContactRevealQuota(request, projectId);
    if (gateResult) {
      return gateResult; // Quota exceeded or no subscription
    }

    const correlationId = logger.generateCorrelationId();
    
    logger.info("Contact reveal requested", {
      correlationId,
      projectId,
      userId: session.user.id
    });

    // Perform the contact reveal operation
    const result = await incrementUsageAfterSuccess(
      async () => {
        return await prisma.$transaction(async (tx: any) => {
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
              batchId: project.currentBatch!.id,
              channel: "email", // Default to email reveal
              ip,
              userAgent,
              countsAgainstLimit: true, // This will count against quota
            },
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
      },
      // Increment usage after successful reveal
      async () => {
        const clientProfile = await prisma.clientProfile.findFirst({
          where: { userId: session.user.id }
        });
        
        if (clientProfile) {
          await billingService.incrementContactRevealUsage(clientProfile.id, projectId);
        }
      },
      "Failed to reveal contact"
    );

    logger.info("Contact reveal completed successfully", {
      correlationId,
      projectId,
      userId: session.user.id,
      isFirstReveal: result.isFirstReveal
    });

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error) {
    logger.error("Contact reveal failed", error as Error, {
      projectId: params.id,
      userId: session?.user?.id
    });

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