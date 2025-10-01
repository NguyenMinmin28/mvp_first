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
    
    // Check if user is admin
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin (you might want to add admin role check here)
    // For now, we'll allow any authenticated user to access admin endpoints

    const idea = await prisma.idea.findUnique({
      where: { 
        id: params.id,
      },
      include: {
        author: {
          select: { 
            id: true, 
            name: true, 
            email: true,
            image: true 
          },
        },
        cover: {
          select: { id: true, storageKey: true },
        },
        skills: {
          include: {
            Skill: {
              select: { id: true, name: true, category: true }
            }
          }
        },
        _count: {
          select: { 
            likes: true, 
            comments: true, 
            bookmarks: true, 
            connects: true 
          },
        },
      },
    });
    
    if (!idea) {
      return NextResponse.json(
        { error: "Idea not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(idea);
  } catch (error) {
    console.error("Error fetching idea:", error);
    return NextResponse.json(
      { error: "Failed to fetch idea" },
      { status: 500 }
    );
  }
}
