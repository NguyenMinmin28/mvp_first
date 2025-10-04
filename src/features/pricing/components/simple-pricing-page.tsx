"use client";

import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { Button } from "@/ui/components/button";
import { PayPalButtons } from "@/features/billing/components/paypal-buttons";
import { CheckCircle, Check } from "lucide-react";

type Plan = {
  id: string;
  name: string;
  price: string;
  priceNumber: number;
  period: string;
  features: string[];
  cta: string;
  providerPlanId: string;
};

const plans: Plan[] = [
  {
    id: "basic",
    name: "Basic Plan",
    price: "$0",
    priceNumber: 0,
    period: "/monthly",
    features: [
      "Monthly Post 1 project free.",
      "Contact up to 10 freelancer per project.",
      "Get notified when freelancers show interest.",
    ],
    cta: "CHOOSE YOUR PLAN",
    providerPlanId: "P-BASIC-PLAN-ID", // Sẽ được thay thế bằng real plan ID
  },
  {
    id: "plus",
    name: "Plus Plan",
    price: "$19.95",
    priceNumber: 19.95,
    period: "/monthly",
    features: [
      "Post up to 10 projects per month.",
      "Unlimited contacts per project.",
      "Get notified when freelancers show interest.",
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
      "Get notified when freelancers show interest.",
    ],
    cta: "CHOOSE YOUR PLAN",
    providerPlanId: "P-6BH23931L7595043MNC24EXQ",
  },
];

interface SimplePricingPageProps {
  currentSubscription?: any;
}

export default function SimplePricingPage({
  currentSubscription,
}: SimplePricingPageProps) {
  const { data: session } = useSession();

  const handlePlanSelection = (plan: Plan) => {
    if (!session) {
      // Redirect to sign in if not authenticated
      window.location.href = "/auth/signin";
      return;
    }

    // For now, show a message that PayPal integration is coming
    // This will be replaced with actual PayPal integration
    alert(`PayPal integration for ${plan.name} will be available soon!`);
  };

  const renderPlanButton = (plan: Plan) => {
    // Basic Plan ($0) - luôn disable cho người dùng đã đăng nhập
    if (plan.id === "basic" && session) {
      return (
        <div className="h-16 flex flex-col justify-center">
          <Button
            disabled
            className="w-full h-12 text-sm font-semibold bg-green-600 text-white"
          >
            ✓ Included Free
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-1">
            You already have Basic Plan access
          </p>
        </div>
      );
    }

    // Plus Plan và Pro Plan - hiển thị PayPal buttons
    if (session && (plan.id === "plus" || plan.id === "pro")) {
      // Kiểm tra xem user có đang subscribe plan này không
      const isCurrentPlan = currentSubscription?.package?.name === plan.name;
      const hasActiveSubscription = !!currentSubscription;

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

    // Chưa đăng nhập - hiển thị label theo yêu cầu trên trang public/home
    const unauthenticatedLabel =
      plan.id === "basic"
        ? "Current Plan"
        : plan.id === "plus"
          ? "Upgrade to Plus"
          : plan.id === "pro"
            ? "Upgrade to Pro"
            : plan.cta;

    return (
      <div className="h-16 flex items-center">
        <Button
          className="w-full h-12 text-sm font-semibold"
          disabled={plan.id === "basic"}
          onClick={() => handlePlanSelection(plan)}
        >
          {unauthenticatedLabel}
        </Button>
      </div>
    );
  };

  return (
    <section className="w-full py-14 md:py-20">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6">
        <h1 className="text-4xl md:text-6xl font-extrabold text-center mb-8">
          Upgrade your plan
        </h1>

        {/* Current Subscription Banner */}
        {session && (
          <div className="mb-8 p-4 bg-green-100/80 border border-green-300 rounded-lg max-w-2xl mx-auto">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-900">
                  {currentSubscription?.package?.name || "Basic Plan"}{" "}
                  {currentSubscription ? "Active" : "Included"}
                </h3>
                <p className="text-sm text-green-700">
                  {currentSubscription
                    ? `You're currently subscribed to ${currentSubscription.package.name}. ${
                        currentSubscription.package.name === "Basic Plan"
                          ? "Enjoy your free access!"
                          : "Manage your subscription in your profile."
                      }`
                    : "You already have access to Basic Plan features. Upgrade to unlock more projects and contacts!"}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`border-2 flex flex-col hover:shadow-lg hover:bg-gray-50 transition-all duration-200 ${plan.id === "basic" && session ? "opacity-75" : ""}`}
            >
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  {plan.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="py-4 border-t">
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-xs text-gray-500">{plan.period}</span>
                  </div>
                </div>

                {/* Plan Button */}
                {renderPlanButton(plan)}

                <div className="mt-4 rounded-md border bg-gray-50">
                  <div className="px-4 py-2 text-sm font-medium">
                    Service Include:
                  </div>
                  <ul className="px-4 pb-4 space-y-2 text-sm text-gray-700">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#6D6D6D] text-white shrink-0">
                          <Check className="w-2.5 h-2.5" />
                        </span>
                        <span className="leading-relaxed whitespace-nowrap">
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
