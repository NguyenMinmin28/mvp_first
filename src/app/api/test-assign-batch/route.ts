import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/features/auth/auth";
import { prisma } from "@/core/database/db";
import { notify } from "@/core/services/notify.service";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "DEVELOPER") {
      return NextResponse.json({ error: "Only developers can test batch assignment" }, { status: 403 });
    }

    // Get developer profile
    const developerProfile = await prisma.developerProfile.findUnique({
      where: { userId: session.user.id },
      include: { user: true }
    });

    if (!developerProfile) {
      return NextResponse.json({ error: "Developer profile not found" }, { status: 404 });
    }

    // Create a fake project for testing
    const fakeProject = await prisma.project.create({
      data: {
        title: "Test Project - Batch Assignment",
        description: "This is a test project to simulate batch assignment notification",
        budget: 1000,
        currency: "USD",
        skillsRequired: [],
        clientId: "68adc4abff8c658b15aa348d", // Use a real client ID
        status: "assigning",
      }
    });

    // Create a fake batch (selection is required)
    const fakeBatch = await prisma.assignmentBatch.create({
      data: {
        projectId: fakeProject.id,
        batchNumber: 1,
        selection: {
          skillIds: [],
          fresherCount: 0,
          midCount: 1,
          expertCount: 0,
        },
        status: "active",
      },
    });

    // Create assignment candidate for the current developer
    const assignmentCandidate = await prisma.assignmentCandidate.create({
      data: {
        projectId: fakeProject.id,
        batchId: fakeBatch.id,
        developerId: developerProfile.id,
        level: "MID",
        responseStatus: "pending",
        acceptanceDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        assignedAt: new Date(),
        usualResponseTimeMsSnapshot: 3600000 // 1 hour
      }
    });

    // Send notification to developer
    await notify({
      type: "assignment.new_batch_assigned",
      actorUserId: session.user.id,
      projectId: fakeProject.id,
      payload: {
        projectId: fakeProject.id,
        projectTitle: fakeProject.title,
        batchId: fakeBatch.id,
        assignmentId: assignmentCandidate.id,
        acceptanceDeadline: assignmentCandidate.acceptanceDeadline.toISOString()
      },
      recipients: [session.user.id],
    });

    console.log(`✅ Test batch assignment created for developer ${developerProfile.user.email}`);
    console.log(`📧 Notification sent for project: ${fakeProject.title}`);

    return NextResponse.json({
      success: true,
      message: "Test batch assignment created successfully",
      data: {
        project: {
          id: fakeProject.id,
          title: fakeProject.title
        },
        batch: {
          id: fakeBatch.id
        },
        assignment: {
          id: assignmentCandidate.id,
          acceptanceDeadline: assignmentCandidate.acceptanceDeadline
        }
      }
    });

  } catch (error) {
    console.error("Error creating test batch assignment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
