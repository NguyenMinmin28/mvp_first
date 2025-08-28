import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/auth";
import { prisma as db } from "@/core/database/db";
import { CreatePaymentRequest } from "@/core/types/subscription.types";

// GET /api/user/subscriptions/[id]/payments
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "CLIENT") {
      return NextResponse.json(
        { error: "Only clients can access payment data" },
        { status: 403 }
      );
    }

    const subscriptionId = params.id;

    // Verify the subscription belongs to the user
    const subscription = await db.subscription.findFirst({
      where: {
        id: subscriptionId,
        client: {
          userId: session.user.id,
        },
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    // Get payments for this subscription
    const payments = await db.payment.findMany({
      where: {
        subscriptionId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      payments,
    });
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/user/subscriptions/[id]/payments
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "CLIENT") {
      return NextResponse.json(
        { error: "Only clients can create payments" },
        { status: 403 }
      );
    }

    const subscriptionId = params.id;
    const body: CreatePaymentRequest = await request.json();
    if (body.provider !== "paypal") {
      return NextResponse.json(
        { error: "Only PayPal payments are supported" },
        { status: 400 }
      );
    }

    // Verify the subscription belongs to the user
    const subscription = await db.subscription.findFirst({
      where: {
        id: subscriptionId,
        client: {
          userId: session.user.id,
        },
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    // Create payment record
    const payment = await db.payment.create({
      data: {
        subscriptionId,
        clientId: body.clientId,
        provider: body.provider,
        providerPaymentId: body.providerPaymentId,
        amount: body.amount,
        currency: "USD",
        status: "created",
      },
    });

    // TODO: Integrate with actual payment providers (PayPal/Razorpay)
    // This would typically involve calling the payment provider's API
    // For now, we'll return the payment record

    return NextResponse.json({
      payment,
      success: true,
      message: "Payment created successfully",
    });
  } catch (error) {
    console.error("Error creating payment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
