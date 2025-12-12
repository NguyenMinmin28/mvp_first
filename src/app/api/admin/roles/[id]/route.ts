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

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (session.user.role !== "ADMIN") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session };
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return auth.error;

    const body = await request.json();
    const name = (body.name || "").trim();
    const category = (body.category || "").trim() || null;
    const isActive = body.isActive !== undefined ? Boolean(body.isActive) : true;

    if (!name) {
      return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 });
    }

    const role = await prisma.developerRole.update({
      where: { id: params.id },
      data: {
        name,
        slug: slugify(name),
        category,
        isActive,
      },
    });

    return NextResponse.json({ success: true, role });
  } catch (error: any) {
    console.error("Error updating role:", error);
    const message =
      error?.code === "P2002" ? "Role already exists" : "Failed to update role";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return auth.error;

    await prisma.developerRole.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting role:", error);
    const message =
      error?.code === "P2025" ? "Role not found" : "Failed to delete role";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

