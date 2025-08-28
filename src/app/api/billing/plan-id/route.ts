import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/features/auth/auth";
import { prisma } from "@/core/database/db";

function toEnvKey(name: string) {
  return name.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_");
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { packageId } = await request.json();
    if (!packageId) {
      return NextResponse.json({ error: "packageId is required" }, { status: 400 });
    }

    const pkg = await prisma.package.findUnique({ where: { id: packageId } });
    if (!pkg || !pkg.providerPlanId) {
      return NextResponse.json({ error: "Package not found or not configured" }, { status: 404 });
    }

    // Promotion removed: always use paid plan (no trial)
    return NextResponse.json({ planId: pkg.providerPlanId, hasUsedTrial: true });
  } catch (err) {
    console.error("plan-id error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


