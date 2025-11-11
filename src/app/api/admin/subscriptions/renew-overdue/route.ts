import { NextRequest, NextResponse } from "next/server";
import { getServerSessionUser } from "@/features/auth/auth-server";
import { prisma } from "@/core/database/db";
import { billingService } from "@/modules/billing/billing.service";
import { logger } from "@/lib/logger";

/**
 * API endpoint để gia hạn thủ công các subscription đã quá hạn
 * Chỉ dành cho admin
 */
export async function POST(request: NextRequest) {
  try {
    // Kiểm tra quyền admin
    const user = await getServerSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    const now = new Date();
    
    // Tìm các subscription Plus Plan đã quá hạn nhưng vẫn active
    // Chỉ xử lý các subscription có PayPal subscription ID thật (không phải internal)
    const overdueSubscriptions = await prisma.subscription.findMany({
      where: {
        status: "active",
        currentPeriodEnd: {
          lt: now // Đã quá hạn
        },
        package: {
          name: "Plus Plan" // Chỉ gia hạn Plus Plan
        },
        provider: "paypal", // Chỉ xử lý PayPal subscriptions
        // Chỉ xử lý subscriptions có PayPal subscription ID thật
        // Skip internal subscriptions (basic-*, internal-*)
        providerSubscriptionId: {
          not: {
            startsWith: "basic-"
          }
        }
      },
      include: {
        package: true,
        client: {
          include: {
            user: {
              select: {
                email: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (overdueSubscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No overdue subscriptions found",
        renewed: 0
      });
    }

    const results = [];
    
    // Gia hạn từng subscription
    for (const subscription of overdueSubscriptions) {
      try {
        // Tính toán ngày gia hạn mới (thêm 1 tháng)
        const newPeriodStart = new Date();
        const newPeriodEnd = new Date();
        newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);

        // Cập nhật subscription
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            status: "active",
            currentPeriodStart: newPeriodStart,
            currentPeriodEnd: newPeriodEnd,
            cancelAtPeriodEnd: false
          }
        });

        // Reset usage cho period mới
        await billingService.resetUsageForNewPeriod(
          subscription.id,
          newPeriodStart,
          newPeriodEnd
        );

        // Tạo payment record để tracking (manual renewal)
        await prisma.payment.create({
          data: {
            subscriptionId: subscription.id,
            clientId: subscription.clientId,
            provider: "paypal",
            providerPaymentId: `MANUAL_RENEWAL_${Date.now()}_${subscription.id}`,
            amount: subscription.package.priceUSD,
            currency: "USD",
            status: "captured",
            capturedAt: new Date(),
            metadata: {
              type: "manual_renewal",
              reason: "PayPal auto-renewal failed (test mode)",
              adminId: user.id,
              previousPeriodEnd: subscription.currentPeriodEnd,
              newPeriodEnd: newPeriodEnd
            }
          }
        });

        results.push({
          subscriptionId: subscription.id,
          clientEmail: subscription.client.user.email,
          clientName: subscription.client.user.name,
          previousPeriodEnd: subscription.currentPeriodEnd,
          newPeriodEnd: newPeriodEnd,
          success: true
        });

        logger.info(`Manual renewal successful for subscription ${subscription.id}`, {
          subscriptionId: subscription.id,
          clientId: subscription.clientId,
          previousPeriodEnd: subscription.currentPeriodEnd,
          newPeriodEnd: newPeriodEnd
        });

      } catch (error: any) {
        results.push({
          subscriptionId: subscription.id,
          clientEmail: subscription.client.user.email,
          clientName: subscription.client.user.name,
          success: false,
          error: error.message
        });

        logger.error(`Failed to renew subscription ${subscription.id}`, error, {
          subscriptionId: subscription.id,
          clientId: subscription.clientId
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `Renewed ${successCount} subscription(s), ${failCount} failed`,
      renewed: successCount,
      failed: failCount,
      results
    });

  } catch (error: any) {
    logger.error("Error in manual renewal endpoint", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint để xem danh sách các subscription đã quá hạn (preview)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getServerSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    const now = new Date();
    
    const overdueSubscriptions = await prisma.subscription.findMany({
      where: {
        status: "active",
        currentPeriodEnd: {
          lt: now
        },
        package: {
          name: "Plus Plan"
        },
        provider: "paypal",
        // Chỉ xử lý subscriptions có PayPal subscription ID thật
        providerSubscriptionId: {
          not: {
            startsWith: "basic-"
          }
        }
      },
      include: {
        package: true,
        client: {
          include: {
            user: {
              select: {
                email: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        currentPeriodEnd: "asc"
      }
    });

    const preview = overdueSubscriptions.map(sub => ({
      subscriptionId: sub.id,
      clientEmail: sub.client.user.email,
      clientName: sub.client.user.name,
      planName: sub.package.name,
      currentPeriodEnd: sub.currentPeriodEnd,
      daysOverdue: Math.floor((now.getTime() - sub.currentPeriodEnd.getTime()) / (1000 * 60 * 60 * 24)),
      providerSubscriptionId: sub.providerSubscriptionId
    }));

    return NextResponse.json({
      count: overdueSubscriptions.length,
      subscriptions: preview
    });

  } catch (error: any) {
    logger.error("Error fetching overdue subscriptions", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

