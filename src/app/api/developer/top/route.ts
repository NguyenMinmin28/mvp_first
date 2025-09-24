export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/database/db";

function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitRaw = searchParams.get("limit");
    const parsed = parseInt(limitRaw || "4", 10);
    const limit = Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 24) : 4;

    // Build where (match services page: approved only)
    const where: any = {
      adminApprovalStatus: "approved",
    };

    // Fetch a pool (more than limit) to allow randomization/services-first sorting
    let pool = await prisma.developerProfile.findMany({
      where,
      take: Math.max(limit * 4, 40),
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
        skills: {
          include: { skill: { select: { id: true, name: true } } },
        },
        reviewsSummary: true,
        _count: {
          select: {
            services: {
              where: { status: "PUBLISHED", visibility: "PUBLIC" },
            } as any,
          },
        },
      },
    });

    // Services-first sorting, then newest (similar to services page)
    pool = pool.sort((a: any, b: any) => {
      const aHasServices = (a._count?.services || 0) > 0;
      const bHasServices = (b._count?.services || 0) > 0;
      if (aHasServices && !bHasServices) return -1;
      if (!aHasServices && bHasServices) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Randomize a bit within the sorted pool to avoid static lists
    shuffleInPlace(pool);

    const selected = pool.slice(0, limit);

    const data = selected.map((dev: any) => ({
      id: dev.id,
      userId: dev.userId,
      name: dev.user?.name ?? null,
      image: dev.user?.image || dev.photoUrl || null,
      location: dev.location || null,
      hourlyRateUsd: dev.hourlyRateUsd || null,
      level: dev.level,
      experienceYears: dev.experienceYears ?? 0,
      currentStatus: dev.currentStatus,
      usualResponseTimeMs: dev.usualResponseTimeMs ?? 0,
      jobsCount: dev._count?.assignmentCandidates || 0,
      reviews: {
        averageRating: dev.reviewsSummary?.averageRating || 0,
        totalReviews: dev.reviewsSummary?.totalReviews || 0,
      },
      skills: (dev.skills || [])
        .map((s: any) => s?.skill?.name)
        .filter((n: any) => typeof n === "string" && n.length > 0)
        .slice(0, 5),
    }));

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("[developer/top] Unexpected error:", error?.message || error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


