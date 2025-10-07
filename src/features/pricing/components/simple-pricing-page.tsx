"use client";

import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { Button } from "@/ui/components/button";
import { PayPalButtons } from "@/features/billing/components/paypal-buttons";
import { CheckCircle, Check, Sparkles, Zap, Crown, TrendingUp } from "lucide-react";

type Plan = {
  id: string;
  name: string;
  price: string;
  priceNumber: number;
  period: string;
  features: string[];
  cta: string;
  providerPlanId: string;
  popular?: boolean;
  icon: React.ReactNode;
  gradient: string;
  badge?: string;
  description: string;
  highlight?: string;
};

const plans: Plan[] = [
  {
    id: "basic",
    name: "Basic Plan",
    price: "$0",
    priceNumber: 0,
    period: "/monthly",
    description: "Perfect for getting started",
    features: [
      "Monthly Post 1 project free.",
      "Contact up to 10 freelancer per project.",
      "Get notified when freelancers show interest.",
      "Basic support",
    ],
    cta: "CHOOSE YOUR PLAN",
    providerPlanId: "P-BASIC-PLAN-ID",
    icon: <Sparkles className="w-8 h-8" />,
    gradient: "from-blue-50 to-cyan-50",
    badge: "Free Forever",
  },
  {
    id: "plus",
    name: "Plus Plan",
    price: "$19.95",
    priceNumber: 19.95,
    period: "/monthly",
    description: "Most popular for growing businesses",
    popular: true,
    features: [
      "Post up to 10 projects per month.",
      "Unlimited contacts per project.",
      "Get notified when freelancers show interest.",
      "Priority support",
      "Advanced analytics dashboard",
    ],
    cta: "CHOOSE YOUR PLAN",
    providerPlanId: "P-2L869865T2585332XNC24EXA",
    icon: <Zap className="w-8 h-8" />,
    gradient: "from-purple-50 to-pink-50",
    badge: "Most Popular",
    highlight: "Best Value",
  },
  {
    id: "pro",
    name: "Pro Plan",
    price: "$99.95",
    priceNumber: 99.95,
    period: "/monthly",
    description: "For high-volume professionals",
    features: [
      "Unlimited project postings",
      "Unlimited contacts per project.",
      "Get notified when freelancers show interest.",
      "Dedicated account manager",
      "24/7 Premium support",
      "Custom integrations",
    ],
    cta: "CHOOSE YOUR PLAN",
    providerPlanId: "P-6BH23931L7595043MNC24EXQ",
    icon: <Crown className="w-8 h-8" />,
    gradient: "from-amber-50 to-orange-50",
    badge: "Enterprise",
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
    <section className="w-full py-14 md:py-24 bg-white">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-800 px-4 py-2 rounded-full text-sm font-semibold mb-6 border border-gray-200">
            <TrendingUp className="w-4 h-4 text-gray-700" />
            Simple, transparent pricing
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-4">
            Choose Your Perfect Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get started for free, upgrade when you need more. No hidden fees, cancel anytime.
          </p>
        </div>

        {/* Current Subscription Banner */}
        {session && (
          <div className="mb-12 p-6 bg-gray-50 border border-gray-200 rounded-2xl max-w-3xl mx-auto shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">
                  {currentSubscription?.package?.name || "Basic Plan"}{" "}
                  {currentSubscription ? "Active" : "Active"}
                </h3>
                <p className="text-sm text-gray-700 mt-1">
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

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch mb-16">
          {plans.map((plan) => {
            const isPopular = plan.popular;
            return (
              <Card
                key={plan.id}
                className={`relative overflow-hidden flex flex-col transition-all duration-300 ${
                  isPopular 
                    ? "border-2 border-gray-900 shadow-2xl scale-[1.02] z-10" 
                    : "border border-gray-200 hover:border-gray-300 hover:shadow-xl"
                } ${plan.id === "basic" && session ? "opacity-90" : ""}`}
              >
                {/* Popular Badge */}
                {isPopular && (
                  <div className="absolute top-4 right-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-900 text-white border border-gray-900">
                      Recommended
                    </span>
                  </div>
                )}

                {/* Plan Badge (non-popular) */}
                {!isPopular && plan.badge && (
                  <div className="absolute top-4 right-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-900 border border-gray-300">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <CardHeader className={`bg-gradient-to-br from-gray-50 to-gray-100 ${isPopular ? 'pt-16 pb-8' : 'pt-8 pb-8'} border-b border-gray-200`}>
                  <div className="text-center space-y-4">
                    {/* Icon */}
                    <div className="flex justify-center">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center bg-white text-gray-900 border border-gray-200 shadow-sm`}>
                        {plan.icon}
                      </div>
                    </div>

                    {/* Plan Name */}
                    <CardTitle className="text-2xl font-bold text-gray-900">
                      {plan.name}
                    </CardTitle>

                    {/* Description */}
                    <p className="text-sm text-gray-600 font-medium">
                      {plan.description}
                    </p>

                    {/* Price */}
                    <div className="py-4">
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-5xl font-extrabold text-gray-900">{plan.price}</span>
                        <span className="text-lg text-gray-500 font-medium">{plan.period}</span>
                      </div>
                      {plan.highlight && (
                        <div className="mt-2">
                          <span className="inline-block bg-gray-900 text-white px-3 py-1 rounded-full text-xs font-semibold">
                            {plan.highlight}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col pt-8 pb-6 px-6">
                  {/* Plan Button */}
                  <div className="mb-6">
                    {renderPlanButton(plan)}
                  </div>

                  {/* Features List */}
                  <div className="space-y-4 flex-1">
                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                      What's Included:
                    </h4>
                    <ul className="space-y-3">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-3 group">
                          <span className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full shrink-0 bg-gray-900`}>
                            <Check className="w-3 h-3 text-white" />
                          </span>
                          <span className="text-sm text-gray-700 leading-relaxed font-medium">
                            {f}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Feature Comparison Table */}
        <div className="mt-20 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">Compare Plans</h2>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left py-4 px-6 font-bold text-gray-900">Feature</th>
                  <th className="text-center py-4 px-6 font-bold text-gray-900">Basic</th>
                  <th className="text-center py-4 px-6 font-bold text-gray-900">Plus</th>
                  <th className="text-center py-4 px-6 font-bold text-gray-900">Pro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6 font-medium text-gray-700">Projects per month</td>
                  <td className="text-center py-4 px-6 text-gray-600">1</td>
                  <td className="text-center py-4 px-6 text-gray-600">10</td>
                  <td className="text-center py-4 px-6 font-semibold text-gray-900">Unlimited</td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6 font-medium text-gray-700">Contacts per project</td>
                  <td className="text-center py-4 px-6 text-gray-600">10</td>
                  <td className="text-center py-4 px-6 font-semibold text-gray-900">Unlimited</td>
                  <td className="text-center py-4 px-6 font-semibold text-gray-900">Unlimited</td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6 font-medium text-gray-700">Support</td>
                  <td className="text-center py-4 px-6 text-gray-600">Basic</td>
                  <td className="text-center py-4 px-6 text-gray-600">Priority</td>
                  <td className="text-center py-4 px-6 font-semibold text-gray-900">24/7 Premium</td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6 font-medium text-gray-700">Analytics Dashboard</td>
                  <td className="text-center py-4 px-6 text-gray-400">—</td>
                  <td className="text-center py-4 px-6"><Check className="w-5 h-5 text-gray-900 mx-auto" /></td>
                  <td className="text-center py-4 px-6"><Check className="w-5 h-5 text-gray-900 mx-auto" /></td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6 font-medium text-gray-700">Account Manager</td>
                  <td className="text-center py-4 px-6 text-gray-400">—</td>
                  <td className="text-center py-4 px-6 text-gray-400">—</td>
                  <td className="text-center py-4 px-6"><Check className="w-5 h-5 text-gray-900 mx-auto" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
              <h4 className="font-bold mb-3 text-gray-900 text-lg flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-sm">?</div>
                Can I switch plans anytime?
              </h4>
              <p className="text-gray-600 leading-relaxed">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate the difference.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
              <h4 className="font-bold mb-3 text-gray-900 text-lg flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-sm">?</div>
                What payment methods do you accept?
              </h4>
              <p className="text-gray-600 leading-relaxed">
                We accept all major credit cards and PayPal. All payments are processed securely through PayPal's payment gateway.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
              <h4 className="font-bold mb-3 text-gray-900 text-lg flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-sm">?</div>
                Is there a free trial?
              </h4>
              <p className="text-gray-600 leading-relaxed">
                Our Basic Plan is free forever! You can post 1 project per month at no cost. Perfect for trying out the platform.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
              <h4 className="font-bold mb-3 text-gray-900 text-lg flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-sm">?</div>
                Can I cancel anytime?
              </h4>
              <p className="text-gray-600 leading-relaxed">
                Absolutely! There are no long-term contracts. Cancel your subscription anytime from your profile settings.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <div className="bg-gray-900 rounded-2xl p-12 shadow-2xl">
            <h3 className="text-3xl font-bold text-white mb-4">Still have questions?</h3>
            <p className="text-gray-300 text-lg mb-6 max-w-2xl mx-auto">
              Our team is here to help you choose the perfect plan for your needs.
            </p>
            <Button 
              size="lg" 
              variant="secondary"
              className="bg-white text-gray-900 hover:bg-gray-100 font-bold px-8 py-6 text-lg rounded-xl shadow-lg"
            >
              Contact Support
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
