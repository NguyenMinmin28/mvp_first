import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/features/auth/auth";
import { prisma } from "@/core/database/db";
import { RotationService } from "@/core/services/rotation.service";
import { billingService } from "@/modules/billing/billing.service";
import { notify } from "@/core/services/notify.service";

/**
 * Send quota exceeded notification to user (only once per quota period)
 */
async function sendQuotaExceededNotification(userId: string, clientProfileId: string) {
  try {
    console.log(`🔔 Attempting to send quota notification to user ${userId}, client ${clientProfileId}`);
    
    // Get current subscription info for the notification
    const subscription = await billingService.getActiveSubscription(clientProfileId);
    const currentPlan = subscription?.package?.name || "Basic Plan";
    const projectLimit = subscription?.package?.projectsPerMonth || 1;

    console.log(`📊 Current plan: ${currentPlan}, limit: ${projectLimit}`);

    // Send notification (the notify service will handle deduplication)
    const notificationId = await notify({
      type: "quota.project_limit_reached",
      actorUserId: userId,
      payload: {
        message: "You've reached your project posting limit",
        description: `You've used all ${projectLimit} project(s) available in your ${currentPlan}. Upgrade your plan to post more projects.`,
        currentPlan,
        projectLimit,
        upgradeUrl: "/pricing"
      },
      recipients: [userId]
    });

    console.log(`✅ Quota exceeded notification sent successfully! ID: ${notificationId}`);
  } catch (error) {
    console.error("❌ Failed to send quota exceeded notification:", error);
    // Don't throw error - notification failure shouldn't break project creation flow
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get user's projects based on role
    let projects = [];
    
    if (session.user.role === "CLIENT") {
      // Get client's projects
      const clientProfile = await prisma.clientProfile.findUnique({
        where: { userId: session.user.id }
      });

      if (clientProfile) {
        projects = await prisma.project.findMany({
          where: { clientId: clientProfile.id },
          orderBy: { postedAt: "desc" },
          take: 20,
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            postedAt: true,
            budgetMin: true,
            currency: true,
            skillsRequired: true
          }
        });
      }
    } else if (session.user.role === "DEVELOPER") {
      // Get developer's assigned projects
      const developerProfile = await prisma.developerProfile.findUnique({
        where: { userId: session.user.id }
      });

      if (developerProfile) {
        const assignments = await prisma.assignmentCandidate.findMany({
          where: { developerId: developerProfile.id },
          include: {
            project: {
              select: {
                id: true,
                title: true,
                description: true,
                status: true,
                postedAt: true,
                budgetMin: true,
                currency: true,
                skillsRequired: true
              }
            }
          },
          orderBy: { assignedAt: "desc" },
          take: 20
        });
        
        projects = assignments.map((assignment: any) => ({
          ...assignment.project,
          assignmentStatus: assignment.responseStatus
        }));
      }
    }

    // Transform projects to match the expected format
    const transformedProjects = projects.map((project: any) => {
      return {
        id: project.id,
        name: project.title,
        description: project.description,
        status: project.status, // Keep original status from database
        date: project.postedAt ? project.postedAt.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric"
        }) : "Unknown",
        budget: project.budgetMin,
        currency: project.currency,
        skills: project.skillsRequired,
        assignmentStatus: project.assignmentStatus
      };
    });

    return NextResponse.json({
      projects: transformedProjects
    });

  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (session.user.role !== "CLIENT") {
      return NextResponse.json(
        { error: "Only clients can post projects" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, skillsRequired, budget, currency, paymentMethod, startDate, endDate } = body;

    // Validation
    if (!title?.trim() || !description?.trim() || !Array.isArray(skillsRequired) || skillsRequired.length === 0) {
      return NextResponse.json(
        { error: "Title, description, and at least one skill are required" },
        { status: 400 }
      );
    }

    // Validate payment method if provided
    if (paymentMethod && !["hourly", "fixed"].includes(paymentMethod)) {
      return NextResponse.json(
        { error: "Payment method must be either 'hourly' or 'fixed'" },
        { status: 400 }
      );
    }

    // Get client profile
    const clientProfile = await prisma.clientProfile.findUnique({
      where: { userId: session.user.id }
    });

    if (!clientProfile) {
      return NextResponse.json(
        { error: "Client profile not found" },
        { status: 404 }
      );
    }

    // Check if user can post project (billing quota check)
    const quotaCheck = await billingService.canPostProject(clientProfile.id);
    console.log(`🔍 Quota check result:`, quotaCheck);
    
    if (!quotaCheck.allowed) {
      console.log(`🚫 Quota exceeded! Sending notification to user ${session.user.id}`);
      // Send notification to user about quota exceeded (only once per period)
      await sendQuotaExceededNotification(session.user.id, clientProfile.id);
      
      const response = NextResponse.json(
        {
          error: "Project limit reached",
          message: quotaCheck.reason || "You have reached your project posting limit for this period.",
          code: "QUOTA_EXCEEDED",
          remaining: quotaCheck.remaining,
        },
        { status: 402 } // Payment Required
      );
      
      // Add debug header
      response.headers.set('X-Debug-Quota-Exceeded', 'true');
      response.headers.set('X-Debug-User-ID', session.user.id);
      
      return response;
    }

    // Verify skills exist
    const validSkills = await prisma.skill.findMany({
      where: { id: { in: skillsRequired } },
      select: { id: true }
    });

    if (validSkills.length !== skillsRequired.length) {
      return NextResponse.json(
        { error: "Some selected skills are invalid" },
        { status: 400 }
      );
    }

    // Create project
    const data: any = {
      clientId: clientProfile.id,
      title: title.trim(),
      description: description.trim(),
      skillsRequired: skillsRequired,
      status: "submitted",
    };
    if (budget) data.budgetMin = Number(budget);
    if (currency) data.currency = String(currency).toUpperCase();
    if (paymentMethod) data.paymentMethod = String(paymentMethod);
    if (startDate) data.expectedStartAt = new Date(startDate);
    if (endDate) data.expectedEndAt = new Date(endDate);

    const project = await prisma.project.create({
      data,
    });

    // Increment project usage after successful creation
    try {
      await billingService.incrementProjectUsage(clientProfile.id);
    } catch (usageError) {
      console.error("Failed to increment project usage:", usageError);
      // Don't fail the project creation if usage tracking fails
    }

    // Generate initial batch using rotation service
    try {
      const batchResult = await RotationService.generateBatch(project.id);
      
      return NextResponse.json({
        id: project.id,
        title: project.title,
        description: project.description,
        skillsRequired: project.skillsRequired,
        status: project.status,
        batchId: batchResult.batchId,
        candidatesCount: batchResult.candidates.length,
      });
    } catch (batchError) {
      console.error("Failed to generate batch:", batchError);
      
      // If batch generation fails, still return project but with a warning
      return NextResponse.json({
        id: project.id,
        title: project.title,
        description: project.description,
        skillsRequired: project.skillsRequired,
        status: project.status,
        warning: "Project created but no eligible developers found. Please try refreshing later.",
      });
    }

  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
