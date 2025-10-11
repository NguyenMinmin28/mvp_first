import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/features/auth/auth";
import { prisma } from "@/core/database/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('search') || '').trim();
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (session.user.role !== "CLIENT") {
      return NextResponse.json(
        { error: "Only clients can view manual invitations" },
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

    // Single query: fetch all candidate messages visible to this client
    // - Direct messages initiated by this client (clientId match)
    // - Any candidates under this client's projects
    const allClientCandidates = await prisma.assignmentCandidate.findMany({
      where: {
        OR: [
          { clientId: clientProfile.id },
          { project: { clientId: clientProfile.id } },
        ],
      },
      include: {
        project: { select: { id: true, title: true } },
        developer: { include: { user: { select: { name: true, email: true } } } }
      },
      orderBy: { assignedAt: "desc" }
    }).catch((error) => {
      console.error("Error fetching assignment candidates:", error);
      // Return empty array if there's an error (e.g., malformed ObjectID)
      return [];
    });

    // Group by project
    // Optional search (fuzzy contains on title/message/description)
    const normalize = (s: any) =>
      String(s || '')
        .normalize('NFD')
        .replace(/\p{Diacritic}+/gu, '')
        .toLowerCase();
    const query = normalize(q);

    const matchesQuery = (inv: any) => {
      if (!query) return true;
      const hay = [
        inv.metadata?.title,
        inv.clientMessage,
        inv.metadata?.description,
        inv.project?.title,
        inv.developer?.user?.name,
      ]
        .map(normalize)
        .join(' ');
      return hay.includes(query);
    };

    const filtered = q ? allClientCandidates.filter(matchesQuery) : allClientCandidates;

    // Get all referenced project IDs and validate ObjectID format
    const referencedProjectIds = filtered
      .map((invitation: any) => invitation.metadata?.selectedProjectId)
      .filter(Boolean)
      .filter((id: string) => {
        // Validate ObjectID format (24 hex characters)
        return /^[0-9a-fA-F]{24}$/.test(id);
      }) as string[];

    // Fetch referenced project details
    const referencedProjects = referencedProjectIds.length > 0 
      ? await prisma.project.findMany({
          where: {
            id: { in: referencedProjectIds },
            clientId: clientProfile.id
          },
          select: {
            id: true,
            title: true
          }
        }).catch((error) => {
          console.error("Error fetching referenced projects:", error);
          // Return empty array if there's an error (e.g., malformed ObjectID)
          return [];
        })
      : [];

    // Create a map for quick lookup
    const referencedProjectMap = referencedProjects.reduce((acc, project) => {
      acc[project.id] = project;
      return acc;
    }, {} as Record<string, { id: string; title: string }>);

    const invitationsByProject = filtered.reduce((acc: any, invitation: any) => {
      const key = invitation.project?.id || 'direct';
      const title = invitation.project?.title || 'Direct Messages';
      if (!acc[key]) {
        acc[key] = { projectId: key, projectTitle: title, invitations: [] };
      }
      acc[key].invitations.push({
        id: invitation.id,
        responseStatus: invitation.responseStatus,
        assignedAt: invitation.assignedAt,
        clientMessage: invitation.clientMessage,
        title: invitation.metadata?.title,
        budget: invitation.metadata?.budget,
        description: invitation.metadata?.description,
        referencedProject: invitation.metadata?.selectedProjectId 
          ? referencedProjectMap[invitation.metadata.selectedProjectId] || null
          : null,
        developer: {
          name: invitation.developer?.user?.name || 'Developer',
          email: invitation.developer?.user?.email || 'No email'
        }
      });
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json({
      success: true,
      data: Object.values(invitationsByProject)
    });

  } catch (error) {
    console.error("Error fetching manual invitations:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');
    console.error("Error message:", error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
