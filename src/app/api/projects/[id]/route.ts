import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/features/auth/auth";
import { prisma } from "@/core/database/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
        { error: "Only clients can view project details" },
        { status: 403 }
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

    // Get project with comprehensive details including skill names
    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        clientId: clientProfile.id
      },
      select: {
        id: true,
        title: true,
        description: true,
        budget: true,
        budgetMin: true,
        budgetMax: true,
        currency: true,
        paymentMethod: true,
        skillsRequired: true,
        expectedStartAt: true,
        expectedEndAt: true,
        status: true,
        postedAt: true,
        _count: {
          select: {
            assignmentCandidates: true
          }
        }
      }
    });

    // Fetch skill names from skill IDs
    let skillNames: string[] = [];
    if (project && project.skillsRequired && project.skillsRequired.length > 0) {
      const skills = await prisma.skill.findMany({
        where: {
          id: { in: project.skillsRequired }
        },
        select: {
          id: true,
          name: true
        }
      });
      skillNames = skills.map(skill => skill.name);
    }

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Transform the project data to match our interface
    const projectData = {
      id: project.id,
      title: project.title,
      description: project.description,
      budget: project.budget,
      budgetMin: project.budgetMin,
      budgetMax: project.budgetMax,
      currency: project.currency,
      paymentMethod: project.paymentMethod,
      skillsRequired: skillNames, // Use skill names instead of IDs
      expectedStartAt: project.expectedStartAt?.toISOString(),
      expectedEndAt: project.expectedEndAt?.toISOString(),
      status: project.status,
      postedAt: project.postedAt?.toISOString(),
      candidateCount: project._count.assignmentCandidates
    };

    return NextResponse.json({
      success: true,
      project: projectData
    });

  } catch (error) {
    console.error("Error fetching project details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (session.user.role !== "CLIENT") {
      return NextResponse.json({ error: "Only clients can edit projects" }, { status: 403 });
    }

    const clientProfile = await prisma.clientProfile.findUnique({
      where: { userId: session.user.id }
    });
    if (!clientProfile) {
      return NextResponse.json({ error: "Client profile not found" }, { status: 404 });
    }

    const existing = await prisma.project.findFirst({
      where: { id: params.id, clientId: clientProfile.id },
      select: { id: true, status: true }
    });
    if (!existing) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Allow editing for most states except completed/canceled
    if (["completed", "canceled"].includes(String(existing.status))) {
      return NextResponse.json(
        { error: "This project can no longer be edited" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      budgetMin,
      budgetMax,
      currency,
      paymentMethod,
      expectedStartAt,
      expectedEndAt,
    } = body || {};

    const updateData: any = {};

    if (typeof title === "string") {
      const sanitizedTitle = title.trim().replace(/[\u0000-\u001F\u007F]/g, "");
      if (sanitizedTitle.length === 0 || sanitizedTitle.length > 200) {
        return NextResponse.json(
          { error: "Title must be between 1 and 200 characters" },
          { status: 400 }
        );
      }
      updateData.title = sanitizedTitle;
    }

    if (typeof description === "string") {
      const sanitizedDescription = description.trim().replace(/[\u0000-\u001F\u007F]/g, "");
      if (sanitizedDescription.length > 5000) {
        return NextResponse.json(
          { error: "Description is too long (max 5000 characters)" },
          { status: 400 }
        );
      }
      updateData.description = sanitizedDescription;
    }

    if (budgetMin !== undefined) {
      const n = Number(budgetMin);
      if (!Number.isFinite(n) || n < 0) {
        return NextResponse.json({ error: "Invalid budgetMin" }, { status: 400 });
      }
      updateData.budgetMin = n;
    }
    if (budgetMax !== undefined) {
      const n = Number(budgetMax);
      if (!Number.isFinite(n) || n < 0) {
        return NextResponse.json({ error: "Invalid budgetMax" }, { status: 400 });
      }
      updateData.budgetMax = n;
    }
    if (updateData.budgetMin !== undefined && updateData.budgetMax !== undefined) {
      if (updateData.budgetMax < updateData.budgetMin) {
        return NextResponse.json({ error: "budgetMax must be >= budgetMin" }, { status: 400 });
      }
    }

    if (currency !== undefined) {
      if (typeof currency !== "string" || currency.length < 3 || currency.length > 5) {
        return NextResponse.json({ error: "Invalid currency" }, { status: 400 });
      }
      updateData.currency = currency;
    }

    if (paymentMethod !== undefined) {
      if (!["hourly", "fixed", null].includes(paymentMethod)) {
        return NextResponse.json(
          { error: "Payment method must be either 'hourly' or 'fixed'" },
          { status: 400 }
        );
      }
      updateData.paymentMethod = paymentMethod;
    }

    if (expectedStartAt !== undefined) {
      const d = expectedStartAt ? new Date(expectedStartAt) : null;
      if (d && !Number.isFinite(d.getTime())) {
        return NextResponse.json({ error: "Invalid expectedStartAt" }, { status: 400 });
      }
      updateData.expectedStartAt = d as any;
    }
    if (expectedEndAt !== undefined) {
      const d = expectedEndAt ? new Date(expectedEndAt) : null;
      if (d && !Number.isFinite(d.getTime())) {
        return NextResponse.json({ error: "Invalid expectedEndAt" }, { status: 400 });
      }
      updateData.expectedEndAt = d as any;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const updated = await prisma.project.update({
      where: { id: params.id },
      data: {
        ...updateData,
      },
      select: {
        id: true,
        title: true,
        description: true,
        budgetMin: true,
        budgetMax: true,
        currency: true,
        paymentMethod: true,
        expectedStartAt: true,
        expectedEndAt: true,
        status: true,
      }
    });

    return NextResponse.json({
      success: true,
      project: {
        ...updated,
        expectedStartAt: updated.expectedStartAt?.toISOString(),
        expectedEndAt: updated.expectedEndAt?.toISOString(),
      }
    });
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
