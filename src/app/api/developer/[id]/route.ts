import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/auth";
import { prisma } from "@/core/database/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const developerId = params.id;

    // Allow public access - no authentication required for viewing developer profiles
    // Authentication is optional - if user is logged in, we can show additional info
    const session = await getServerSession(authOptions);

    // Get developer profile with complete data
    const developer = await prisma.developerProfile.findUnique({
      where: { id: developerId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        skills: {
          include: {
            skill: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        reviewsSummary: true,
        _count: {
          select: {
            services: {
              where: { status: "PUBLISHED", visibility: "PUBLIC" }
            },
            assignmentCandidates: {
              where: { responseStatus: "accepted" }
            }
          }
        }
      }
    });

    if (!developer) {
      return NextResponse.json(
        { error: "Developer not found" },
        { status: 404 }
      );
    }

    // Get portfolios
    const portfolios = await prisma.portfolio.findMany({
      where: { developerId: developerId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      take: 10,
    });

    // Only show email if user is authenticated and viewing their own profile or is connected
    const showEmail = session?.user?.id && (
      session.user.id === developer.userId ||
      // Add other conditions for showing email (e.g., connected clients)
      false
    );

    return NextResponse.json({
      id: developer.id,
      name: developer.user.name,
      email: showEmail ? developer.user.email : null, // Hide email for public access
      photoUrl: developer.photoUrl,
      image: developer.user.image,
      location: developer.location,
      bio: developer.bio,
      experienceYears: developer.experienceYears,
      level: developer.level,
      currentStatus: developer.currentStatus,
      hourlyRateUsd: developer.hourlyRateUsd,
      usualResponseTimeMs: developer.usualResponseTimeMs,
      jobsCount: developer._count?.assignmentCandidates || 0,
      reviews: {
        averageRating: developer.reviewsSummary?.averageRating || 0,
        totalReviews: developer.reviewsSummary?.totalReviews || 0,
      },
      skills: developer.skills?.map(s => s.skill.name) || [],
      portfolioLinks: portfolios.map(p => {
        // Parse imageUrl and images array
        const raw = p.imageUrl || "";
        let images: string[] = [];
        let imageUrl = "";
        
        const looksJson = raw.trim().startsWith("[");
        if (looksJson) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              images = [...parsed].slice(0, 6);
              while (images.length < 6) images.push("");
              const nonEmpty = images.filter((u) => u && u.trim() !== "");
              imageUrl = nonEmpty[0] || "";
            } else {
              images = ["", "", "", "", "", ""];
              imageUrl = "";
            }
          } catch {
            images = ["", "", "", "", "", ""];
            imageUrl = "";
          }
        } else {
          if (raw) {
            images = [raw, "", "", "", "", ""];
            imageUrl = raw;
          } else {
            images = ["", "", "", "", "", ""];
            imageUrl = "";
          }
        }
        
        return {
          id: p.id,
          title: p.title,
          description: p.description,
          url: p.projectUrl,
          imageUrl: imageUrl,
          images: images,
        };
      }) || [],
      workHistory: [],
      education: [],
      certifications: [],
      languages: []
    });

  } catch (error) {
    console.error("Error fetching developer:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
