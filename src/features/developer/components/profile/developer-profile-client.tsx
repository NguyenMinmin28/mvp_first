"use client";

import { useState } from "react";
import { Button } from "@/ui/components/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
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
import DeveloperReviewsTrigger from "@/features/client/components/developer-reviews-trigger";
import { ViewToggle } from "@/features/developer/components/profile/view-toggle";
import { SimpleProfileView } from "@/features/developer/components/profile/simple-profile-view";

interface DeveloperProfileClientProps {
  profile: any;
  developerId: string;
  user: any;
}

export function DeveloperProfileClient({
  profile,
  developerId,
  user,
}: DeveloperProfileClientProps) {
  const [isSimpleView, setIsSimpleView] = useState(false);

  return (
    <UserLayout user={user}>
      <section className="w-full py-8">
        <div className="container mx-auto px-4">
          {/* Back Button and View Toggle */}
          <div className="mb-4 sm:mb-6 flex items-center justify-between">
            <Link href="/client-dashboard">
              <Button variant="outline" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Project Detail
              </Button>
            </Link>
            <ViewToggle onToggle={setIsSimpleView} />
          </div>

          {isSimpleView ? (
            <SimpleProfileView profile={profile} />
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
              <div className="xl:col-span-2">
                <ProfileSummary
                  profile={profile}
                  hideControls={true}
                  developerId={developerId}
                />
                <DeveloperReviewsTrigger
                  developerId={developerId}
                  developerName={profile.name}
                />

                {/* Info Tabs */}
                <div className="mt-2 sm:mt-4">
                  <Tabs defaultValue="basic" className="w-full">
                    <div className="overflow-x-auto">
                      <TabsList className="flex gap-2 justify-start bg-transparent p-0 min-w-max">
                        <TabsTrigger
                          value="basic"
                          className="rounded-md px-4 py-2 data-[state=active]:bg-black data-[state=active]:text-white border whitespace-nowrap"
                        >
                          Basic Information
                        </TabsTrigger>
                        <TabsTrigger
                          value="skills"
                          className="rounded-md px-4 py-2 data-[state=active]:bg-black data-[state=active]:text-white border whitespace-nowrap"
                        >
                          Skills
                        </TabsTrigger>
                        <TabsTrigger
                          value="employment"
                          className="rounded-md px-4 py-2 data-[state=active]:bg-black data-[state=active]:text-white border whitespace-nowrap"
                        >
                          Employment History
                        </TabsTrigger>
                        <TabsTrigger
                          value="portfolio"
                          className="rounded-md px-4 py-2 data-[state=active]:bg-black data-[state=active]:text-white border whitespace-nowrap"
                        >
                          Portfolio
                        </TabsTrigger>
                        <TabsTrigger
                          value="education"
                          className="rounded-md px-4 py-2 data-[state=active]:bg-black data-[state=active]:text-white border whitespace-nowrap"
                        >
                          Education
                        </TabsTrigger>
                        <TabsTrigger
                          value="work"
                          className="rounded-md px-4 py-2 data-[state=active]:bg-black data-[state=active]:text-white border whitespace-nowrap"
                        >
                          Work History
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    <TabsContent value="basic">
                      <BasicDetails
                        profile={{
                          name: profile.name,
                          experienceYears: profile.experienceYears,
                          hourlyRate: profile.hourlyRate,
                          hoursWorked: 0, // TODO: Calculate from completed projects
                          totalEarning: 0, // TODO: Calculate from completed projects
                          skills: profile.skills,
                        }}
                      />
                    </TabsContent>

                    <TabsContent value="skills">
                      <SkillsSection skills={profile.skills} />
                    </TabsContent>

                    <TabsContent value="portfolio">
                      <PortfolioSection
                        portfolioLinks={profile.portfolioLinks}
                      />
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
          )}
        </div>
      </section>
    </UserLayout>
  );
}
