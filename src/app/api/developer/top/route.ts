export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/features/auth/auth";
import { prisma } from "@/core/database/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "5"), 10);

    // Sample random developer ids first (MongoDB $sample)
    const sampled: Array<{ _id: { $oid: string } }> = await prisma.developerProfile.aggregateRaw({
      pipeline: [
        { $match: { adminApprovalStatus: "approved", whatsappVerified: true } },
        { $sample: { size: limit } },
        { $project: { _id: 1 } },
      ],
    }) as any;

    const sampledIds = sampled.map((d) => d._id?.$oid).filter(Boolean);

    const developers = await prisma.developerProfile.findMany({
      where: { id: { in: sampledIds } },
      include: {
        user: { select: { id: true, name: true, image: true } },
        skills: {
          take: 5,
          include: { skill: { select: { name: true, category: true } } },
        },
        reviewsSummary: true,
        _count: { select: { assignmentCandidates: true } },
      },
    });

    // Preserve random order
    const orderMap = new Map(sampledIds.map((id, idx) => [id, idx]));
    developers.sort((a: any, b: any) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));

    // Backfill reviews aggregate if missing
    const withReviewStats = await Promise.all(
      developers.map(async (dev) => {
        if (dev.reviewsSummary) {
          return {
            ...dev,
            reviewsAggregate: {
              averageRating: dev.reviewsSummary.averageRating || 0,
              totalReviews: dev.reviewsSummary.totalReviews || 0,
            },
          };
        }

        const agg = await prisma.review.aggregate({
          where: { toUserId: dev.userId },
          _avg: { rating: true },
          _count: { rating: true },
        });

        return {
          ...dev,
          reviewsAggregate: {
            averageRating: agg._avg.rating || 0,
            totalReviews: agg._count.rating || 0,
          },
        };
      })
    );

    const data = withReviewStats.map((dev: any) => ({
      id: dev.id,
      userId: dev.userId,
      name: dev.user?.name,
      image: dev.user?.image || dev.photoUrl || null,
      location: dev.location || null,
      hourlyRateUsd: dev.hourlyRateUsd || null,
      level: dev.level,
      experienceYears: dev.experienceYears,
      currentStatus: dev.currentStatus,
      usualResponseTimeMs: dev.usualResponseTimeMs,
      jobsCount: dev._count?.assignmentCandidates || 0,
      reviews: dev.reviewsAggregate,
      skills: (dev.skills || []).map((s: any) => s.skill?.name).filter(Boolean).slice(0, 5),
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching top freelancers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


