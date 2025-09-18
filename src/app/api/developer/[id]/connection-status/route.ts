import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/auth";
import { prisma } from "@/core/database/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "CLIENT") {
      return NextResponse.json({ error: "Only clients can check connection status" }, { status: 403 });
    }

    const developerId = params.id;
    const clientId = session.user.id;

    // Check if there's any connection between client and developer
    // This could be through:
    // 1. Contact reveal events
    // 2. Project assignments
    // 3. Direct connections (if implemented)

    // Check contact reveal events
    const contactReveal = await prisma.contactRevealEvent.findFirst({
      where: {
        clientId,
        developerId,
      },
      orderBy: {
        revealedAt: "desc",
      },
    });

    // Check if client has any projects with this developer
    const projectConnection = await prisma.project.findFirst({
      where: {
        clientId,
        contactRevealedDeveloperId: developerId,
        contactRevealEnabled: true,
      },
    });

    // Check if there are any direct connections (if you have a connections table)
    // const directConnection = await prisma.connection.findFirst({
    //   where: {
    //     OR: [
    //       { clientId, developerId },
    //       { clientId: developerId, developerId: clientId }
    //     ],
    //     status: "connected"
    //   }
    // });

    const isConnected = !!(contactReveal || projectConnection);

    return NextResponse.json({
      isConnected,
      connectionType: contactReveal ? "contact_revealed" : projectConnection ? "project_assigned" : null,
      connectedAt: contactReveal?.revealedAt || projectConnection?.createdAt || null,
    });

  } catch (error) {
    console.error("Error checking connection status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
