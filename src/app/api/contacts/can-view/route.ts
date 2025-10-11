import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/features/auth/auth";
import { prisma } from "@/core/database/db";

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
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
        { error: "Only clients can view contact permissions" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const developerId = searchParams.get("developerId");
    const projectId = searchParams.get("projectId");

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

    // Find valid ContactGrant
    let grant = await prisma.contactGrant.findFirst({
      where: {
        clientId: clientProfile.id,
        developerId: developerId,
        projectId: projectId || null,
        OR: [
          { expiresAt: null }, // Permanent grant
          { expiresAt: { gt: new Date() } } // Not expired
        ]
      },
      include: {
        developer: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                phoneE164: true
              }
            }
          }
        }
      }
    });

    // If no grant exists but we have a projectId, check if developer has accepted the project
    if (!grant && projectId) {
      const acceptedAssignment = await prisma.assignmentCandidate.findFirst({
        where: {
          developerId: developerId,
          batch: {
            projectId: projectId
          },
          responseStatus: "accepted"
        },
        include: {
          developer: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                  phoneE164: true
                }
              }
            }
          }
        }
      });

      if (acceptedAssignment) {
        // Create a temporary grant for accepted developers
        grant = {
          clientId: clientProfile.id,
          developerId: developerId,
          projectId: projectId,
          allowEmail: true,
          allowPhone: true,
          allowWhatsApp: true,
          expiresAt: null,
          developer: acceptedAssignment.developer
        } as any;
      }
    }

    if (!grant) {
      return NextResponse.json({
        canView: false
      });
    }

    // Debug log to see what data we're getting
    console.log("Grant data:", {
      developerId: grant.developer.id,
      whatsappNumber: grant.developer.whatsappNumber,
      allowWhatsApp: grant.allowWhatsApp,
      allowPhone: grant.allowPhone,
      phoneE164: grant.developer.user.phoneE164,
      projectId: projectId,
      isTemporaryGrant: !grant.id
    });

    // Return contact information based on grant permissions
    const contactInfo: any = {
      canView: true,
      developer: {
        id: grant.developer.id,
        name: grant.developer.user.name,
        email: grant.allowEmail ? grant.developer.user.email : null,
        image: grant.developer.user.image,
        phone: grant.allowPhone ? grant.developer.user.phoneE164 : null,
        whatsapp: grant.allowWhatsApp ? (grant.developer.whatsappNumber || grant.developer.user.phoneE164) : null
      }
    };

    return NextResponse.json(contactInfo);

  } catch (error) {
    console.error("Error checking contact view permission:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
