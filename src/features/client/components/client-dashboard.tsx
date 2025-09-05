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
  AlertCircle
} from "lucide-react";
import ProjectActivity from "./project-activity";
import { ProjectPostForm } from "./project-post-form";

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

  return (
    <div className="space-y-8">
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
              className="cursor-pointer hover:shadow-md transition-shadow"
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
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
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
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
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
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
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

      {/* Plan for later section */}
      <div className="mt-16">
        <h2 className="text-3xl font-bold text-gray-900  mb-8">
          Plan for later
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Pricing Plans */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  id: "basic",
                  name: "Basic Plan - Starter",
                  price: "$0",
                  period: "/monthly",
                  features: [
                    "Lorem Ipsum is simply dummy text",
                    "Lorem Ipsum is simply dummy text", 
                    "Lorem Ipsum is simply dummy text"
                  ],
                  cta: "CHOOSE YOUR PLAN",
                },
                {
                  id: "pro",
                  name: "Pro Plan - Starter",
                  price: "$19.95",
                  period: "/monthly",
                  features: [
                    "Lorem Ipsum is simply dummy text",
                    "Lorem Ipsum is simply dummy text",
                    "Lorem Ipsum is simply dummy text"
                  ],
                  cta: "CHOOSE YOUR PLAN",
                },
                {
                  id: "premium",
                  name: "Premium Plan - Starter",
                  price: "$99",
                  period: "/monthly",
                  features: [
                    "Lorem Ipsum is simply dummy text",
                    "Lorem Ipsum is simply dummy text",
                    "Lorem Ipsum is simply dummy text"
                  ],
                  cta: "CHOOSE YOUR PLAN",
                }
              ].map((plan) => (
                <Card key={plan.id} className="border-2">
                  <CardHeader>
                    <CardTitle className={`text-lg font-semibold ${plan.id === "pro" ? "text-blue-600 underline" : ""}`}>
                      {plan.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="py-4 border-t">
                      <div className="flex items-end gap-2">
                        <span className="text-5xl font-extrabold">{plan.price}</span>
                        <span className="text-sm text-gray-500">{plan.period}</span>
                      </div>
                    </div>

                    <Button className="w-full h-12 text-sm font-semibold mt-2 bg-gray-600 hover:bg-gray-700">
                      {plan.cta}
                    </Button>

                    <div className="mt-6 rounded-md border bg-gray-50">
                      <div className="px-4 py-3 font-semibold">Service Include:</div>
                      <ul className="px-4 pb-4 space-y-3 text-sm text-gray-700">
                        {plan.features.map((f, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="mt-1 inline-block h-2 w-2 rounded-full bg-gray-600" />
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
          <div className="lg:col-span-1">
            <Card className="h-fit">
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
                <div className="mt-6 pt-4 border-t">
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
