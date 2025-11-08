"use client";

import { useState } from "react";
import { Button } from "@/ui/components/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { UserLayout } from "@/features/shared/components/user-layout";
import ProfileSummary from "@/features/developer/components/dashboard/profile-summary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/components/tabs";
import BasicDetails from "@/features/developer/components/profile/basic-details";
import SkillsSection from "@/features/developer/components/profile/skills-section";
import PortfolioGrid from "@/features/developer/components/dashboard/portfolio-grid";
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
            <div className="space-y-6">
              {/* Profile Summary - Contains Avatar, Info, Portfolio, and IdeaSpark */}
              <ProfileSummary
                profile={profile}
                hideControls={true}
                developerId={developerId}
              />

              {/* Reviews Trigger */}
              <DeveloperReviewsTrigger
                developerId={developerId}
                developerName={profile.name}
              />

              {/* Info Tabs - Additional Details */}
              <div className="mt-6 sm:mt-8">
                <Tabs defaultValue="basic" className="w-full">
                  {/* Mobile: Grid Layout */}
                  <div className="block sm:hidden">
                    <TabsList className="min-h-10 items-center bg-muted p-1 text-muted-foreground grid grid-cols-3 gap-2 px-4 py-3 rounded-xl border border-gray-200 shadow-md h-auto relative z-40 w-full">
                      <TabsTrigger
                        value="basic"
                        className="rounded-lg px-4 py-2.5 text-xs font-semibold transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-gray-900 data-[state=active]:to-black data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:bg-white data-[state=inactive]:text-gray-700 data-[state=inactive]:border data-[state=inactive]:border-gray-200 data-[state=inactive]:hover:border-gray-400 whitespace-nowrap"
                      >
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                          Basic
                        </span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="skills"
                        className="rounded-lg px-4 py-2.5 text-xs font-semibold transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-gray-900 data-[state=active]:to-black data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:bg-white data-[state=inactive]:text-gray-700 data-[state=inactive]:border data-[state=inactive]:border-gray-200 data-[state=inactive]:hover:border-gray-400 whitespace-nowrap"
                      >
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
                          </svg>
                          Skills
                        </span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="employment"
                        className="rounded-lg px-4 py-2.5 text-xs font-semibold transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-gray-900 data-[state=active]:to-black data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:bg-white data-[state=inactive]:text-gray-700 data-[state=inactive]:border data-[state=inactive]:border-gray-200 data-[state=inactive]:hover:border-gray-400 whitespace-nowrap"
                      >
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                            <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
                          </svg>
                          Jobs
                        </span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="portfolio"
                        className="rounded-lg px-4 py-2.5 text-xs font-semibold transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-gray-900 data-[state=active]:to-black data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:bg-white data-[state=inactive]:text-gray-700 data-[state=inactive]:border data-[state=inactive]:border-gray-200 data-[state=inactive]:hover:border-gray-400 whitespace-nowrap"
                      >
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                          </svg>
                          Portfolio
                        </span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="education"
                        className="rounded-lg px-4 py-2.5 text-xs font-semibold transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-gray-900 data-[state=active]:to-black data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:bg-white data-[state=inactive]:text-gray-700 data-[state=inactive]:border data-[state=inactive]:border-gray-200 data-[state=inactive]:hover:border-gray-400 whitespace-nowrap"
                      >
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                          </svg>
                          Education
                        </span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="work"
                        className="rounded-lg px-4 py-2.5 text-xs font-semibold transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-gray-900 data-[state=active]:to-black data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:bg-white data-[state=inactive]:text-gray-700 data-[state=inactive]:border data-[state=inactive]:border-gray-200 data-[state=inactive]:hover:border-gray-400 whitespace-nowrap"
                      >
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                          </svg>
                          History
                        </span>
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  {/* Desktop: Horizontal Scroll */}
                  <div className="hidden sm:block">
                    <div className="relative w-full">
                      <div className="py-2" style={{scrollbarWidth: 'thin'}}>
                        <TabsList className="min-h-10 items-center bg-muted p-1 text-muted-foreground flex gap-2 justify-start px-4 py-3 rounded-xl border border-gray-200 shadow-md h-auto relative z-40 w-full overflow-x-auto" style={{minWidth: '100%'}}>
                          <TabsTrigger
                            value="basic"
                            className="relative group rounded-lg px-4 py-2.5 font-semibold text-sm transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-gray-900 data-[state=active]:to-black data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:bg-white data-[state=inactive]:text-gray-700 data-[state=inactive]:border data-[state=inactive]:border-gray-200 data-[state=inactive]:hover:border-gray-400 data-[state=inactive]:hover:shadow-sm whitespace-nowrap flex-shrink-0"
                          >
                            <span className="flex items-center gap-2">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                              Basic Information
                            </span>
                          </TabsTrigger>
                          <TabsTrigger
                            value="skills"
                            className="relative group rounded-lg px-4 py-2.5 font-semibold text-sm transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-gray-900 data-[state=active]:to-black data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:bg-white data-[state=inactive]:text-gray-700 data-[state=inactive]:border data-[state=inactive]:border-gray-200 data-[state=inactive]:hover:border-gray-400 data-[state=inactive]:hover:shadow-sm whitespace-nowrap flex-shrink-0"
                          >
                            <span className="flex items-center gap-2">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
                              </svg>
                              Skills
                            </span>
                          </TabsTrigger>
                          <TabsTrigger
                            value="employment"
                            className="relative group rounded-lg px-4 py-2.5 font-semibold text-sm transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-gray-900 data-[state=active]:to-black data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:bg-white data-[state=inactive]:text-gray-700 data-[state=inactive]:border data-[state=inactive]:border-gray-200 data-[state=inactive]:hover:border-gray-400 data-[state=inactive]:hover:shadow-sm whitespace-nowrap flex-shrink-0"
                          >
                            <span className="flex items-center gap-2">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                                <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
                              </svg>
                              Employment
                            </span>
                          </TabsTrigger>
                          <TabsTrigger
                            value="portfolio"
                            className="relative group rounded-lg px-4 py-2.5 font-semibold text-sm transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-gray-900 data-[state=active]:to-black data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:bg-white data-[state=inactive]:text-gray-700 data-[state=inactive]:border data-[state=inactive]:border-gray-200 data-[state=inactive]:hover:border-gray-400 data-[state=inactive]:hover:shadow-sm whitespace-nowrap flex-shrink-0"
                          >
                            <span className="flex items-center gap-2">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                              </svg>
                              Portfolio
                            </span>
                          </TabsTrigger>
                          <TabsTrigger
                            value="education"
                            className="relative group rounded-lg px-4 py-2.5 font-semibold text-sm transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-gray-900 data-[state=active]:to-black data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:bg-white data-[state=inactive]:text-gray-700 data-[state=inactive]:border data-[state=inactive]:border-gray-200 data-[state=inactive]:hover:border-gray-400 data-[state=inactive]:hover:shadow-sm whitespace-nowrap flex-shrink-0"
                          >
                            <span className="flex items-center gap-2">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                              </svg>
                              Education
                            </span>
                          </TabsTrigger>
                          <TabsTrigger
                            value="work"
                            className="relative group rounded-lg px-4 py-2.5 font-semibold text-sm transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-gray-900 data-[state=active]:to-black data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:bg-white data-[state=inactive]:text-gray-700 data-[state=inactive]:border data-[state=inactive]:border-gray-200 data-[state=inactive]:hover:border-gray-400 data-[state=inactive]:hover:shadow-sm whitespace-nowrap flex-shrink-0"
                          >
                            <span className="flex items-center gap-2">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                              </svg>
                              Work History
                            </span>
                          </TabsTrigger>
                        </TabsList>
                      </div>
                    </div>
                  </div>

                  <TabsContent value="basic" className="mt-8 py-6">
                    <div className="h-[700px] overflow-y-auto">
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
                    </div>
                  </TabsContent>

                  <TabsContent value="skills" className="mt-8 py-6">
                    <div className="h-[700px] overflow-y-auto">
                      <SkillsSection skills={profile.skills} />
                    </div>
                  </TabsContent>

                  <TabsContent value="portfolio" className="mt-8 py-6">
                    <div className="h-[700px] overflow-y-auto overflow-x-hidden">
                      <PortfolioGrid
                        portfolioLinks={Array.isArray(profile?.portfolioItems) ? profile.portfolioItems : []}
                        onAddPortfolio={undefined}
                        variant="public"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="employment" className="mt-8 py-6">
                    <div className="h-[700px] overflow-y-auto">
                      <EmploymentHistory employmentHistory={[]} />
                    </div>
                  </TabsContent>

                  <TabsContent value="education" className="mt-8 py-6">
                    <div className="h-[700px] overflow-y-auto">
                      <EducationSection education={[]} />
                    </div>
                  </TabsContent>

                  <TabsContent value="work" className="mt-8 py-6">
                    <div className="h-[700px] overflow-y-auto">
                      <WorkHistory developerId={developerId} />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          )}
        </div>
      </section>
    </UserLayout>
  );
}
