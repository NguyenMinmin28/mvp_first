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
    const currentPlan = subscription?.package?.name || "Free Plan";
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

    console.log(`🔍 Fetching projects for user: ${session.user.id}, role: ${session.user.role}`);

    // Get user's projects based on role
    let projects = [];
    
    if (session.user.role === "CLIENT") {
      // Get client's projects
      const clientProfile = await prisma.clientProfile.findUnique({
        where: { userId: session.user.id }
      });

      if (clientProfile) {
        console.log(`🔍 Found client profile: ${clientProfile.id}`);
        projects = await prisma.project.findMany({
          where: { clientId: clientProfile.id },
          orderBy: { postedAt: "desc" },
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            postedAt: true,
            budgetMin: true,
            currency: true,
            skillsRequired: true,
            _count: {
              select: {
                assignmentCandidates: true
              }
            }
          }
        });
        console.log(`🔍 Found ${projects.length} projects for client`);
      } else {
        console.log(`❌ No client profile found for user: ${session.user.id}`);
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
          orderBy: { assignedAt: "desc" }
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
        candidatesCount: project._count?.assignmentCandidates || 0,
        assignmentStatus: project.assignmentStatus
      };
    });

    console.log(`✅ Returning ${transformedProjects.length} transformed projects`);
    
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
    const { title, description, skillsRequired, budget, budgetMin, budgetMax, currency, paymentMethod, startDate, endDate } = body;

    // Basic presence validation
    if (!title?.trim() || !description?.trim() || !Array.isArray(skillsRequired) || skillsRequired.length === 0) {
      return NextResponse.json(
        { error: "Title, description, and at least one skill are required" },
        { status: 400 }
      );
    }

    // Sanitize and enforce length limits to reduce injection payloads
    const sanitizedTitle = String(title).trim().replace(/[\u0000-\u001F\u007F]/g, "");
    const sanitizedDescription = String(description).trim().replace(/[\u0000-\u001F\u007F]/g, "");
    if (sanitizedTitle.length === 0 || sanitizedTitle.length > 200) {
      return NextResponse.json(
        { error: "Title must be between 1 and 200 characters" },
        { status: 400 }
      );
    }
    if (sanitizedDescription.length > 5000) {
      return NextResponse.json(
        { error: "Description is too long (max 5000 characters)" },
        { status: 400 }
      );
    }
    if (skillsRequired.length > 20) {
      return NextResponse.json(
        { error: "Too many skills selected (max 20)" },
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

    // Validate currency if provided (whitelist)
    const allowedCurrencies = new Set([
      "USD", "VND", "EUR", "GBP", "JPY", "CAD", "AUD", "SGD", "KRW", "INR",
      "NZD", "HKD", "CHF", "SEK", "NOK", "DKK", "PLN", "CZK", "HUF", "BRL",
      "MXN", "ZAR", "TRY", "RUB", "CNY", "THB", "MYR", "IDR", "PHP"
    ]);
    let finalCurrency: string | undefined = undefined;
    if (currency) {
      const c = String(currency).toUpperCase();
      if (!allowedCurrencies.has(c)) {
        return NextResponse.json(
          { error: "Unsupported currency" },
          { status: 400 }
        );
      }
      finalCurrency = c;
    }

    // Validate budget range if provided
    let finalBudgetMin: number | undefined = undefined;
    let finalBudgetMax: number | undefined = undefined;
    if (budgetMin !== undefined && budgetMin !== null && `${budgetMin}`.trim() !== "") {
      const n = Number(budgetMin);
      if (!Number.isFinite(n) || n < 0) {
        return NextResponse.json(
          { error: "budgetMin must be a non-negative number" },
          { status: 400 }
        );
      }
      finalBudgetMin = Math.round(n * 100) / 100;
    }
    if (budgetMax !== undefined && budgetMax !== null && `${budgetMax}`.trim() !== "") {
      const n = Number(budgetMax);
      if (!Number.isFinite(n) || n < 0) {
        return NextResponse.json(
          { error: "budgetMax must be a non-negative number" },
          { status: 400 }
        );
      }
      finalBudgetMax = Math.round(n * 100) / 100;
    }
    if (finalBudgetMin !== undefined && finalBudgetMax !== undefined && finalBudgetMin > finalBudgetMax) {
      return NextResponse.json(
        { error: "budgetMin cannot be greater than budgetMax" },
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
      title: sanitizedTitle,
      description: sanitizedDescription,
      skillsRequired: skillsRequired,
      status: "submitted",
    };
    if (finalBudgetMin !== undefined) data.budgetMin = finalBudgetMin;
    if (finalBudgetMax !== undefined) data.budgetMax = finalBudgetMax;
    if (finalCurrency) data.currency = finalCurrency;
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

    // Kick off initial batch generation in the background (don't block redirect)
    (async () => {
      try {
        await RotationService.generateBatch(project.id);
        console.log(`✅ Background batch generation started for project ${project.id}`);
      } catch (batchError) {
        console.error("Failed to generate batch in background:", batchError);
      }
    })();

    // Return immediately so client can route to project detail page
    return NextResponse.json({
      id: project.id,
      title: project.title,
      description: project.description,
      skillsRequired: project.skillsRequired,
      status: project.status,
      batchStarted: true,
    });

  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
