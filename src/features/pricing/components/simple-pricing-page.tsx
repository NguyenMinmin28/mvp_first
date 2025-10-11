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
    id: "free",
    name: "Free Plan",
    price: "$0",
    priceNumber: 0,
    period: "/monthly",
    features: [
      "25 connects total",
      "Post unlimited projects",
      "Contact developers with connects",
      "Get notified when freelancers show interest",
    ],
    cta: "CHOOSE YOUR PLAN",
    providerPlanId: "P-FREE-PLAN-ID", // Will be replaced with real plan ID
  },
  {
    id: "plus",
    name: "Plus Plan",
    price: "$19.95",
    priceNumber: 19.95,
    period: "/monthly",
    features: [
      "99 connects per month",
      "Post unlimited projects",
      "Contact developers with connects",
      "Get notified when freelancers show interest",
    ],
    cta: "CHOOSE YOUR PLAN",
    providerPlanId: "P-2L869865T2585332XNC24EXA",
  },
];

interface SimplePricingPageProps {
  currentSubscription?: any;
}

export default function SimplePricingPage({
  currentSubscription,
}: SimplePricingPageProps) {
  const { data: session } = useSession();

  // Calculate renewal date and days remaining
  const getRenewalInfo = () => {
    if (!currentSubscription?.currentPeriodEnd) return null;
    
    const renewalDate = new Date(currentSubscription.currentPeriodEnd);
    const now = new Date();
    const daysUntilRenewal = Math.ceil((renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      renewalDate: renewalDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      daysUntilRenewal
    };
  };

  const renewalInfo = getRenewalInfo();

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
    // Free Plan ($0) - always disabled for logged in users
    if (plan.id === "free" && session) {
      return (
        <div className="h-16 flex flex-col justify-center">
          <Button
            disabled
            className="w-full h-12 text-sm font-semibold bg-green-600 text-white"
          >
            ✓ Included Free
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-1">
            You already have Free Plan access
          </p>
        </div>
      );
    }

    // Plus Plan - show PayPal buttons
    if (session && plan.id === "plus") {
      // Check if user is currently subscribed to this plan
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

    // Not logged in - show appropriate labels
    const unauthenticatedLabel =
      plan.id === "free"
        ? "Current Plan"
        : plan.id === "plus"
          ? "Upgrade to Plus"
          : plan.cta;

    return (
      <div className="h-16 flex items-center">
        <Button
          className="w-full h-12 text-sm font-semibold"
          disabled={plan.id === "free"}
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
              <div className="flex-1">
                <h3 className="font-semibold text-green-900">
                  {currentSubscription?.package?.name || "Free Plan"}{" "}
                  {currentSubscription ? "Active" : "Included"}
                </h3>
                <p className="text-sm text-green-700">
                  {currentSubscription
                    ? `You're currently subscribed to ${currentSubscription.package.name}. ${
                        currentSubscription.package.name === "Free Plan"
                          ? "Enjoy your free access!"
                          : "Manage your subscription in your profile."
                      }`
                    : "You already have access to Free Plan features. Upgrade to unlock more connects!"}
                </p>
                {renewalInfo && currentSubscription?.status === "active" && currentSubscription.package.name !== "Free Plan" && (
                  <div className="mt-3 p-3 bg-white/60 rounded border border-green-200">
                    <p className="text-sm text-green-800 font-medium flex items-center gap-2">
                      🔄 Auto-renewal: {renewalInfo.renewalDate}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      {renewalInfo.daysUntilRenewal > 0 
                        ? `${renewalInfo.daysUntilRenewal} days remaining until next billing`
                        : renewalInfo.daysUntilRenewal === 0
                        ? "Renews today"
                        : "Renewal overdue"
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch max-w-4xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`border-2 flex flex-col hover:shadow-lg hover:bg-gray-50 transition-all duration-200 ${plan.id === "free" && session ? "opacity-75" : ""}`}
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
