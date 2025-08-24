import { NextRequest, NextResponse } from "next/server";
import { getServerSessionUser } from "@/features/auth/auth-server";
import { prisma } from "@/core/database/db";

export async function GET(request: NextRequest) {
  try {
    // Kiểm tra quyền admin
    const user = await getServerSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const level = searchParams.get("level") || "";
    const approvalStatus = searchParams.get("approvalStatus") || "";

    // Tính offset cho pagination
    const skip = (page - 1) * limit;

    // Xây dựng filter conditions
    const where: any = {};

    if (search) {
      where.OR = [
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { bio: { contains: search, mode: "insensitive" } },
        { linkedinUrl: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status && status !== "all") {
      where.currentStatus = status;
    }

    if (level && level !== "all") {
      where.level = level;
    }

    if (approvalStatus && approvalStatus !== "all") {
      where.adminApprovalStatus = approvalStatus;
    }

    // Lấy tổng số records
    const totalCount = await prisma.developerProfile.count({ where });

    // Lấy data với pagination
    const developerProfiles = await prisma.developerProfile.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneE164: true,
            isPhoneVerified: true,
            isProfileCompleted: true,
            createdAt: true,
            lastLoginAt: true,
          },
        },
        skills: {
          include: {
            skill: {
              select: {
                name: true,
              },
            },
          },
        },
        reviewsSummary: true,
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    });

    // Tính tổng số pages
    const totalPages = Math.ceil(totalCount / limit);

    // Format data để trả về
    const formattedProfiles = developerProfiles.map((profile: any) => ({
      id: profile.id,
      userId: profile.userId,
      name: profile.user.name,
      email: profile.user.email,
      phone: profile.user.phoneE164,
      isPhoneVerified: profile.user.isPhoneVerified,
      isProfileCompleted: profile.user.isProfileCompleted,
      photoUrl: profile.photoUrl,
      bio: profile.bio,
      experienceYears: profile.experienceYears,
      level: profile.level,
      linkedinUrl: profile.linkedinUrl,
      portfolioLinks: profile.portfolioLinks,
      adminApprovalStatus: profile.adminApprovalStatus,
      approvedAt: profile.approvedAt,
      rejectedAt: profile.rejectedAt,
      rejectedReason: profile.rejectedReason,
      whatsappNumber: profile.whatsappNumber,
      whatsappVerifiedAt: profile.whatsappVerifiedAt,
      usualResponseTimeMs: profile.usualResponseTimeMs,
      currentStatus: profile.currentStatus,
      averageRating: profile.reviewsSummary?.averageRating || 0,
      totalReviews: profile.reviewsSummary?.totalReviews || 0,
      skills: profile.skills.map((skill: any) => skill.skill.name).join(", "),
      userCreatedAt: profile.user.createdAt,
      lastLoginAt: profile.user.lastLoginAt,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    }));

    return NextResponse.json({
      data: formattedProfiles,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching developer profiles:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
