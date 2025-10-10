import { getServerSession } from "next-auth";
import { Metadata } from "next";
import { authOptions } from "@/features/auth/auth";
import { prisma } from "@/core/database/db";
import { redirect } from "next/navigation";
import { DeveloperProfileClient } from "@/features/developer/components/profile/developer-profile-client";

export default async function DeveloperPublicProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  if (session.user.role !== "CLIENT" && session.user.role !== "DEVELOPER") {
    redirect("/");
  }

  // Fetch developer profile by developerId (DeveloperProfile.id or Developer userId?)
  // In assignment we used developer.id for DeveloperProfile id
  const developer = await prisma.developerProfile.findFirst({
    where: { id: params.id },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true, lastLoginAt: true },
      },
      skills: { include: { skill: true } },
      reviewsSummary: {
        select: {
          id: true,
          averageRating: true,
          totalReviews: true,
          // Skip updatedAt to avoid null value issues
        },
      },
      portfolios: true,
    },
  });

  if (!developer) {
    return (
      <div className="container mx-auto px-4 py-12">Developer not found</div>
    );
  }

  // Check if client is connected to this developer (only for clients)
  const clientId = session.user.id;
  const developerId = params.id;
  const isClient = session.user.role === "CLIENT";

  let isConnected = false;
  let isFavorited = false;

  if (isClient) {
    // Check contact reveal events
    const contactReveal = await prisma.contactRevealEvent.findFirst({
      where: {
        clientId,
        developerId,
      },
      orderBy: {
        revealedAt: "desc",
      },
    });

    // Check if client has any projects with this developer
    const projectConnection = await prisma.project.findFirst({
      where: {
        clientId,
        contactRevealedDeveloperId: developerId,
        contactRevealEnabled: true,
      },
    });

    isConnected = !!(contactReveal || projectConnection);

    const favorite = await prisma.favoriteDeveloper.findFirst({
      where: {
        client: { userId: clientId },
        developerId: developerId,
      },
      select: { id: true },
    });
    isFavorited = !!favorite;
  }

  // Get follower count for this developer
  const followersCount = await (prisma as any).follow.count({
    where: { followingId: developer.userId },
  });

  // Check if current user is following this developer (only for clients)
  let isFollowing = false;
  if (isClient) {
    const followStatus = await (prisma as any).follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: clientId,
          followingId: developer.userId,
        },
      },
    });
    isFollowing = !!followStatus;
  }

  const profile = {
    name: developer.user.name,
    email:
      isClient && (isConnected || isFavorited) ? developer.user.email : null,
    image: developer.user.image,
    photoUrl: developer.photoUrl,
    location: developer.location,
    experienceYears: developer.experienceYears,
    age: (developer as any).age,
    hourlyRate: developer.hourlyRateUsd,
    level: developer.level,
    currentStatus: developer.currentStatus,
    lastLoginAt: developer.user.lastLoginAt,
    adminApprovalStatus: developer.adminApprovalStatus,
    skills: developer.skills.map((s: any) => ({
      skillId: s.skillId,
      skillName: (s as any).skill?.name,
    })),
    // Use real portfolio items from Portfolio collection (sorted by sortOrder)
    portfolioItems: (developer as any).portfolios
      ? (developer as any).portfolios
          .slice()
          .sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
          .map((p: any) => ({
            id: p.id,
            title: p.title,
            description: p.description,
            url: p.projectUrl,
            imageUrl: p.imageUrl,
            createdAt: p.createdAt,
          }))
      : [],
    resumeUrl: (developer as any).resumeUrl || null,
    isConnected, // Pass connection status to components
    isFavorited,
    whatsappNumber: (developer as any).whatsappNumber || null,
    // Follow information
    followersCount,
    isFollowing,
    userId: developer.userId, // Add userId for follow functionality
  } as any;

  return (
    <DeveloperProfileClient
      profile={profile}
      developerId={params.id}
      user={session?.user}
    />
  );
}

export const metadata: Metadata = {
  title: "Freelancer Profile – Skills, Experience & Portfolio",
  description:
    "View detailed freelancer profile including skills, experience, portfolio, and work history. Connect directly with skilled developers on Clevrs.",
};
