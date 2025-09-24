import { getServerSession } from "next-auth";
import { Metadata } from "next";
import { authOptions } from "@/features/auth/auth";
import { prisma } from "@/core/database/db";
import { redirect } from "next/navigation";
import { UserLayout } from "@/features/shared/components/user-layout";
import ProfileSummary from "@/features/developer/components/dashboard/profile-summary";
import IdeaSparkList from "@/features/developer/components/dashboard/ideaspark-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/components/tabs";
import BasicDetails from "@/features/developer/components/profile/basic-details";
import SkillsSection from "@/features/developer/components/profile/skills-section";
import PortfolioSection from "@/features/developer/components/profile/portfolio-section";
import EmploymentHistory from "@/features/developer/components/profile/employment-history";
import EducationSection from "@/features/developer/components/profile/education-section";
import WorkHistory from "@/features/developer/components/profile/work-history";
import { Button } from "@/ui/components/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import DeveloperReviewsTrigger from "@/features/client/components/developer-reviews-trigger";

export default async function DeveloperPublicProfilePage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  if (session.user.role !== "CLIENT") {
    redirect("/");
  }

  // Fetch developer profile by developerId (DeveloperProfile.id or Developer userId?)
  // In assignment we used developer.id for DeveloperProfile id
  const developer = await prisma.developerProfile.findFirst({
    where: { id: params.id },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
      skills: { include: { skill: true } },
      reviewsSummary: true,
    },
  });

  if (!developer) {
    return <div className="container mx-auto px-4 py-12">Developer not found</div>;
  }

  // Check if client is connected to this developer
  const clientId = session.user.id;
  const developerId = params.id;

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

  const isConnected = !!(contactReveal || projectConnection);
  const favorite = await prisma.favoriteDeveloper.findFirst({
    where: {
      client: { userId: clientId },
      developerId: developerId,
    },
    select: { id: true }
  });
  const isFavorited = !!favorite;

  // Get follower count for this developer
  const followersCount = await (prisma as any).follow.count({
    where: { followingId: developer.userId }
  });

  // Check if current client is following this developer
  const followStatus = await (prisma as any).follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: clientId,
        followingId: developer.userId,
      },
    },
  });
  const isFollowing = !!followStatus;

  const profile = {
    name: developer.user.name,
    email: (isConnected || isFavorited) ? developer.user.email : null,
    image: developer.user.image,
    photoUrl: developer.photoUrl,
    location: developer.location,
    experienceYears: developer.experienceYears,
    age: (developer as any).age,
    hourlyRate: developer.hourlyRateUsd,
    level: developer.level,
    currentStatus: developer.currentStatus,
    adminApprovalStatus: developer.adminApprovalStatus,
    skills: developer.skills.map((s: any) => ({ skillId: s.skillId, skillName: (s as any).skill?.name })),
    portfolioLinks: developer.portfolioLinks,
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
    <UserLayout user={session?.user}>
      <section className="w-full py-8">
        <div className="container mx-auto px-4">
          {/* Back Button */}
          <div className="mb-4 sm:mb-6">
            <Link href="/client-dashboard">
              <Button variant="outline" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Project Detail
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
            <div className="xl:col-span-2">
              <ProfileSummary profile={profile} hideControls={true} developerId={params.id} />
              <DeveloperReviewsTrigger developerId={params.id} developerName={profile.name} />

              {/* Info Tabs */}
              <div className="mt-4 sm:mt-6">
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="flex flex-wrap gap-2 bg-transparent p-0">
                    <TabsTrigger value="basic" className="rounded-md px-4 py-2 data-[state=active]:bg-black data-[state=active]:text-white border">Basic Information</TabsTrigger>
                    <TabsTrigger value="skills" className="rounded-md px-4 py-2 border">Skills</TabsTrigger>
                    <TabsTrigger value="employment" className="rounded-md px-4 py-2 border">Employment History</TabsTrigger>
                    <TabsTrigger value="portfolio" className="rounded-md px-4 py-2 border">Portfolio</TabsTrigger>
                    <TabsTrigger value="education" className="rounded-md px-4 py-2 border">Education</TabsTrigger>
                    <TabsTrigger value="work" className="rounded-md px-4 py-2 border">Work History</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic">
                    <BasicDetails 
                      profile={{
                        name: profile.name,
                        experienceYears: profile.experienceYears,
                        hourlyRate: profile.hourlyRate,
                        hoursWorked: 0, // TODO: Calculate from completed projects
                        totalEarning: 0, // TODO: Calculate from completed projects
                        skills: profile.skills
                      }}
                    />
                  </TabsContent>

                  <TabsContent value="skills">
                    <SkillsSection skills={profile.skills} />
                  </TabsContent>

                  <TabsContent value="portfolio">
                    <PortfolioSection portfolioLinks={profile.portfolioLinks} />
                  </TabsContent>

                  <TabsContent value="employment">
                    <EmploymentHistory employmentHistory={[]} />
                  </TabsContent>

                  <TabsContent value="education">
                    <EducationSection education={[]} />
                  </TabsContent>

                  <TabsContent value="work">
                    <WorkHistory workHistory={[]} />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
            <div className="xl:col-span-1">
              <IdeaSparkList profile={profile} />
            </div>
          </div>
        </div>
      </section>
    </UserLayout>
  );
}

export const metadata: Metadata = {
  title: "Freelancer Profile – Skills, Experience & Portfolio",
  description: "View detailed freelancer profile including skills, experience, portfolio, and work history. Connect directly with skilled developers on Clevrs.",
};


