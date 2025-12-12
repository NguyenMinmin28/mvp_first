export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/features/auth/auth";
import { prisma } from "@/core/database/db";

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function requireAdmin(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (session.user.role !== "ADMIN") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
      ];
    }

    const roles = await prisma.developerRole.findMany({
      where,
      take: limit,
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, roles });
  } catch (error) {
    console.error("Error fetching admin roles:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch roles" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    const body = await request.json();
    const name = (body.name || "").trim();
    const category = (body.category || "").trim() || null;
    const isActive = body.isActive !== undefined ? Boolean(body.isActive) : true;

    if (!name) {
      return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 });
    }

    const role = await prisma.developerRole.create({
      data: {
        name,
        slug: slugify(name),
        category,
        isActive,
      },
    });

    return NextResponse.json({ success: true, role });
  } catch (error: any) {
    console.error("Error creating role:", error);
    const message =
      error?.code === "P2002" ? "Role already exists" : "Failed to create role";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

