import { NextRequest, NextResponse } from "next/server";
import { getServerSessionUser } from "@/features/auth/auth-server";
import { prisma } from "@/core/database/db";
import { z } from "zod";

const followSchema = z.object({
  developerId: z.string(),
  action: z.enum(["follow", "unfollow"]),
});

// GET /api/user/follow - Get user's follow status and followers/following
export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getServerSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const developerId = searchParams.get("developerId");

    if (developerId) {
      // Check if current user follows this developer
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: sessionUser.id,
            followingId: developerId,
          },
        },
      });

      return NextResponse.json({ 
        isFollowing: !!follow,
        followId: follow?.id || null 
      });
    }

    // Get user's follow relationships
    if (sessionUser.role === "CLIENT") {
      // Get developers this client follows
      const following = await prisma.follow.findMany({
        where: { followerId: sessionUser.id },
        include: {
          following: {
            include: {
              developerProfile: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      image: true,
                    },
                  },
                  skills: {
                    include: {
                      skill: true,
                    },
                  },
                  reviewsSummary: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const formattedFollowing = following.map((follow) => ({
        id: follow.following.developerProfile?.id,
        name: follow.following.name,
        email: follow.following.email,
        image: follow.following.image,
        photoUrl: follow.following.developerProfile?.photoUrl,
        location: follow.following.developerProfile?.location,
        experienceYears: follow.following.developerProfile?.experienceYears,
        hourlyRateUsd: follow.following.developerProfile?.hourlyRateUsd,
        level: follow.following.developerProfile?.level,
        currentStatus: follow.following.developerProfile?.currentStatus,
        adminApprovalStatus: follow.following.developerProfile?.adminApprovalStatus,
        skills: follow.following.developerProfile?.skills?.map((s: any) => ({
          skillId: s.skillId,
          skillName: s.skill.name,
        })) || [],
        averageRating: follow.following.developerProfile?.reviewsSummary?.averageRating || 0,
        totalReviews: follow.following.developerProfile?.reviewsSummary?.totalReviews || 0,
        followedAt: follow.createdAt,
      }));

      return NextResponse.json({ following: formattedFollowing });
    } else if (sessionUser.role === "DEVELOPER") {
      // Get clients who follow this developer
      const followers = await prisma.follow.findMany({
        where: { followingId: sessionUser.id },
        include: {
          follower: {
            include: {
              clientProfile: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      image: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const formattedFollowers = followers.map((follow) => ({
        id: follow.follower.id,
        name: follow.follower.name,
        email: follow.follower.email,
        image: follow.follower.image,
        companyName: follow.follower.clientProfile?.companyName,
        location: follow.follower.clientProfile?.location,
        followedAt: follow.createdAt,
      }));

      return NextResponse.json({ 
        followers: formattedFollowers,
        followersCount: followers.length 
      });
    }

    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  } catch (error) {
    console.error("Error fetching follow data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/user/follow - Follow/unfollow a developer
export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getServerSessionUser();
    if (!sessionUser || sessionUser.role !== "CLIENT") {
      return NextResponse.json({ error: "Unauthorized - Only clients can follow developers" }, { status: 401 });
    }

    const body = await request.json();
    const { developerId, action } = followSchema.parse(body);

    // Verify developer exists and has developer profile
    const developer = await prisma.user.findUnique({
      where: { id: developerId },
      include: { developerProfile: true },
    });

    if (!developer || !developer.developerProfile) {
      return NextResponse.json({ error: "Developer not found" }, { status: 404 });
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: sessionUser.id,
          followingId: developerId,
        },
      },
    });

    if (action === "follow") {
      if (existingFollow) {
        return NextResponse.json({ 
          isFollowing: true, 
          message: "Already following this developer" 
        });
      }

      // Create follow relationship
      const follow = await prisma.follow.create({
        data: {
          followerId: sessionUser.id,
          followingId: developerId,
        },
      });

      return NextResponse.json({ 
        isFollowing: true, 
        message: `Now following ${developer.name}`,
        followId: follow.id 
      });
    } else if (action === "unfollow") {
      if (!existingFollow) {
        return NextResponse.json({ 
          isFollowing: false, 
          message: "Not following this developer" 
        });
      }

      // Remove follow relationship
      await prisma.follow.delete({
        where: { id: existingFollow.id },
      });

      return NextResponse.json({ 
        isFollowing: false, 
        message: `Unfollowed ${developer.name}` 
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error toggling follow:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
