import { NextRequest, NextResponse } from "next/server";
import { getServerSessionUser } from "@/features/auth/auth-server";
import { prisma } from "@/core/database/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getServerSessionUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { whatsappVerified } = await request.json();
    
    if (typeof whatsappVerified !== "boolean") {
      return NextResponse.json({ 
        error: "Invalid whatsappVerified value. Must be boolean." 
      }, { status: 400 });
    }

    const developerId = params.id;

    // Check if developer exists
    const developer = await prisma.developerProfile.findUnique({
      where: { id: developerId },
      include: { user: true }
    });

    if (!developer) {
      return NextResponse.json({ error: "Developer not found" }, { status: 404 });
    }

    // Update WhatsApp verification status
    const updatedDeveloper = await prisma.developerProfile.update({
      where: { id: developerId },
      data: { 
        whatsappVerified,
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phoneE164: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: `WhatsApp verification ${whatsappVerified ? 'enabled' : 'disabled'} for ${updatedDeveloper.user.name}`,
      developer: {
        id: updatedDeveloper.id,
        whatsappVerified: updatedDeveloper.whatsappVerified,
        user: updatedDeveloper.user
      }
    });

  } catch (error) {
    console.error("Error updating WhatsApp verification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
