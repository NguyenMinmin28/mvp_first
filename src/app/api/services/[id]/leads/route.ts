export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/features/auth/auth";
import { prisma } from "@/core/database/db";
import { notify } from "@/core/services/notify.service";

// Helper function to get client activity logs
async function getClientActivityLogs(clientId: string) {
  try {
    // Get client's project history
    const projects = await (prisma as any).project.findMany({
      where: { clientId },
      select: {
        id: true,
        title: true,
        status: true,
        budget: true,
        skillsRequired: true,
        createdAt: true,
        postedAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10, // Last 10 projects
    });

    // Get client's communication patterns
    const contactReveals = await (prisma as any).contactRevealEvent.findMany({
      where: { clientId },
      select: {
        revealedAt: true,
        channel: true,
        developerId: true,
      },
      orderBy: { revealedAt: 'desc' },
      take: 20, // Last 20 contact reveals
    });

    // Get client's review patterns
    const reviews = await (prisma as any).review.findMany({
      where: { 
        fromUserId: clientId,
        type: "client_for_developer"
      },
      select: {
        rating: true,
        comment: true,
        createdAt: true,
        projectId: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10, // Last 10 reviews
    });

    // Get client's subscription history
    const subscriptions = await (prisma as any).subscription.findMany({
      where: { clientId },
      select: {
        status: true,
        startAt: true,
        currentPeriodEnd: true,
        package: {
          select: {
            name: true,
            projectsPerMonth: true,
          },
        },
      },
      orderBy: { startAt: 'desc' },
      take: 5, // Last 5 subscriptions
    });

    return {
      projects: projects.map((p: any) => ({
        title: p.title,
        status: p.status,
        budget: p.budget,
        skillsCount: p.skillsRequired?.length || 0,
        createdAt: p.createdAt,
        postedAt: p.postedAt,
      })),
      contactPatterns: {
        totalReveals: contactReveals.length,
        preferredChannel: contactReveals.reduce((acc: any, curr: any) => {
          acc[curr.channel] = (acc[curr.channel] || 0) + 1;
          return acc;
        }, {}),
        lastReveal: contactReveals[0]?.revealedAt,
      },
      reviewPatterns: {
        totalReviews: reviews.length,
        averageRating: reviews.length > 0 ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length : 0,
        lastReview: reviews[0]?.createdAt,
      },
      subscriptionHistory: subscriptions.map((s: any) => ({
        packageName: s.package.name,
        projectsPerMonth: s.package.projectsPerMonth,
        status: s.status,
        startAt: s.startAt,
        currentPeriodEnd: s.currentPeriodEnd,
      })),
      summary: {
        totalProjects: projects.length,
        activeProjects: projects.filter((p: any) => ['in_progress', 'accepted'].includes(p.status)).length,
        completedProjects: projects.filter((p: any) => p.status === 'completed').length,
        totalSpent: projects.reduce((sum: number, p: any) => sum + (p.budget || 0), 0),
        preferredSkills: projects.flatMap((p: any) => p.skillsRequired || []).reduce((acc: any, skill: string) => {
          acc[skill] = (acc[skill] || 0) + 1;
          return acc;
        }, {}),
      },
    };
  } catch (error) {
    console.error("Error getting client activity logs:", error);
    return {
      projects: [],
      contactPatterns: { totalReveals: 0, preferredChannel: {}, lastReveal: null },
      reviewPatterns: { totalReviews: 0, averageRating: 0, lastReview: null },
      subscriptionHistory: [],
      summary: { totalProjects: 0, activeProjects: 0, completedProjects: 0, totalSpent: 0, preferredSkills: {} },
    };
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const serviceId = params.id;
    const body = await request.json();
    const { message, budget, description, contactVia = "IN_APP" } = body;

    // Verify service exists and is published
    const service = await (prisma as any).service.findFirst({
      where: {
        id: serviceId,
        status: "PUBLISHED",
        visibility: "PUBLIC",
      },
      include: {
        developer: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    // Check if user already has a lead for this service
    const existingLead = await (prisma as any).serviceLead.findFirst({
      where: {
        serviceId,
        clientId: session.user.id,
      },
    });

    if (existingLead) {
      return NextResponse.json({ error: "Lead already exists" }, { status: 400 });
    }

    // Get client activity logs for sharing
    const clientActivityLogs = await getClientActivityLogs(session.user.id);

    // Create the lead
    const lead = await (prisma as any).serviceLead.create({
      data: {
        serviceId,
        clientId: session.user.id,
        message: message?.trim() || null,
        contactVia,
        status: "NEW",
        // Store activity logs and additional project details in metadata
        metadata: {
          activityLogs: clientActivityLogs,
          budget: budget?.trim() || null,
          description: description?.trim() || null,
          sharedAt: new Date().toISOString(),
        },
      },
    });

    // Create notification for developer using centralized notify service
    await notify({
      type: "SERVICE_LEAD_CREATED",
      actorUserId: session.user.id,
      projectId: undefined,
      payload: {
        serviceId: service.id,
        serviceTitle: service.title,
        leadId: lead.id,
        clientName: session.user.name,
        message: message?.trim() || null,
      },
      recipients: [service.developer.userId],
    });

    return NextResponse.json({
      success: true,
      data: {
        leadId: lead.id,
        message: "Lead created successfully",
      },
    });
  } catch (error) {
    console.error("Error creating service lead:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

