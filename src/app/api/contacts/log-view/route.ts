import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/features/auth/auth";
import { prisma } from "@/core/database/db";

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
        { error: "Only clients can log contact views" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { developerId, projectId, context } = body;

    if (!developerId) {
      return NextResponse.json(
        { error: "developerId is required" },
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

    // Find the ContactGrant that allows this view
    const grant = await prisma.contactGrant.findFirst({
      where: {
        clientId: clientProfile.id,
        developerId: developerId,
        projectId: projectId || null,
        OR: [
          { expiresAt: null }, // Permanent grant
          { expiresAt: { gt: new Date() } } // Not expired
        ]
      }
    });

    if (!grant) {
      return NextResponse.json(
        { error: "No valid contact grant found" },
        { status: 403 }
      );
    }

    // Log the contact view
    await prisma.contactViewLog.create({
      data: {
        grantId: grant.id,
        viewerId: clientProfile.id,
        developerId: developerId,
        projectId: projectId || null,
        context: context || null
      }
    });

    return NextResponse.json({
      success: true,
      message: "Contact view logged successfully"
    });

  } catch (error) {
    console.error("Error logging contact view:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
