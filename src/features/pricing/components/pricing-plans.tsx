"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { Button } from "@/ui/components/button";
import { Badge } from "@/ui/components/badge";
import { 
  Check, 
  Star, 
  Zap, 
  Users, 
  Eye, 
  RefreshCw, 
  Clock,
  Shield,
  Crown,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  period: string;
  description: string;
  popular?: boolean;
  features: string[];
  projectsPerMonth: number;
  contactRevealsPerProject: number;
  responseTimeGuarantee: string;
  support: string;
  icon: React.ReactNode;
  gradient: string;
  buttonText: string;
  comingSoon?: boolean;
}

const plans: PricingPlan[] = [
  {
    id: "basic",
    name: "Basic",
    price: 29,
    currency: "USD",
    period: "month",
    description: "Perfect for small projects and startups",
    features: [
      "5 projects per month",
      "2 contact reveals per project",
      "Expert + Mid + Fresher rotation",
      "15-minute response window",
      "Email support",
      "Project management dashboard"
    ],
    projectsPerMonth: 5,
    contactRevealsPerProject: 2,
    responseTimeGuarantee: "15 minutes",
    support: "Email support",
    icon: <Users className="h-6 w-6" />,
    gradient: "from-blue-50 to-indigo-50  
    buttonText: "Get Started"
  },
  {
    id: "standard",
    name: "Standard",
    price: 79,
    currency: "USD",
    period: "month",
    description: "Most popular for growing businesses",
    popular: true,
    features: [
      "15 projects per month",
      "5 contact reveals per project", 
      "Priority rotation placement",
      "10-minute response window",
      "Advanced analytics dashboard",
      "Priority email support",
      "Custom skill requirements",
      "Batch refresh unlimited"
    ],
    projectsPerMonth: 15,
    contactRevealsPerProject: 5,
    responseTimeGuarantee: "10 minutes",
    support: "Priority email support",
    icon: <Star className="h-6 w-6" />,
    gradient: "from-purple-50 to-pink-50  
    buttonText: "Most Popular"
  },
  {
    id: "premium",
    name: "Premium",
    price: 199,
    currency: "USD", 
    period: "month",
    description: "For enterprises and high-volume clients",
    features: [
      "Unlimited projects",
      "Unlimited contact reveals",
      "Instant developer matching",
      "5-minute response window",
      "Dedicated account manager",
      "24/7 phone + chat support",
      "Custom integration API",
      "Advanced reporting suite",
      "SLA guarantee"
    ],
    projectsPerMonth: 999,
    contactRevealsPerProject: 999,
    responseTimeGuarantee: "5 minutes",
    support: "24/7 phone + chat",
    icon: <Crown className="h-6 w-6" />,
    gradient: "from-amber-50 to-orange-50  
    buttonText: "Contact Sales"
  }
];

export default function PricingPlans() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleSelectPlan = async (planId: string) => {
    setIsLoading(planId);
    
    // Simulate API call for now
    setTimeout(() => {
      if (planId === "premium") {
        toast.success("We'll be in touch with enterprise pricing details!");
      } else {
        toast.info("Payment integration coming in Sprint 2! Plan selection noted.");
      }
      setIsLoading(null);
    }, 1000);
  };

  const getYearlyPrice = (monthlyPrice: number) => {
    return Math.round(monthlyPrice * 12 * 0.83); // 17% discount
  };

  return (
    <div className="space-y-8">
      {/* Free Trial Banner */}
      <Card className="border-green-200 bg-green-50  
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-3">
            <Sparkles className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold text-green-900  text-lg">
              🎉 Free Trial: Post 1 project with full features - No credit card required
            </h3>
          </div>
        </CardContent>
      </Card>

      {/* Billing Toggle */}
      <div className="flex justify-center">
        <div className="flex items-center bg-gray-100  rounded-lg p-1">
          <Button
            variant={billingPeriod === "monthly" ? "default" : "ghost"}
            size="sm"
            onClick={() => setBillingPeriod("monthly")}
            className="rounded-md"
          >
            Monthly
          </Button>
          <Button
            variant={billingPeriod === "yearly" ? "default" : "ghost"}
            size="sm"
            onClick={() => setBillingPeriod("yearly")}
            className="rounded-md"
          >
            Yearly
            <Badge className="ml-2 bg-green-500 text-white text-xs">Save 17%</Badge>
          </Button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => {
          const isPopular = plan.popular;
          const displayPrice = billingPeriod === "yearly" ? getYearlyPrice(plan.price) : plan.price;
          const isProcessing = isLoading === plan.id;

          return (
            <Card 
              key={plan.id} 
              className={`relative overflow-hidden transition-all hover:shadow-lg ${
                isPopular 
                  ? 'border-purple-200 shadow-lg scale-105  
                  : 'border-gray-200 
              }`}
            >
              {isPopular && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-center py-2 text-sm font-medium">
                  Most Popular
                </div>
              )}
              
              <CardHeader className={`bg-gradient-to-br ${plan.gradient} ${isPopular ? 'pt-12' : 'pt-6'}`}>
                <div className="text-center space-y-2">
                  <div className="flex justify-center">{plan.icon}</div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <p className="text-gray-600 
                  
                  <div className="py-4">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold">${displayPrice}</span>
                      <span className="text-gray-600 
                        /{billingPeriod === "yearly" ? "year" : "month"}
                      </span>
                    </div>
                    {billingPeriod === "yearly" && (
                      <p className="text-sm text-green-600  mt-1">
                        Save ${(plan.price * 12) - displayPrice} per year
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-6 space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50  rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {plan.projectsPerMonth === 999 ? "∞" : plan.projectsPerMonth}
                    </div>
                    <div className="text-xs text-gray-600 
                      Projects/month
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {plan.contactRevealsPerProject === 999 ? "∞" : plan.contactRevealsPerProject}
                    </div>
                    <div className="text-xs text-gray-600 
                      Reveals/project
                    </div>
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Guarantees */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span>{plan.responseTimeGuarantee} response guarantee</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="h-4 w-4 text-green-500" />
                    <span>{plan.support}</span>
                  </div>
                </div>

                {/* CTA Button */}
                <Button
                  className={`w-full ${
                    isPopular 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600' 
                      : ''
                  }`}
                  size="lg"
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    plan.buttonText
                  )}
                </Button>

                {plan.id === "basic" && (
                  <p className="text-xs text-center text-gray-500">
                    Start with free trial
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* FAQ Section */}
      <Card className="mt-12">
        <CardHeader>
          <CardTitle className="text-center">Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">How does the rotation system work?</h4>
              <p className="text-sm text-gray-600 
                Our fair rotation ensures equal opportunities for all developers. You get a mix of Expert, Mid-level, and Fresher developers for each project, with response guarantees.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">What happens after the free trial?</h4>
              <p className="text-sm text-gray-600 
                After your free project, choose a plan to continue posting projects. No automatic charges - you control when to upgrade.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Can I change plans anytime?</h4>
              <p className="text-sm text-gray-600 
                Yes! Upgrade or downgrade your plan anytime. Changes take effect on your next billing cycle.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">What currencies do you support?</h4>
              <p className="text-sm text-gray-600 
                Currently USD, with plans to support EUR, GBP, and other major currencies soon.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enterprise CTA */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50   border-indigo-200 
        <CardContent className="pt-6 text-center">
          <h3 className="text-xl font-semibold mb-2">Need a custom solution?</h3>
          <p className="text-gray-600  mb-4">
            Enterprise plans with custom quotas, dedicated support, and API access available.
          </p>
          <Button variant="outline" size="lg">
            Contact Enterprise Sales
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
