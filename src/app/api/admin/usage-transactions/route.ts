import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/auth";
import { prisma } from "@/core/database/db";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const skip = (page - 1) * limit;

  try {
    const [usageTransactions, total] = await Promise.all([
      prisma.subscriptionUsage.findMany({
        skip,
        take: limit,
        orderBy: { periodStart: "desc" },
        include: {
          subscription: {
            include: {
              client: {
                include: {
                  user: {
                    select: { email: true, name: true }
                  }
                }
              },
              package: {
                select: { name: true }
              }
            }
          }
        }
      }),
      prisma.subscriptionUsage.count()
    ]);

    const transactions = usageTransactions.map(usage => ({
      id: usage.id,
      clientEmail: usage.subscription.client.user.email,
      clientName: usage.subscription.client.user.name,
      packageName: usage.subscription.package.name,
      periodStart: usage.periodStart,
      periodEnd: usage.periodEnd,
      projectsPostedCount: usage.projectsPostedCount,
      contactClicksByProject: usage.contactClicksByProject
    }));

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching usage transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch usage transactions" },
      { status: 500 }
    );
  }
}
