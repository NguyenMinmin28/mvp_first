"use client";

import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { Button } from "@/ui/components/button";
import { PayPalButtons } from "@/features/billing/components/paypal-buttons";
import { CheckCircle } from "lucide-react";

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
      "Contact up to 5 freelancer per project.",
      "Get notified when freelancers show interest",
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
      "Contact up to 10 freelancer per project",
      "Get notified when freelancers show interest",
    ],
    cta: "CHOOSE YOUR PLAN",
    providerPlanId: "P-PLUS-PLAN-ID", // Sẽ được thay thế bằng real plan ID
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
    providerPlanId: "P-PRO-PLAN-ID", // Sẽ được thay thế bằng real plan ID
  },
];

export default function SimplePricingPage() {
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
        <div className="space-y-2">
          <Button disabled className="w-full h-12 text-sm font-semibold mt-2 bg-green-600 text-white">
            ✓ Included Free
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            You already have Basic Plan access
          </p>
        </div>
      );
    }

    // Plus Plan và Pro Plan - hiển thị PayPal buttons
    if (session && (plan.id === "plus" || plan.id === "pro")) {
      return (
        <PayPalButtons
          packageId={plan.id}
          packageName={plan.name}
          price={plan.priceNumber}
          planId={plan.providerPlanId}
          isCurrentPlan={false}
          hasActiveSubscription={false}
        />
      );
    }

    // Chưa đăng nhập - hiển thị nút đăng nhập
    return (
      <Button 
        className="w-full h-12 text-sm font-semibold mt-2"
        onClick={() => handlePlanSelection(plan)}
      >
        {plan.cta}
      </Button>
    );
  };

  return (
    <section className="w-full py-14 md:py-20">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6">
        <h1 className="text-4xl md:text-6xl font-extrabold text-center mb-8">
          Upgrade your plan
        </h1>

        {/* Free Plan Notice */}
        {session && (
          <div className="mb-8 p-4 bg-green-100/80 border border-green-300 rounded-lg max-w-2xl mx-auto">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-900">Basic Plan Included</h3>
                <p className="text-sm text-green-700">
                  You already have access to Basic Plan features. Upgrade to unlock more projects and contacts!
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <Card key={plan.id} className={`border-2 ${plan.id === "basic" && session ? "opacity-75" : ""}`}>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">{plan.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="py-4 border-t">
                  <div className="flex items-end gap-2">
                    <span className="text-5xl font-extrabold">{plan.price}</span>
                    <span className="text-sm text-gray-500">{plan.period}</span>
                  </div>
                </div>

                {/* Plan Button */}
                {renderPlanButton(plan)}

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
    </section>
  );
}


