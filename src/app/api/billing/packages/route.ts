import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/database/db";

export async function GET(request: NextRequest) {
  try {
    const packages = await prisma.package.findMany({
      where: {
        active: true,
      },
      select: {
        id: true,
        name: true,
        priceUSD: true,
        projectsPerMonth: true,
        contactClicksPerProject: true,
        features: true,
        isPopular: true,
        provider: true,
        providerPlanId: true,
        interval: true,
        trialPeriodDays: true,
        trialProjectsCount: true,
      },
      orderBy: {
        priceUSD: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      packages,
    });
  } catch (error) {
    console.error("Error fetching billing packages:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
