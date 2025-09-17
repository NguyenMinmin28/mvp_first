export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
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

    const serviceId = params.id;
    const body = await request.json();
    const { message, contactVia = "IN_APP" } = body;

    // Verify service exists and is published
    const service = await prisma.service.findFirst({
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
    const existingLead = await prisma.serviceLead.findFirst({
      where: {
        serviceId,
        clientId: session.user.id,
      },
    });

    if (existingLead) {
      return NextResponse.json({ error: "Lead already exists" }, { status: 400 });
    }

    // Create the lead
    const lead = await prisma.serviceLead.create({
      data: {
        serviceId,
        clientId: session.user.id,
        message: message?.trim() || null,
        contactVia,
        status: "NEW",
      },
    });

    // Create notification for developer
    await prisma.notification.create({
      data: {
        userId: service.developer.userId,
        type: "SERVICE_LEAD_CREATED",
        title: "New Lead Received",
        body: `You have a new lead for "${service.title}"`,
        dataJson: {
          serviceId: service.id,
          serviceTitle: service.title,
          leadId: lead.id,
          clientName: session.user.name,
          message: message?.trim() || null,
        },
      },
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

