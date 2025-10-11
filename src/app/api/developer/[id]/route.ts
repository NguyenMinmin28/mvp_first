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

    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

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

    return NextResponse.json({
      id: developer.id,
      name: developer.user.name,
      email: developer.user.email,
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
      portfolioLinks: portfolios.map(p => ({
        id: p.id,
        title: p.title,
        description: p.description,
        url: p.projectUrl,
        imageUrl: p.imageUrl,
      })) || [],
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
