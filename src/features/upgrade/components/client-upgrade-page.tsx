"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { Button } from "@/ui/components/button";
import { PayPalButtons } from "@/features/billing/components/paypal-buttons";
import { Check } from "lucide-react";
import { toast } from "sonner";

type BillingPeriod = "monthly" | "yearly";

interface Plan {
  id: string;
  name: string;
  subtitle: string;
  price: {
    monthly: string;
    yearly: string;
  };
  yearlySavings?: string;
  features: {
    category: string;
    items: string[];
  }[];
  buttonText: string;
}

const freePlan: Plan = {
  id: "free",
  name: "Free",
  subtitle: "Start your independent journey",
  price: {
    monthly: "$0 / month",
    yearly: "$0 / month",
  },
  features: [
    {
      category: "Always commission-free:",
      items: [
        "Contra profile",
        "Limited access to jobs and Indy AI",
        "Discoverable via search",
        "Send proposals & invoices",
        "Clients pay $29 per project or invoice",
        "Standard analytics",
      ],
    },
  ],
  buttonText: "Select Free Plan",
};

const proPlan: Plan = {
  id: "pro",
  name: "Pro",
  subtitle: "Take your business to the next level",
  price: {
    monthly: "$29 / month",
    yearly: "$17 / month, billed annually (save $149)",
  },
  yearlySavings: "$149",
  features: [
    {
      category: "Everything in Free, plus:",
      items: [
        "Unlimited access to Contra jobs (60k hiring clients)",
        "Unlimited access to Indy AI jobs discovered from your LinkedIn & X networks",
        "Priority job applications (appear at the top)",
        "Boosted search placement (3X more likely to be seen)",
        "Waived contract fees for invited clients ($29 → $0 per project)",
        "Waived invoice fees for clients ($29 → $0 per invoice)",
        "Cheat codes to improve discovery score",
        "Advanced analytics",
        "Priority support 24/7",
      ],
    },
  ],
  buttonText: "Select Plus Plan",
};

export default function ClientUpgradePage() {
  const router = useRouter();
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("yearly");
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handlePlanSelect = async (planId: string) => {
    setIsLoading(planId);

    try {
      if (planId === "free") {
        // Free plan - just continue to dashboard
        toast.success("Free plan selected! Welcome to Clevrs.");
        setTimeout(() => {
          router.push("/client-dashboard");
        }, 1000);
      } else {
        // Payment handled by PayPal modal button; no direct redirect here
        toast.message("Proceed to payment to activate Plus plan.");
      }
    } catch (error) {
      console.error("Error selecting plan:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Select your plan
          </h1>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <button
              type="button"
              onClick={() => setBillingPeriod("monthly")}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                billingPeriod === "monthly"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingPeriod("yearly")}
              className={`px-6 py-3 rounded-lg font-medium transition-all relative ${
                billingPeriod === "yearly"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Yearly (save 42%)
              {billingPeriod === "yearly" && (
                <span className="absolute -top-1 -right-1">✨</span>
              )}
            </button>
          </div>

          {/* Instruction text */}
          <p className="text-gray-600 text-sm">
            You can choose the free plan first. You can upgrade anytime later.
          </p>
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Free Plan */}
          <Card className="border-2 hover:shadow-lg transition-all">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">{freePlan.name}</CardTitle>
              <p className="text-gray-600 text-sm mt-1">{freePlan.subtitle}</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="pt-4 border-t">
                <div className="text-3xl font-bold text-gray-900">
                  {freePlan.price[billingPeriod]}
                </div>
              </div>

              <Button
                onClick={() => handlePlanSelect("free")}
                disabled={isLoading !== null}
                variant="outline"
                className="w-full h-12 text-sm font-semibold"
              >
                {isLoading === "free" ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  freePlan.buttonText
                )}
              </Button>

              {freePlan.features.map((featureGroup, idx) => (
                <div key={idx} className="space-y-3">
                  <h4 className="font-semibold text-sm text-gray-900">
                    {featureGroup.category}
                  </h4>
                  <ul className="space-y-2">
                    {featureGroup.items.map((feature, featureIdx) => (
                      <li key={featureIdx} className="flex items-start gap-2 text-sm text-gray-700">
                        <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className="border-2 border-purple-500 hover:shadow-lg transition-all relative">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle className="text-2xl font-bold">{proPlan.name}</CardTitle>
                <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <span className="text-sm">👨‍🚀</span>
                </div>
              </div>
              <p className="text-gray-600 text-sm mt-1">{proPlan.subtitle}</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="pt-4 border-t">
                <div className="text-3xl font-bold text-gray-900">
                  {proPlan.price[billingPeriod]}
                </div>
                {billingPeriod === "yearly" && proPlan.yearlySavings && (
                  <p className="text-sm text-green-600 font-medium mt-1">
                    Save {proPlan.yearlySavings} per year
                  </p>
                )}
              </div>

              <PayPalButtons
                packageId="plus"
                packageName="Plus Plan"
                price={29}
                planId="P-2L869865T2585332XNC24EXA"
                hasActiveSubscription={false}
                isCurrentPlan={false}
                buttonLabel={proPlan.buttonText}
                buttonClassName="w-full h-12 text-sm font-semibold"
                buttonVariant="outline"
              />

              {proPlan.features.map((featureGroup, idx) => (
                <div key={idx} className="space-y-3">
                  <h4 className="font-semibold text-sm text-gray-900">
                    {featureGroup.category}
                  </h4>
                  <ul className="space-y-2">
                    {featureGroup.items.map((feature, featureIdx) => (
                      <li key={featureIdx} className="flex items-start gap-2 text-sm text-gray-700">
                        <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
