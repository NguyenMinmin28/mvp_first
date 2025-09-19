"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/components/card";
import { Button } from "@/ui/components/button";
import { Badge } from "@/ui/components/badge";
import { useEffect, useMemo, useState, Suspense } from "react";
import { RoleMismatchNotice } from "@/ui/components/role-mismatch-notice";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { 
  FileText,
  AlertCircle
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
const ProjectActivity = dynamic(() => import("./project-activity"), { ssr: false });
const FreelancersStrip = dynamic(() => import("./FreelancersStrip"), { ssr: false });
const ServicesStrip = dynamic(() => import("./ServicesStrip"), { ssr: false });
import { ProjectPostForm } from "./project-post-form";
const HelpAndResources = dynamic(() => import("./HelpAndResources"), { ssr: false });
import { toast } from "sonner";

export default function ClientDashboard() {
  const router = useRouter();
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const userRole = session?.user?.role as string | undefined;
  const targetPortal = searchParams.get("targetPortal") as string | undefined;
  
  const [quotaStatus, setQuotaStatus] = useState<{
    hasActiveSubscription: boolean;
    quotas?: { projectsPerMonth: number; contactClicksPerProject: number };
    usage?: { projectsUsed: number; contactClicksUsed: Record<string, number> };
    remaining?: { projects: number; contactClicks: Record<string, number> };
  } | null>(null);
  const [hasSavedFormData, setHasSavedFormData] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);

  // Check for saved form data from any session
  useEffect(() => {
    const savedFormData = sessionStorage.getItem('guestProjectForm');
    console.log('🔍 Client Dashboard - Checking saved form data:', savedFormData);
    if (savedFormData) {
      setHasSavedFormData(true);
      // Show a toast notification
      setTimeout(() => {
        // You can add a toast notification here if needed
        console.log("Welcome! Your project details have been restored from your previous session.");
      }, 1000);
    } else {
      setHasSavedFormData(false);
    }
  }, [session?.user?.id]); // Re-check when user changes

  // Fetch quota status
  useEffect(() => {
    const fetchQuota = async () => {
      try {
        const res = await fetch("/api/billing/quotas", { credentials: 'include' });
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
        const res = await fetch("/api/user/subscriptions", { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        
        // Get the most recent active subscription
        const activeSubscription = data.subscriptions?.find((sub: any) => sub.status === "active");
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
      {/* Test Notification Button - Remove this after testing */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="text-yellow-800">🧪 Test Notification (Test environment only - will remove after deployment)</CardTitle>
          <CardDescription className="text-yellow-700">
            <strong>This feature is for test environment only:</strong>
            <br />
            • Creates a test notification to verify the notification system
            <br />
            • When clicked, the system will call API `/api/test-notification` 
            <br />
            • If successful: Shows toast "Test notification created!" and automatically refreshes notification count
            <br />
            • If failed: Shows error toast with detailed information
            <br />
            • All logs are written to console for debugging
            <br />
            <strong>⚠️ Note:</strong> This button is only for testing and will be removed when deploying to production
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={async () => {
              try {
                console.log('🧪 Testing notification creation...');
                const res = await fetch('/api/test-notification', { method: 'POST' });
                
                console.log('🧪 Response status:', res.status);
                console.log('🧪 Response headers:', Object.fromEntries(res.headers.entries()));
                
                const data = await res.json();
                console.log('🧪 Test result:', data);
                
                if (res.ok) {
                  toast.success('Test notification created!');
                  // Dispatch event to refresh notification count
                  setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('notification-refresh'));
                  }, 1000);
                } else {
                  toast.error('Test notification failed: ' + (data.error || data.message || 'Unknown error'));
                }
              } catch (error) {
                console.error('🧪 Test error:', error);
                toast.error('Test notification failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
              }
            }}
            className="bg-yellow-600 hover:bg-yellow-700"
          >
            Create Test Notification
          </Button>
        </CardContent>
      </Card>

      {/* Role Mismatch Notice */}
      <RoleMismatchNotice userRole={userRole} targetPortal={targetPortal} />


      {/* Quota Status */}
      {quotaStatus && (
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
                  <span className="text-sm text-gray-600">Projects this month:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {quotaStatus.usage?.projectsUsed || 0} / {quotaStatus.quotas?.projectsPerMonth || 0}
                    </span>
                    <Badge variant={quotaStatus.remaining?.projects === 0 ? "destructive" : "secondary"}>
                      {quotaStatus.remaining?.projects || 0} remaining
                    </Badge>
                  </div>
                </div>
                {quotaStatus.remaining?.projects === 0 && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-red-700">
                      Monthly project limit reached. Upgrade your plan to create more projects.
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
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Project Post</h2>
          </div>
          <div>
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Connects</h2>
          </div>
        </div>

        {/* Content Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          {/* Left Section - Project Post Form */}
          <div className="w-full">
            <ProjectPostForm 
              title=""
              description="Post your project and find the perfect freelancer"
              showLoginLink={true}
              onSuccess={(projectId) => router.push(`/projects/${projectId}`)}
            />
          </div>

          {/* Right Section - Connects Cards */}
          <div className="w-full">
            <div className="grid grid-cols-2 gap-4 w-full">
              {/* Favourite Card */}
              <Link href="/favorites" prefetch>
                <Card 
                  className="cursor-pointer hover:shadow-md bg-[#F3F3F3] hover:bg-gray-100 transition-all duration-200 h-36 flex flex-col justify-center items-center"
                >
                  <CardContent className="flex flex-col items-center justify-center h-full p-5">
                    <div className="flex justify-center mb-3">
                      <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center">
                        <Image 
                          src="/images/client/favourite.png" 
                          alt="Favourite" 
                          width={40}
                          height={40}
                        />
                      </div>
                    </div>
                    <h3 className="font-semibold text-gray-900 text-base">Favourite</h3>
                  </CardContent>
                </Card>
              </Link>

              {/* Starter Card */}
              <Link href="/favorites?level=FRESHER" prefetch>
                <Card 
                  className="cursor-pointer hover:shadow-md bg-[#F3F3F3] hover:bg-gray-100 transition-all duration-200 h-36 flex flex-col justify-center items-center"
                >
                  <CardContent className="flex flex-col items-center justify-center h-full p-5">
                    <div className="flex justify-center mb-3">
                      <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center">
                        <Image 
                          src="/images/client/starter.png" 
                          alt="Starter" 
                          width={40}
                          height={40}
                        />
                      </div>
                    </div>
                    <h3 className="font-semibold text-gray-900 text-base">Starter</h3>
                  </CardContent>
                </Card>
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full mt-4">
              {/* Professional Card */}
              <Link href="/favorites?level=MID" prefetch>
                <Card 
                  className="cursor-pointer hover:shadow-md bg-[#F3F3F3] hover:bg-gray-100 transition-all duration-200 h-36 flex flex-col justify-center items-center"
                >
                  <CardContent className="flex flex-col items-center justify-center h-full p-5">
                    <div className="flex justify-center mb-3">
                      <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center">
                        <Image 
                          src="/images/client/pro.png" 
                          alt="Professional" 
                          width={40}
                          height={40}
                        />
                      </div>
                    </div>
                    <h3 className="font-semibold text-gray-900 text-base">Professional</h3>
                  </CardContent>
                </Card>
              </Link>

              {/* Experts Card */}
              <Link href="/favorites?level=EXPERT" prefetch>
                <Card 
                  className="cursor-pointer hover:shadow-md bg-[#F3F3F3] hover:bg-gray-100 transition-all duration-200 h-36 flex flex-col justify-center items-center"
                >
                  <CardContent className="flex flex-col items-center justify-center h-full p-5">
                    <div className="flex justify-center mb-3">
                      <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center">
                        <Image 
                          src="/images/client/exp.png" 
                          alt="Experts" 
                          width={40}
                          height={40}
                        />
                      </div>
                    </div>
                    <h3 className="font-semibold text-gray-900 text-base">Experts</h3>
                  </CardContent>
                </Card>
              </Link>
            </div>

            <div className="w-full mt-4">
              {/* Active Projects Card */}
              <Link href="/my-projects" prefetch onClick={() => { try { sessionStorage.setItem('myProjectsInitialTab', 'active'); } catch {} }}>
                <Card 
                  className="cursor-pointer hover:shadow-md bg-[#F3F3F3] hover:bg-gray-100 transition-all duration-200 h-36 flex flex-col justify-center items-center"
                >
                  <CardContent className="flex flex-col items-center justify-center h-full p-5">
                    <div className="flex justify-center mb-3">
                      <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center">
                        <Image 
                          src="/images/client/active.png" 
                          alt="Active Projects" 
                          width={40}
                          height={40}
                        />
                      </div>
                    </div>
                    <h3 className="font-semibold text-gray-900 text-base">Active Projects</h3>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Project Activity Section */}
      <div className="mt-20 md:mt-28">
        <Suspense fallback={<div className="h-32 w-full animate-pulse rounded-md bg-gray-100" />}> 
          <ProjectActivity />
        </Suspense>
      </div>

      {/* Freelancers Section */}
      <Suspense fallback={<div className="h-24 w-full animate-pulse rounded-md bg-gray-100" />}> 
        <FreelancersStrip />
      </Suspense>

      {/* Services Section */}
      <Suspense fallback={<div className="h-24 w-full animate-pulse rounded-md bg-gray-100" />}> 
        <ServicesStrip />
      </Suspense>

      {/* Help and Resources Section */}
      <Suspense fallback={<div className="h-24 w-full animate-pulse rounded-md bg-gray-100" />}> 
        <HelpAndResources />
      </Suspense>
    </div>
  );
}
