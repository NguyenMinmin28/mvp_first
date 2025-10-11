"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { Button } from "@/ui/components/button";
import { Badge } from "@/ui/components/badge";
import { CheckCircle, AlertCircle, Clock, CreditCard, Calendar } from "lucide-react";

interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  subscription?: {
    id: string;
    status: string;
    packageName: string;
    packagePrice: number;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    daysUntilBilling: number;
    cancelAtPeriodEnd: boolean;
    provider: string;
    paymentFailureCount: number;
    lastPayment?: {
      id: string;
      amount: number;
      currency: string;
      capturedAt: string;
    };
  };
}

export function SubscriptionStatusCard() {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await fetch("/api/billing/subscription-status");
      const data = await response.json();
      setSubscriptionStatus(data);
    } catch (error) {
      console.error("Error fetching subscription status:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "past_due":
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case "cancelled":
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "past_due":
        return <Badge className="bg-yellow-100 text-yellow-800">Past Due</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!subscriptionStatus?.hasActiveSubscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-gray-600 mb-4">You're currently on the Basic Plan</p>
            <Button 
              onClick={() => window.location.href = '/pricing'}
              className="w-full"
            >
              Upgrade Your Plan
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { subscription } = subscriptionStatus;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Subscription Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Plan Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon(subscription!.status)}
            <span className="font-medium">{subscription!.packageName}</span>
          </div>
          {getStatusBadge(subscription!.status)}
        </div>

        {/* Price */}
        <div className="text-2xl font-bold">
          ${subscription!.packagePrice}/month
        </div>

        {/* Billing Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>Current period: {formatDate(subscription!.currentPeriodStart)} - {formatDate(subscription!.currentPeriodEnd)}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4" />
            <span className={subscription!.daysUntilBilling <= 3 ? "text-yellow-600 font-medium" : "text-gray-600"}>
              {subscription!.daysUntilBilling > 0 
                ? `${subscription!.daysUntilBilling} days until next billing`
                : subscription!.daysUntilBilling === 0
                ? "Bills today"
                : "Billing overdue"
              }
            </span>
          </div>
        </div>

        {/* Auto-renewal Info */}
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 text-sm text-blue-800">
            <span>🔄</span>
            <span className="font-medium">Auto-renewal: {formatDate(subscription!.currentPeriodEnd)}</span>
          </div>
          {subscription!.cancelAtPeriodEnd && (
            <p className="text-xs text-red-600 mt-1">
              ⚠️ Subscription will be cancelled at the end of current period
            </p>
          )}
        </div>

        {/* Payment Issues */}
        {subscription!.paymentFailureCount > 0 && (
          <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center gap-2 text-sm text-yellow-800">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">
                {subscription!.paymentFailureCount} payment failure(s) this period
              </span>
            </div>
            <p className="text-xs text-yellow-600 mt-1">
              Please update your payment method to avoid service interruption
            </p>
          </div>
        )}

        {/* Last Payment */}
        {subscription!.lastPayment && (
          <div className="text-sm text-gray-600">
            <span className="font-medium">Last payment:</span> ${subscription!.lastPayment.amount} {subscription!.lastPayment.currency} on {formatDate(subscription!.lastPayment.capturedAt)}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.location.href = '/pricing'}
            className="flex-1"
          >
            Manage Subscription
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.location.href = '/billing/history'}
            className="flex-1"
          >
            Billing History
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
