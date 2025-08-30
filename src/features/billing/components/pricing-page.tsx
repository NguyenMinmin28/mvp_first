"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/components/card";
import { Button } from "@/ui/components/button";
import { Badge } from "@/ui/components/badge";
import { CheckCircle, Star, Zap, Crown } from "lucide-react";
import { PayPalButtons } from "@/features/billing/components/paypal-buttons";

interface Package {
  id: string;
  name: string;
  priceUSD: number;
  projectsPerMonth: number;
  contactClicksPerProject: number;
  features: string[];
  isPopular: boolean;
  provider: string;
  providerPlanId: string;
  interval: string;
  trialPeriodDays: number;
  trialProjectsCount: number;
}

interface CurrentSubscription {
  id: string;
  status: string;
  package: {
    name: string;
    priceUSD: number;
  };
  currentPeriodEnd: string;
  isInTrial: boolean;
}

interface PricingPageProps {
  currentSubscription?: CurrentSubscription | null;
}

export function PricingPage({ currentSubscription }: PricingPageProps) {
  const { data: session } = useSession();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const response = await fetch("/api/billing/packages");
      const data = await response.json();
      
      if (data.success) {
        setPackages(data.packages);
      }
    } catch (error) {
      console.error("Error fetching packages:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPackageIcon = (packageName: string) => {
    switch (packageName.toLowerCase()) {
      case "basic":
        return <Zap className="h-6 w-6" />;
      case "standard":
        return <Star className="h-6 w-6" />;
      case "premium":
        return <Crown className="h-6 w-6" />;
      default:
        return <CheckCircle className="h-6 w-6" />;
    }
  };

  const getPackageColor = (packageName: string) => {
    switch (packageName.toLowerCase()) {
      case "basic":
        return "border-blue-300 bg-blue-100/50";
      case "standard":
        return "border-purple-300 bg-purple-100/50  ring-2 ring-purple-500";
      case "premium":
        return "border-yellow-300 bg-yellow-100/50";
      default:
        return "border-gray-300 bg-gray-100/50";
    }
  };

  const handleSubscriptionSuccess = (subscriptionId: string) => {
    console.log("Subscription created:", subscriptionId);
    // Optionally redirect or show success message
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading pricing plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Choose Your Plan
        </h1>
        <p className="text-xl text-foreground/80 max-w-2xl mx-auto">
          Post projects, find skilled developers, and manage your hiring process with our flexible pricing plans.
        </p>
      </div>

      {/* Current Subscription Alert */}
      {currentSubscription && (
        <div className="mb-8 p-4 bg-green-100/80  border border-green-300  rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-green-800">
                Current Plan: {currentSubscription.package.name}
              </h3>
              <p className="text-green-700">
                ${currentSubscription.package.priceUSD}/month • 
                {currentSubscription.isInTrial ? " In Trial Period" : ` Renews ${new Date(currentSubscription.currentPeriodEnd).toLocaleDateString()}`}
              </p>
            </div>
            <Badge variant="outline" className="bg-green-200 text-green-800">
              Active
            </Badge>
          </div>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="relative grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
        {packages.map((pkg) => {
          const isCurrentPlan = currentSubscription?.package.name === pkg.name;
          
          return (
            <Card key={pkg.id} className={`relative ${getPackageColor(pkg.name)} ${pkg.isPopular ? "scale-105" : ""} shadow-lg hover:shadow-xl transition-all duration-300`}>
              {pkg.isPopular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-purple-500 text-white px-4 py-1">
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  {getPackageIcon(pkg.name)}
                </div>
                <CardTitle className="text-2xl">{pkg.name}</CardTitle>
                <CardDescription className="text-lg">
                  <span className="text-3xl font-bold text-foreground">
                    ${pkg.priceUSD}
                  </span>
                  <span className="text-foreground/70">/{pkg.interval}</span>
                </CardDescription>
                {pkg.trialPeriodDays > 0 && (
                  <Badge variant="secondary" className="mt-2">
                    {pkg.trialPeriodDays}-day free trial
                  </Badge>
                )}
              </CardHeader>

              <CardContent>
                {/* Key Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-background/80  rounded-lg border">
                  <div className="text-center">
                    <div className="font-bold text-lg text-foreground">{pkg.projectsPerMonth}</div>
                    <div className="text-sm text-foreground/70">Projects/month</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg text-foreground">{pkg.contactClicksPerProject}</div>
                    <div className="text-sm text-foreground/70">Contacts/project</div>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-6">
                  {pkg.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                {isCurrentPlan ? (
                  <div className="space-y-2">
                    <Button disabled className="w-full bg-green-600 text-white">
                      ✓ Current Plan
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      You're currently subscribed to this plan
                    </p>
                  </div>
                ) : session ? (
                  <PayPalButtons
                    packageId={pkg.id}
                    packageName={pkg.name}
                    price={pkg.priceUSD}
                    planId={pkg.providerPlanId}
                    isCurrentPlan={isCurrentPlan}
                    hasActiveSubscription={!!currentSubscription}
                  />
                ) : (
                  <Button className="w-full" onClick={() => window.location.href = "/auth/signin"}>
                    Sign In to Subscribe
                  </Button>
                )}

                {/* PayPal Plan ID Warning */}
                {pkg.providerPlanId.includes("_PLAN_ID") && (
                  <p className="text-xs text-amber-600 mt-2 text-center">
                    ⚠️ PayPal plan not configured yet
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* FAQ or Additional Info */}
      <div className="mt-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Need help choosing?</h2>
        <p className="text-foreground/80 mb-6">
          All plans include our core matching algorithm and basic support. 
          You can upgrade or downgrade at any time.
        </p>
        <div className="flex justify-center gap-4">
          <Button variant="outline">
            Contact Sales
          </Button>
          <Button variant="outline">
            View FAQ
          </Button>
        </div>
      </div>
    </div>
  );
}
