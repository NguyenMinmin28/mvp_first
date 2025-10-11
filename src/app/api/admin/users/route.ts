import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/auth";
import { prisma } from "@/core/database/db";

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const role = searchParams.get("role");
    const status = searchParams.get("status");
    const profileCompleted = searchParams.get("profileCompleted");
    const search = searchParams.get("search");

    // Build where clause
    const where: any = {};

    // Role filter
    if (role && role !== "all") {
      if (role === "none") {
        where.role = null;
      } else {
        where.role = role;
      }
    }

    // Status filter
    if (status && status !== "all") {
      where.status = status;
    }

    // Profile completed filter
    if (profileCompleted && profileCompleted !== "all") {
      where.isProfileCompleted = profileCompleted === "completed";
    }

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get users with related profiles
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          clientProfile: {
            select: {
              id: true,
              companyName: true,
            }
          },
          developerProfile: {
            select: {
              id: true,
              adminApprovalStatus: true,
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    // Transform users data
    const transformedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isProfileCompleted: user.isProfileCompleted,
      status: user.status,
      phoneE164: user.phoneE164,
      isPhoneVerified: user.isPhoneVerified,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      // Add profile info
      profileType: user.clientProfile ? "CLIENT" : user.developerProfile ? "DEVELOPER" : null,
      profileStatus: user.developerProfile?.adminApprovalStatus || null,
    }));

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      users: transformedUsers,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: limit,
        hasNextPage,
        hasPrevPage,
      }
    });

  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

