"use client";

import { useState, useEffect } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { Button } from "@/ui/components/button";
import { Badge } from "@/ui/components/badge";
import { LoadingSpinner } from "@/ui/components/loading-spinner";
import { toast } from "sonner";
import { SubscriptionWithPackage } from "@/core/types/subscription.types";

interface BillingTabProps {
  userRole: "CLIENT" | "DEVELOPER" | undefined;
}

export default function BillingTab({ userRole }: BillingTabProps) {
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAction, setIsLoadingAction] = useState(false);

  useEffect(() => {
    if (userRole === "CLIENT") {
      loadSubscriptions();
    }
  }, [userRole]);

  const loadSubscriptions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/user/subscriptions");
      if (response.ok) {
        const data = await response.json();
        setSubscriptions(data.subscriptions || []);
      }
    } catch (error) {
      console.error("Error loading subscriptions:", error);
      toast.error("Failed to load subscription data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    if (!confirm("Are you sure you want to cancel this subscription?")) {
      return;
    }

    setIsLoadingAction(true);
    try {
      const response = await fetch(
        `/api/user/subscriptions/${subscriptionId}/cancel`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        toast.success("Subscription cancelled successfully");
        loadSubscriptions(); // Reload data
      } else {
        throw new Error("Failed to cancel subscription");
      }
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      toast.error("Failed to cancel subscription");
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleRenewSubscription = async (subscriptionId: string) => {
    setIsLoadingAction(true);
    try {
      const response = await fetch(
        `/api/user/subscriptions/${subscriptionId}/renew`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        toast.success("Subscription renewed successfully");
        loadSubscriptions(); // Reload data
      } else {
        throw new Error("Failed to renew subscription");
      }
    } catch (error) {
      console.error("Error renewing subscription:", error);
      toast.error("Failed to renew subscription");
    } finally {
      setIsLoadingAction(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "past_due":
        return "destructive";
      case "canceled":
        return "secondary";
      default:
        return "outline";
    }
  };

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (userRole === "DEVELOPER") {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100  rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900  mb-2">
            Billing Not Available
          </h3>
          <p className="text-gray-600  max-w-md mx-auto">
            Developers don&apos;t have billing information. This section is only
            available for clients with active subscriptions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Billing & Subscriptions
          </h2>
          <p className="text-gray-600 mt-1">
            Manage your subscription plans and billing information
          </p>
        </div>
        <Button onClick={() => window.open("/pricing", "_blank")}>
          View Plans
        </Button>
      </div>

      {/* Current Subscription */}
      <Card>
        <CardHeader>
          <CardTitle>Current Subscription</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <LoadingSpinner size="lg" />
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-gray-100  rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900  mb-2">
                No Active Subscription
              </h3>
              <p className="text-gray-600  mb-4">
                You don&apos;t have any active subscriptions at the moment.
              </p>
              <Button onClick={() => window.open("/pricing", "_blank")}>
                Choose a Plan
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {subscriptions.map((subscription: any) => (
                <div
                  key={subscription.id}
                  className="border rounded-lg p-4 space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-semibold text-gray-900">
                          {subscription.package.name}
                        </h4>
                        <Badge
                          variant={getStatusBadgeVariant(subscription.status)}
                        >
                          {subscription.status.toUpperCase()}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Price:</span> $
                          {subscription.package.priceUSD}/month
                        </div>
                        <div>
                          <span className="font-medium">Projects:</span>{" "}
                          {subscription.package.projectsPerMonth}/month
                        </div>
                        <div>
                          <span className="font-medium">Contacts:</span>{" "}
                          {subscription.package.contactClicksPerProject}/project
                        </div>
                      </div>

                      <div className="mt-3">
                        <span className="font-medium text-sm text-gray-700">
                          Features:
                        </span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {subscription.package.features.map(
                            (feature: any, index: number) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="text-xs"
                              >
                                {feature}
                              </Badge>
                            )
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Started:</span>{" "}
                          {formatDate(subscription.startAt)}
                        </div>
                        <div>
                          <span className="font-medium">Current Period:</span>{" "}
                          {formatDate(subscription.currentPeriodStart)} -{" "}
                          {formatDate(subscription.currentPeriodEnd)}
                        </div>
                      </div>

                      <div className="mt-3">
                        <span className="font-medium text-sm text-gray-700">
                          Payment Provider:
                        </span>
                        <Badge variant="outline" className="ml-2">
                          {subscription.provider.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2 border-t">
                    {subscription.status === "active" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleCancelSubscription(subscription.id)
                        }
                        disabled={isLoadingAction}
                      >
                        {isLoadingAction ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          "Cancel Subscription"
                        )}
                      </Button>
                    )}

                    {subscription.status === "canceled" && (
                      <Button
                        size="sm"
                        onClick={() => handleRenewSubscription(subscription.id)}
                        disabled={isLoadingAction}
                      >
                        {isLoadingAction ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          "Renew Subscription"
                        )}
                      </Button>
                    )}

                    {subscription.status === "past_due" && (
                      <Button
                        size="sm"
                        onClick={() =>
                          window.open("/billing/update-payment", "_blank")
                        }
                      >
                        Update Payment Method
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 bg-gray-100  rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900  mb-2">
              Billing History
            </h3>
            <p className="text-gray-600  mb-4">
              View your past invoices and payment history.
            </p>
            <Button
              variant="outline"
              onClick={() => window.open("/billing/history", "_blank")}
            >
              View History
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 bg-gray-100  rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900  mb-2">
              Payment Methods
            </h3>
            <p className="text-gray-600  mb-4">
              Manage your payment methods and billing preferences.
            </p>
            <Button
              variant="outline"
              onClick={() => window.open("/billing/payment-methods", "_blank")}
            >
              Manage Payment Methods
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
