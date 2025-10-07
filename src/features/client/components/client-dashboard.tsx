"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/components/card";
import { Button } from "@/ui/components/button";
import { Badge } from "@/ui/components/badge";
import { useEffect, useMemo, useState, Suspense } from "react";
import { RoleMismatchNotice } from "@/ui/components/role-mismatch-notice";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { FileText, AlertCircle, Heart, Star, Users, Briefcase, Sparkles } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/ui/components/tooltip";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
const ProjectActivity = dynamic(() => import("./project-activity"), {
  ssr: false,
});
const FreelancersStrip = dynamic(() => import("./FreelancersStrip"), {
  ssr: false,
});
const ServicesStrip = dynamic(() => import("./ServicesStrip"), { ssr: false });
import { ProjectPostForm } from "./project-post-form";
const HelpAndResources = dynamic(() => import("./HelpAndResources"), {
  ssr: false,
});
import { toast } from "sonner";

export default function ClientDashboard() {
  const router = useRouter();
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const userRole = session?.user?.role as string | undefined;
  const targetPortal = searchParams.get("targetPortal") as string | undefined;

  const [quotaStatus, setQuotaStatus] = useState<{
    hasActiveSubscription: boolean;
    isHighestTier?: boolean;
    packageName?: string;
    quotas?: { projectsPerMonth: number; contactClicksPerProject: number };
    usage?: { projectsUsed: number; contactClicksUsed: Record<string, number> };
    remaining?: { projects: number; contactClicks: Record<string, number> };
  } | null>(null);
  const [hasSavedFormData, setHasSavedFormData] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [isConnectsVisible, setIsConnectsVisible] = useState(false);

  // Connects section visibility animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsConnectsVisible(true);
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  // Check for saved form data from any session
  useEffect(() => {
    // Only access sessionStorage on client side
    if (typeof window !== "undefined") {
      const savedFormData = sessionStorage.getItem("guestProjectForm");
      console.log(
        "🔍 Client Dashboard - Checking saved form data:",
        savedFormData
      );
      if (savedFormData) {
        setHasSavedFormData(true);
        // Show a toast notification
        setTimeout(() => {
          // You can add a toast notification here if needed
          console.log(
            "Welcome! Your project details have been restored from your previous session."
          );
        }, 1000);
      } else {
        setHasSavedFormData(false);
      }
    }
  }, [session?.user?.id]); // Re-check when user changes

  // Fetch quota status
  useEffect(() => {
    const fetchQuota = async () => {
      try {
        const res = await fetch("/api/billing/quotas", {
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();
        setQuotaStatus(data);
      } catch (error) {
        console.error("Failed to fetch quota status:", error);
      }
    };
    fetchQuota();
  }, []);

  // Fetch current subscription
  useEffect(() => {
    const fetchSubscription = async () => {
      if (!session?.user?.id) return;

      try {
        const res = await fetch("/api/user/subscriptions", {
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();

        // Get the most recent active subscription
        const activeSubscription = data.subscriptions?.find(
          (sub: any) => sub.status === "active"
        );
        console.log("🔍 Dashboard - Subscriptions data:", data);
        console.log("🔍 Dashboard - Active subscription:", activeSubscription);
        setCurrentSubscription(activeSubscription || null);
      } catch (error) {
        console.error("Failed to fetch subscription:", error);
      }
    };
    fetchSubscription();
  }, [session?.user?.id]);

  return (
    <div className="space-y-8">
      {/* Role Mismatch Notice */}
      <RoleMismatchNotice userRole={userRole} targetPortal={targetPortal} />

      {/* Quota Status - Hide for highest tier users */}
      {quotaStatus && !quotaStatus.isHighestTier && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Project Quota Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {quotaStatus.hasActiveSubscription ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Projects this month:
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {quotaStatus.usage?.projectsUsed || 0} /{" "}
                      {quotaStatus.quotas?.projectsPerMonth || 0}
                    </span>
                    <Badge
                      variant={
                        quotaStatus.remaining?.projects === 0
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {quotaStatus.remaining?.projects || 0} remaining
                    </Badge>
                  </div>
                </div>
                {quotaStatus.remaining?.projects === 0 && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-red-700">
                      Monthly project limit reached. Upgrade your plan to create
                      more projects.
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-700">
                  No active subscription. Please subscribe to create projects.
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6">
        {/* Title Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start mb-8">
          <div>
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4 hover:text-blue-600 transition-all duration-300 cursor-pointer title-glow title-underline">
              Project Post
            </h2>
          </div>
          <div>
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4 hover:text-purple-600 transition-all duration-300 cursor-pointer title-glow title-underline">
              Connects
            </h2>
          </div>
        </div>

        {/* Content Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          {/* Left Section - Project Post Form */}
          <ProjectPostForm
            title=""
            description="Post your project and find the perfect freelancer"
            showLoginLink={true}
            onSuccess={(projectId) => router.push(`/projects/${projectId}`)}
          />

          {/* Right Section - Connects Cards */}
          <TooltipProvider>
            <div 
              className={`
                w-full transition-all duration-700 transform
                ${isConnectsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
              `}
            >
            <div className="grid grid-cols-2 gap-4 w-full">
              {/* Favourite Card */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/favorites" prefetch>
                    <Card 
                      className={`
                        cursor-pointer bg-[#F3F3F3] hover:bg-gray-100 transition-all duration-300 h-36 flex flex-col justify-center items-center
                        hover:shadow-xl hover:scale-105 hover:-translate-y-2
                        ${hoveredCard === "favourite" ? "ring-2 ring-red-500 ring-opacity-50" : ""}
                        group card-hover-lift
                      `}
                      onMouseEnter={() => setHoveredCard("favourite")}
                      onMouseLeave={() => setHoveredCard(null)}
                    >
                      <CardContent className="flex flex-col items-center justify-center h-full p-5">
                        <div className="flex justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-red-100 transition-colors duration-300">
                            <Heart className="h-8 w-8 text-red-500 group-hover:animate-pulse" />
                          </div>
                        </div>
                        <h3 className="font-semibold text-gray-900 text-base group-hover:text-red-600 transition-colors duration-300">
                          Favourite
                        </h3>
                      </CardContent>
                    </Card>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-lg">
                  <p>Freelancers you have followed</p>
                </TooltipContent>
              </Tooltip>

              {/* Starter Card */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/favorites?level=FRESHER" prefetch>
                    <Card 
                      className={`
                        cursor-pointer bg-[#F3F3F3] hover:bg-gray-100 transition-all duration-300 h-36 flex flex-col justify-center items-center
                        hover:shadow-xl hover:scale-105 hover:-translate-y-2
                        ${hoveredCard === "starter" ? "ring-2 ring-green-500 ring-opacity-50" : ""}
                        group card-hover-lift
                      `}
                      onMouseEnter={() => setHoveredCard("starter")}
                      onMouseLeave={() => setHoveredCard(null)}
                    >
                      <CardContent className="flex flex-col items-center justify-center h-full p-5">
                        <div className="flex justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-green-100 transition-colors duration-300">
                            <Star className="h-8 w-8 text-green-500 group-hover:animate-pulse" />
                          </div>
                        </div>
                        <h3 className="font-semibold text-gray-900 text-base group-hover:text-green-600 transition-colors duration-300">
                          Starter
                        </h3>
                      </CardContent>
                    </Card>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-lg">
                  <p>Your favorite starter freelancers</p>
                </TooltipContent>
              </Tooltip>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full mt-4">
              {/* Professional Card */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/favorites?level=MID" prefetch>
                    <Card 
                      className={`
                        cursor-pointer bg-[#F3F3F3] hover:bg-gray-100 transition-all duration-300 h-36 flex flex-col justify-center items-center
                        hover:shadow-xl hover:scale-105 hover:-translate-y-2
                        ${hoveredCard === "professional" ? "ring-2 ring-blue-500 ring-opacity-50" : ""}
                        group card-hover-lift
                      `}
                      onMouseEnter={() => setHoveredCard("professional")}
                      onMouseLeave={() => setHoveredCard(null)}
                    >
                      <CardContent className="flex flex-col items-center justify-center h-full p-5">
                        <div className="flex justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-blue-100 transition-colors duration-300">
                            <Users className="h-8 w-8 text-blue-500 group-hover:animate-pulse" />
                          </div>
                        </div>
                        <h3 className="font-semibold text-gray-900 text-base group-hover:text-blue-600 transition-colors duration-300">
                          Professional
                        </h3>
                      </CardContent>
                    </Card>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-lg">
                  <p>Your favorite professional freelancers</p>
                </TooltipContent>
              </Tooltip>

              {/* Experts Card */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/favorites?level=EXPERT" prefetch>
                    <Card 
                      className={`
                        cursor-pointer bg-[#F3F3F3] hover:bg-gray-100 transition-all duration-300 h-36 flex flex-col justify-center items-center
                        hover:shadow-xl hover:scale-105 hover:-translate-y-2
                        ${hoveredCard === "expert" ? "ring-2 ring-purple-500 ring-opacity-50" : ""}
                        group card-hover-lift
                      `}
                      onMouseEnter={() => setHoveredCard("expert")}
                      onMouseLeave={() => setHoveredCard(null)}
                    >
                      <CardContent className="flex flex-col items-center justify-center h-full p-5">
                        <div className="flex justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-purple-100 transition-colors duration-300">
                            <Sparkles className="h-8 w-8 text-purple-500 group-hover:animate-pulse" />
                          </div>
                        </div>
                        <h3 className="font-semibold text-gray-900 text-base group-hover:text-purple-600 transition-colors duration-300">
                          Experts
                        </h3>
                      </CardContent>
                    </Card>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-lg">
                  <p>Your favorite expert freelancers</p>
                </TooltipContent>
              </Tooltip>
            </div>

            <div className="w-full mt-4">
              {/* Active Projects Card */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/my-projects"
                    prefetch
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        try {
                          sessionStorage.setItem("myProjectsInitialTab", "active");
                        } catch {}
                      }
                    }}
                  >
                    <Card 
                      className={`
                        cursor-pointer bg-[#F3F3F3] hover:bg-gray-100 transition-all duration-300 h-36 flex flex-col justify-center items-center
                        hover:shadow-xl hover:scale-105 hover:-translate-y-2
                        ${hoveredCard === "active" ? "ring-2 ring-orange-500 ring-opacity-50" : ""}
                        group card-hover-lift
                      `}
                      onMouseEnter={() => setHoveredCard("active")}
                      onMouseLeave={() => setHoveredCard(null)}
                    >
                      <CardContent className="flex flex-col items-center justify-center h-full p-5">
                        <div className="flex justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-orange-100 transition-colors duration-300">
                            <Briefcase className="h-8 w-8 text-orange-500 group-hover:animate-pulse" />
                          </div>
                        </div>
                        <h3 className="font-semibold text-gray-900 text-base group-hover:text-orange-600 transition-colors duration-300">
                          Active Projects
                        </h3>
                      </CardContent>
                    </Card>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-lg">
                  <p>Manage and track your ongoing projects</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
          </TooltipProvider>
        </div>
      </div>

      {/* Project Activity Section */}
      <div className="mt-20 md:mt-28">
        <Suspense
          fallback={
            <div className="h-32 w-full animate-pulse rounded-md bg-gray-100" />
          }
        >
          <ProjectActivity />
        </Suspense>
      </div>

      {/* Freelancers Section */}
      <Suspense
        fallback={
          <div className="h-24 w-full animate-pulse rounded-md bg-gray-100" />
        }
      >
        <FreelancersStrip />
      </Suspense>

      {/* Services Section */}
      <Suspense
        fallback={
          <div className="h-24 w-full animate-pulse rounded-md bg-gray-100" />
        }
      >
        <ServicesStrip />
      </Suspense>

      {/* Help and Resources Section */}
      <Suspense
        fallback={
          <div className="h-24 w-full animate-pulse rounded-md bg-gray-100" />
        }
      >
        <HelpAndResources />
      </Suspense>
    </div>
  );
}
