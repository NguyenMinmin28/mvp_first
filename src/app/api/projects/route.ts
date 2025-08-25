import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/features/auth/auth";
import { prisma } from "@/core/database/db";
import { RotationService } from "@/core/services/rotation.service";

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
    const { title, description, skillsRequired } = body;

    // Validation
    if (!title?.trim() || !description?.trim() || !Array.isArray(skillsRequired) || skillsRequired.length === 0) {
      return NextResponse.json(
        { error: "Title, description, and at least one skill are required" },
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
    const project = await prisma.project.create({
      data: {
        clientId: clientProfile.id,
        title: title.trim(),
        description: description.trim(),
        skillsRequired: skillsRequired,
        status: "submitted",
        postedAt: new Date(),
      },
    });

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
