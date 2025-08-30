import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/auth";
import { prisma } from "@/core/database/db";
// import type { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const job = searchParams.get("job");
  const skip = (page - 1) * limit;

  try {
    const whereClause = job ? { job } : {};
    
    const [cronRuns, total] = await Promise.all([
      (prisma as any).cronRun.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { startedAt: "desc" }
      }),
      (prisma as any).cronRun.count({ where: whereClause })
    ]);

    const runs = cronRuns.map((run: any) => ({
      id: run.id,
      job: run.job,
      status: run.status,
      success: run.success,
      startedAt: run.startedAt,
      finishedAt: run.finishedAt,
      duration: run.finishedAt 
        ? Math.round((run.finishedAt.getTime() - run.startedAt.getTime()) / 1000)
        : null,
      details: run.details
    }));

    return NextResponse.json({
      runs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching cron runs:", error);
    return NextResponse.json(
      { error: "Failed to fetch cron runs" },
      { status: 500 }
    );
  }
}
