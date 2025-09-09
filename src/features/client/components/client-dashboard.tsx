"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/components/card";
import { Button } from "@/ui/components/button";
import { Badge } from "@/ui/components/badge";
import { useEffect, useMemo, useState } from "react";
import { RoleMismatchNotice } from "@/ui/components/role-mismatch-notice";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { 
  Heart,
  Sprout,
  Palmtree,
  TreePine,
  Calendar,
  FileText,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import ProjectActivity from "./project-activity";
import { ProjectPostForm } from "./project-post-form";
import { PayPalButtons } from "@/features/billing/components/paypal-buttons";
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

  // Plan data matching the pricing page
  const plans = [
    {
      id: "basic",
      name: "Basic Plan",
      price: "$0",
      priceNumber: 0,
      period: "/monthly",
      features: [
        "Monthly Post 1 project free.",
        "Contact up to 5 freelancer per project.",
        "Get notified when freelancers show interest",
      ],
      cta: "CHOOSE YOUR PLAN",
      providerPlanId: "P-BASIC-PLAN-ID",
    },
    {
      id: "plus",
      name: "Plus Plan",
      price: "$19.95",
      priceNumber: 19.95,
      period: "/monthly",
      features: [
        "Post up to 10 projects per month.",
        "Contact up to 10 freelancer per project",
        "Get notified when freelancers show interest",
      ],
      cta: "CHOOSE YOUR PLAN",
      providerPlanId: "P-2L869865T2585332XNC24EXA",
    },
    {
      id: "pro",
      name: "Pro Plan",
      price: "$99.95",
      priceNumber: 99.95,
      period: "/monthly",
      features: [
        "Unlimited project postings",
        "Unlimited contacts per project.",
        "Get notified when freelancers show interest",
      ],
      cta: "CHOOSE YOUR PLAN",
      providerPlanId: "P-6BH23931L7595043MNC24EXQ",
    },
  ];

  const handlePlanSelection = (plan: any) => {
    if (!session) {
      window.location.href = "/auth/signin";
      return;
    }
    alert(`PayPal integration for ${plan.name} will be available soon!`);
  };

  const renderPlanButton = (plan: any) => {
    // Basic Plan ($0) - always disabled for logged in users
    if (plan.id === "basic" && session) {
      return (
        <div className="h-16 flex flex-col justify-center">
          <Button disabled className="w-full h-12 text-sm font-semibold bg-green-600 text-white">
            ✓ Included Free
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-1">
            You already have Basic Plan access
          </p>
        </div>
      );
    }

    // Plus Plan and Pro Plan - show PayPal buttons
    if (session && (plan.id === "plus" || plan.id === "pro")) {
      const isCurrentPlan = currentSubscription?.package?.name === plan.name;
      const hasActiveSubscription = !!currentSubscription;
      console.log(`🔍 Dashboard - Plan ${plan.name}:`, {
        isCurrentPlan,
        hasActiveSubscription,
        currentSubscriptionPackage: currentSubscription?.package?.name,
        planName: plan.name
      });
      
      return (
        <div className="h-16 flex items-center">
          <PayPalButtons
            packageId={plan.id}
            packageName={plan.name}
            price={plan.priceNumber}
            planId={plan.providerPlanId}
            isCurrentPlan={isCurrentPlan}
            hasActiveSubscription={hasActiveSubscription}
          />
        </div>
      );
    }

    // Not logged in - show login button
    return (
      <div className="h-16 flex items-center">
        <Button 
          className="w-full h-12 text-sm font-semibold"
          onClick={() => handlePlanSelection(plan)}
        >
          {plan.cta}
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Role Mismatch Notice */}
      <RoleMismatchNotice userRole={userRole} targetPortal={targetPortal} />

      {/* Welcome Message for Users with Saved Data */}
      {hasSavedFormData && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <Heart className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-green-900">Welcome! Your project details have been restored</h3>
                <p className="text-sm text-green-700 mt-1">
                  We've saved your project information from your previous session. You can now complete your project posting below.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Section - Project Post / Find Freelancer */}
        <div className="space-y-6">
          <ProjectPostForm 
            title="Project Post"
            description="Post your project and find the perfect freelancer"
            showLoginLink={true}
            onSuccess={(projectId) => router.push(`/projects/${projectId}`)}
          />
        </div>

        {/* Right Section - Team */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900  mb-2">
              Team
            </h2>
            <p className="text-gray-600">
              Choose your team level
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Favourite Card */}
            <Card 
              className="cursor-pointer hover:shadow-md hover:bg-gray-50 transition-all duration-200"
              onClick={() => router.push('/favorites')}
            >
              <CardContent className="pt-6 text-center">
                <div className="flex justify-center mb-3">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <Heart className="h-6 w-6 text-red-600" />
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900">Favourite</h3>
              </CardContent>
            </Card>

            {/* Starter Card */}
            <Card className="cursor-pointer hover:shadow-md hover:bg-gray-50 transition-all duration-200">
              <CardContent className="pt-6 text-center">
                <div className="flex justify-center mb-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Sprout className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900">Starter</h3>
              </CardContent>
            </Card>

            {/* Mid Card */}
            <Card className="cursor-pointer hover:shadow-md hover:bg-gray-50 transition-all duration-200">
              <CardContent className="pt-6 text-center">
                <div className="flex justify-center mb-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Palmtree className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900">Mid</h3>
              </CardContent>
            </Card>

            {/* Expert Card */}
            <Card className="cursor-pointer hover:shadow-md hover:bg-gray-50 transition-all duration-200">
              <CardContent className="pt-6 text-center">
                <div className="flex justify-center mb-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <TreePine className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900">Expert</h3>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Project Activity Section */}
      <ProjectActivity />

      {/* Test Notification Button - Remove this after testing */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="text-yellow-800">🧪 Test Notification ( Test environment only , will remove after deployment) </CardTitle>
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

      {/* Plan for later section */}
      <div className="mt-16">
        <h2 className="text-3xl font-bold text-gray-900  mb-8">
          Plan for later
        </h2>


        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Pricing Plans */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <Card key={plan.id} className={`border-2 hover:shadow-lg hover:bg-gray-50 transition-all duration-200 ${plan.id === "basic" && session ? "opacity-75" : ""}`}>
                  <CardHeader>
                    <CardTitle className="text-base font-semibold">{plan.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="py-4 border-t">
                      <div className="flex items-end gap-2">
                        <span className="text-4xl font-bold">{plan.price}</span>
                        <span className="text-xs text-gray-500">{plan.period}</span>
                      </div>
                    </div>

                    {/* Plan Button */}
                    {renderPlanButton(plan)}

                    <div className="mt-4 rounded-md border bg-gray-50">
                      <div className="px-4 py-2 text-sm font-medium">Service Include:</div>
                      <ul className="px-4 pb-4 space-y-2 text-sm text-gray-700">
                        {plan.features.map((f, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-gray-600" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Benefits Section */}
          <div className="lg:col-span-1 flex">
            <Card className="h-full flex-1">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Benefits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-gray-600 mt-0.5" />
                    <p className="text-sm text-gray-700">Post projects anytime and connect instantly</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-gray-600 mt-0.5" />
                    <p className="text-sm text-gray-700">Flexible contracts with direct agreements</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-gray-600 mt-0.5" />
                    <p className="text-sm text-gray-700">Keep 100% earnings, zero commission</p>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t text-center">
                  <a href="#" className="text-sm text-gray-600 underline hover:text-gray-800">
                    See terms
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
