import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/auth";
import { prisma } from "@/core/database/db";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const userId = params.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        clientProfile: true,
        developerProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // Clear sessions/accounts
      await tx.session.deleteMany({ where: { userId } });
      await tx.account.deleteMany({ where: { userId } });

      // IdeaSpark related content by user
      await tx.ideaApprovalEvent.deleteMany({ where: { adminId: userId } });
      await tx.ideaConnect.deleteMany({ where: { fromUserId: userId } });
      await tx.ideaComment.deleteMany({ where: { userId } });
      await tx.ideaBookmark.deleteMany({ where: { userId } });
      await tx.ideaLike.deleteMany({ where: { userId } });
      await tx.sparkPointLedger.deleteMany({ where: { userId } });
      await tx.ideaReport.deleteMany({ where: { reporterId: userId } });

      // Files owned by user
      await tx.file.deleteMany({ where: { ownerId: userId } });

      // Follows and notifications
      await tx.follow.deleteMany({ where: { OR: [{ followerId: userId }, { followingId: userId }] } });
      await tx.followNotification.deleteMany({ where: { OR: [{ followerId: userId }, { developerId: userId }] } });
      await tx.notificationUser.deleteMany({ where: { userId } });

      // Service-related user interactions
      await tx.serviceFavorite.deleteMany({ where: { userId } });
      await tx.serviceLike.deleteMany({ where: { userId } });
      await tx.serviceLead.deleteMany({ where: { clientId: userId } });

      // Reviews involving the user
      await tx.review.deleteMany({ where: { OR: [{ fromUserId: userId }, { toUserId: userId }, { moderatedByAdminId: userId }] } });

      // Progress updates authored by the user
      await tx.projectProgressUpdate.deleteMany({ where: { authorId: userId } });

      // If client profile exists, cascade its relations
      if (user.clientProfile) {
        const clientId = user.clientProfile.id;

        // Subscriptions and usages
        const subs = await tx.subscription.findMany({ where: { clientId }, select: { id: true } });
        const subIds = subs.map((s) => s.id);
        if (subIds.length) {
          await tx.subscriptionUsage.deleteMany({ where: { subscriptionId: { in: subIds } } });
        }
        await tx.payment.deleteMany({ where: { clientId } });
        await tx.subscription.deleteMany({ where: { clientId } });

        // Client favorites and grants/reveals/candidates/projects pointers
        await tx.favoriteDeveloper.deleteMany({ where: { clientId } });
        await tx.contactGrant.deleteMany({ where: { clientId } });
        await tx.contactRevealEvent.deleteMany({ where: { clientId } });
        await tx.assignmentCandidate.deleteMany({ where: { clientId } });

        // Projects owned by client: delete project-linked data first
        const projects = await tx.project.findMany({ where: { clientId }, select: { id: true } });
        const projectIds = projects.map((p) => p.id);
        if (projectIds.length) {
          await tx.assignmentBatch.deleteMany({ where: { projectId: { in: projectIds } } });
          await tx.projectProgressUpdate.deleteMany({ where: { projectId: { in: projectIds } } });
          await tx.review.deleteMany({ where: { projectId: { in: projectIds } } });
          await tx.project.deleteMany({ where: { id: { in: projectIds } } });
        }

        // Finally delete client profile
        await tx.clientProfile.delete({ where: { id: clientId } });
      }

      // If developer profile exists, cascade its relations
      if (user.developerProfile) {
        const developerId = user.developerProfile.id;

        await tx.developerSkill.deleteMany({ where: { developerProfileId: developerId } });
        await tx.rotationCursor.deleteMany({ where: { lastDeveloperId: developerId } });
        await tx.assignmentCandidate.deleteMany({ where: { developerId } });
        await tx.contactGrant.deleteMany({ where: { developerId } });
        await tx.contactRevealEvent.deleteMany({ where: { developerId } });
        await tx.favoriteDeveloper.deleteMany({ where: { developerId } });
        await tx.portfolio.deleteMany({ where: { developerId } });
        await tx.developerActivityLog.deleteMany({ where: { developerId } });

        // Services owned by developer
        await tx.service.deleteMany({ where: { developerId } });

        // Remove developer from projects where revealed (handled by deletes above on project)

        // Finally delete developer profile
        await tx.developerProfile.delete({ where: { id: developerId } });
      }

      // If the user authored Ideas, delete them last so their dependent rows are already removed
      await tx.idea.deleteMany({ where: { authorId: userId } });

      // Finally delete the user
      await tx.user.delete({ where: { id: userId } });
    }, { timeout: 60000 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


