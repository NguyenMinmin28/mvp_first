import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/features/auth/auth";
import { prisma } from "@/core/database/db";
import { paypalService } from "@/core/services/paypal.service";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { subscriptionId } = await request.json();

    if (!subscriptionId) {
      return NextResponse.json(
        { error: "Subscription ID is required" },
        { status: 400 }
      );
    }

    console.log("🔍 Verifying PayPal subscription:", subscriptionId);

    // Get subscription details from PayPal
    const paypalSubscription = await paypalService.getSubscription(subscriptionId);

    // Find client profile
    const clientProfile = await prisma.clientProfile.findUnique({
      where: {
        userId: session.user.id,
      },
      include: {
        user: true,
      },
    });

    if (!clientProfile) {
      return NextResponse.json(
        { error: "Client profile not found" },
        { status: 404 }
      );
    }

    // Log subscription details for debugging
    console.log("🔍 Subscription details:", {
      subscriptionId,
      status: paypalSubscription.status,
      paypalEmail: paypalSubscription.subscriber?.email_address,
      userEmail: clientProfile.user.email,
      planId: paypalSubscription.plan_id
    });

    // Check if subscription exists in our database
    const dbSubscription = await prisma.subscription.findFirst({
      where: {
        provider: "paypal",
        providerSubscriptionId: subscriptionId,
      },
      include: {
        package: true,
      },
    });

    if (dbSubscription) {
      console.log("✅ Subscription found in database:", {
        id: dbSubscription.id,
        status: dbSubscription.status,
        package: dbSubscription.package.name,
      });

      return NextResponse.json({
        success: true,
        subscription: {
          id: dbSubscription.id,
          status: dbSubscription.status,
          package: {
            name: dbSubscription.package.name,
            projectsPerMonth: dbSubscription.package.projectsPerMonth,
            contactClicksPerProject: dbSubscription.package.contactClicksPerProject,
          },
          currentPeriodStart: dbSubscription.currentPeriodStart,
          currentPeriodEnd: dbSubscription.currentPeriodEnd,
          isInTrial: dbSubscription.isInTrial,
        },
      });
    } else {
      console.log("⏳ Subscription not yet processed by webhook, creating manually for testing");

      // TEMPORARY: Create subscription manually for testing (since webhook is not setup)
      if (paypalSubscription.status === "ACTIVE" || paypalSubscription.status === "APPROVAL_PENDING") {
        // Find the package based on plan ID
        const package_ = await prisma.package.findFirst({
          where: {
            provider: "paypal",
            providerPlanId: paypalSubscription.billing_info.next_billing_time ? 
              paypalSubscription.plan_id : 
              paypalSubscription.plan_id,
          },
        });

        if (!package_) {
          return NextResponse.json({
            error: "Package not found for this subscription",
          }, { status: 400 });
        }

        // Check if client already used a free trial before
        // Promotion removed completely: never grant trial flags
        const trialStart = null;
        const trialEnd = null;

        // Create subscription manually
        const newSubscription = await prisma.subscription.create({
          data: {
            clientId: clientProfile.id,
            packageId: package_.id,
            provider: "paypal",
            providerSubscriptionId: subscriptionId,
            status: paypalSubscription.status === "ACTIVE" ? "active" : "past_due",
            startAt: new Date(),
            currentPeriodStart: new Date(),
            currentPeriodEnd: paypalSubscription.billing_info.next_billing_time ? 
              new Date(paypalSubscription.billing_info.next_billing_time) :
              new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            isInTrial: false,
            trialStart: trialStart,
            trialEnd: trialEnd,
          },
          include: {
            package: true,
          },
        });

        console.log("✅ Created subscription manually for testing:", newSubscription.id);

        // Also create a Payment record for the transaction history
        try {
          await prisma.payment.create({
            data: {
              subscriptionId: newSubscription.id,
              clientId: clientProfile.id,
              provider: "paypal",
              providerPaymentId: `SUB_${subscriptionId}`, // Use subscription ID as payment reference
              amount: package_.priceUSD,
              currency: "USD",
              status: "captured", // Mark as captured since subscription is active
              capturedAt: new Date(),
              metadata: {
                paypalSubscriptionId: subscriptionId,
                planId: paypalSubscription.plan_id,
                packageName: package_.name,
              },
            },
          });
          console.log("✅ Created payment record for transaction history");
        } catch (paymentError) {
          console.error("⚠️ Failed to create payment record:", paymentError);
          // Don't fail the subscription creation if payment record fails
        }

        return NextResponse.json({
          success: true,
          subscription: {
            id: newSubscription.id,
            status: newSubscription.status,
            package: {
              name: newSubscription.package.name,
              projectsPerMonth: newSubscription.package.projectsPerMonth,
              contactClicksPerProject: newSubscription.package.contactClicksPerProject,
            },
            currentPeriodStart: newSubscription.currentPeriodStart,
            currentPeriodEnd: newSubscription.currentPeriodEnd,
            isInTrial: newSubscription.isInTrial,
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: "Subscription is being processed. Please wait for confirmation.",
        subscription: {
          status: "pending",
          paypalStatus: paypalSubscription.status,
        },
      });
    }

  } catch (error: any) {
    console.error("Error verifying subscription:", error);
    
    if (error.message?.includes("PayPal API failed")) {
      return NextResponse.json(
        { error: "Unable to verify subscription with PayPal" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
