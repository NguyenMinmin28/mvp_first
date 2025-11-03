"use client";

import { useState, useEffect } from "react";
import { Button } from "@/ui/components/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/ui/components/dialog";
import { toast } from "sonner";

// PayPal Client ID is available via process.env on client side
declare global {
  interface Window {
    paypal?: any;
  }
}

interface PayPalButtonsProps {
  packageId: string;
  packageName: string;
  price: number;
  planId: string;
  isCurrentPlan?: boolean;
  hasActiveSubscription?: boolean;
  // Optional custom label for the trigger button
  buttonLabel?: string;
  // Optional custom class for the trigger button (to control visual state)
  buttonClassName?: string;
  // Optional variant for the trigger button (default|outline|secondary|ghost|link|destructive)
  buttonVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

export function PayPalButtons({ packageId, packageName, price, planId, isCurrentPlan, hasActiveSubscription, buttonLabel, buttonClassName, buttonVariant }: PayPalButtonsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    loadPayPalScript();
  }, []);

  useEffect(() => {
    if (isModalOpen && scriptLoaded) {
      console.log("🔍 Modal opened, rendering PayPal button...");
      // Render PayPal button when modal opens
      setTimeout(() => {
        handlePayPalSubscribe();
      }, 100);
    }
  }, [isModalOpen, scriptLoaded]);

  const loadPayPalScript = () => {
    // Check if script is already loaded
    if (window.paypal) {
      setScriptLoaded(true);
      return;
    }

    // Check if script is already in DOM
    const existingScript = typeof document !== 'undefined' ? document.querySelector('script[src*="paypal.com/sdk/js"]') : null;
    if (existingScript) {
      existingScript.addEventListener('load', () => {
        setScriptLoaded(true);
      });
      return;
    }

    // Create and load PayPal script
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&vault=true&intent=subscription`;
    script.async = true;
    
    script.onload = () => {
      setScriptLoaded(true);
    };
    
    script.onerror = () => {
      console.error("Failed to load PayPal SDK");
    };

    if (typeof document !== 'undefined' && document.head) {
      document.head.appendChild(script);
    }
  };

  const handlePayPalSubscribe = async () => {
    console.log("🔍 Starting PayPal subscription process...");
    setIsLoading(true);
    
    try {
      // Wait for PayPal SDK to load
      if (!scriptLoaded) {
        console.log("❌ PayPal SDK not loaded yet");
        throw new Error("PayPal SDK not loaded yet");
      }
      
      const paypal = window.paypal;
      if (!paypal) {
        console.log("❌ PayPal SDK not available");
        throw new Error("PayPal SDK not available");
      }
      
      console.log("✅ PayPal SDK loaded successfully");

      // Clear any existing buttons
      const container = typeof document !== 'undefined' ? document.getElementById("paypal-button-container") : null;
      console.log("🔍 PayPal container found:", !!container);
      if (container && (container as any).isConnected && container.parentNode) {
        container.innerHTML = '';
        console.log("🔍 Container cleared, ready for PayPal button");
      } else {
        console.error("❌ PayPal container not found or not connected!");
        setIsLoading(false);
        return;
      }

      // Create and render PayPal button
      paypal.Buttons({
        style: {
          shape: 'rect',
          color: 'blue',
          layout: 'vertical',
          label: 'subscribe',
          height: 40,
        },
        createSubscription: async (data: any, actions: any) => {
          try {
            // Resolve plan id on server (promotions disabled -> always paid plan)
            const resp = await fetch("/api/billing/plan-id", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ packageId })
            });
            const result = await resp.json();
            // Always use paid plan id returned (server now always returns paid plan)
            let planToUse = resp.ok && result.planId ? result.planId : planId;
            console.log("Creating subscription for plan:", planToUse);
            return actions.subscription.create({ plan_id: planToUse });
          } catch (e) {
            console.error("Failed to resolve plan id, fallback to provided planId", e);
            return actions.subscription.create({ plan_id: planId });
          }
        },
        onApprove: async (data: any) => {
          try {
            console.log("✅ PayPal subscription created:", data.subscriptionID);
            
            // Verify subscription with our backend
            const response = await fetch("/api/paypal/subscriptions/verify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                subscriptionId: data.subscriptionID,
              }),
            });

            const result = await response.json();

            if (response.ok) {
              const isActive = result.subscription?.status === 'active';
              const title = isActive ? "Subscription Activated" : "Subscription Created";
              const description = isActive
                ? `${packageName} is now active. Enjoy your benefits!`
                : `Your ${packageName} plan will be activated shortly.`;

              toast.success(title, {
                description,
                action: {
                  label: "View Billing",
                  onClick: () => window.location.assign("/profile#billing")
                },
                className: "bg-emerald-600 text-white border-none",
                duration: 4000
              });

              // Refresh the page to update subscription status
              setTimeout(() => window.location.reload(), 600);
            } else {
              throw new Error(result.error || "Verification failed");
            }
          } catch (error: any) {
            console.error('Subscription verification error:', error);
            const errorMessage = error.message || 'Unknown error occurred';
            toast.error("Verification failed", {
              description: `${errorMessage}. Please contact support if this persists.`
            });
          }
        },
        onError: (err: any) => {
          console.error("PayPal error:", err);
          toast.error("Payment failed. Please try again.");
        },
        onCancel: (data: any) => {
          console.log("PayPal subscription cancelled");
          toast.info("Subscription cancelled");
        },
      }).render("#paypal-button-container").then(() => {
        console.log("✅ PayPal button rendered successfully");
      }).catch((error: any) => {
        console.error("❌ Failed to render PayPal button:", error);
        alert("Failed to initialize PayPal button. Please try again.");
      });

    } catch (error: any) {
      console.error("Error initializing PayPal:", error);
      alert("Failed to initialize payment. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Credit card payments are not supported. We only use PayPal.

  if (isCurrentPlan) {
    return (
      <Button disabled className="w-full bg-green-600 text-white">
        ✓ Current Plan
      </Button>
    );
  }

  return (
    <>
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogTrigger asChild>
          <Button className={buttonClassName ? buttonClassName : "w-full"} variant={buttonVariant} disabled={isLoading}>
            {isLoading
              ? "Processing..."
              : buttonLabel
                ? buttonLabel
                : hasActiveSubscription
                  ? (isCurrentPlan ? "Current Plan" : "Change Plan")
                  : "Subscribe"}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pay with PayPal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              {hasActiveSubscription ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    {isCurrentPlan ? 'Current Plan' : 'Change Subscription'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isCurrentPlan 
                      ? `You're currently on ${packageName} plan`
                      : `Switch to ${packageName} for ${price}/month`
                    }
                  </p>
                  {!isCurrentPlan && (
                    <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                      Development mode: Use test credentials
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mb-4">
                  Subscribe to {packageName} for ${price}/month
                </p>
              )}
            </div>
            
                        <div className="space-y-3">
              {/* PayPal Button Container */}
              <div id="paypal-button-container" className="w-full min-h-[40px] border border-dashed border-gray-300 rounded p-2 flex items-center justify-center">
                {!scriptLoaded ? (
                  <span className="text-sm text-muted-foreground">Loading PayPal...</span>
                ) : (
                  <span className="text-sm text-muted-foreground">PayPal button will appear here</span>
                )}
              </div>
              
            </div>
            
            <div className="text-xs text-muted-foreground text-center">
              Secure payment powered by PayPal
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
    </>
  );
}
