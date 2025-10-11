import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/features/auth/auth";
import { prisma } from "@/core/database/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    console.log("🔍 Client projects API called");
    console.log("🔍 Session:", session?.user ? { id: session.user.id, role: session.user.role } : "No session");
    
    if (!session?.user?.id) {
      console.log("❌ No session or user ID");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (session.user.role !== "CLIENT") {
      console.log("❌ User is not a client:", session.user.role);
      return NextResponse.json(
        { error: "Only clients can access this endpoint" },
        { status: 403 }
      );
    }

    // Get client profile
    console.log("🔍 Getting client profile for user:", session.user.id);
    const clientProfile = await prisma.clientProfile.findUnique({
      where: { userId: session.user.id }
    });

    if (!clientProfile) {
      console.log("❌ Client profile not found for user:", session.user.id);
      return NextResponse.json(
        { error: "Client profile not found" },
        { status: 404 }
      );
    }

    console.log("✅ Client profile found:", clientProfile.id);

    // First, let's see ALL projects for this client
    console.log(`🔍 Fetching ALL projects for client: ${clientProfile.id}`);
    const allProjects = await prisma.project.findMany({
      where: { 
        clientId: clientProfile.id
      },
      select: {
        id: true,
        title: true,
        description: true,
        budgetMin: true,
        currency: true,
        skillsRequired: true,
        postedAt: true,
        status: true,
        _count: {
          select: {
            assignmentCandidates: true
          }
        }
      },
      orderBy: { postedAt: "desc" }
    });

    console.log(`🔍 Found ${allProjects.length} total projects for client`);
    console.log("🔍 All projects:", allProjects.map(p => ({ id: p.id, title: p.title, status: p.status })));

    // Now filter to show only active projects (not completed or canceled)
    const projects = allProjects.filter(project => 
      project.status !== "completed" && project.status !== "canceled"
    );

    console.log(`✅ Filtered to ${projects.length} active projects`);
    console.log("✅ Active projects:", projects.map(p => ({ id: p.id, title: p.title, status: p.status })));

    return NextResponse.json({
      projects: projects.map(project => ({
        id: project.id,
        title: project.title,
        description: project.description,
        budgetMin: project.budgetMin,
        currency: project.currency,
        skillsRequired: project.skillsRequired,
        postedAt: project.postedAt,
        candidateCount: project._count.assignmentCandidates
      }))
    });

  } catch (error) {
    console.error("Error fetching client projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}
