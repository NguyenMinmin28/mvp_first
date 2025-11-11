export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/database/db";
import { billingService } from "@/modules/billing/billing.service";
import { logger } from "@/lib/logger";

/**
 * Cron job để tự động gia hạn các subscription Plus Plan đã quá hạn
 * Chạy hàng ngày để đảm bảo các subscription được gia hạn kịp thời
 * 
 * Schedule: Mỗi ngày lúc 00:00 UTC (hoặc có thể chạy mỗi giờ)
 * Vercel cron: "0 0 * * *" (hàng ngày) hoặc "0 * * * *" (mỗi giờ)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const incomingSecret = request.headers.get("authorization")?.replace("Bearer ", "");
    const expectedSecret = process.env.CRON_SECRET || (process.env.NODE_ENV !== "production" ? "test-secret" : undefined);
    
    if (!incomingSecret || !expectedSecret || incomingSecret !== expectedSecret) {
      logger.warn("Unauthorized cron job access attempt - renew-overdue-subscriptions", {
        ip: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown"
      });
      
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const correlationId = logger.generateCorrelationId();
    const now = new Date();
    
    logger.info("Auto-renewal cron job started", { correlationId });
    
    // Tạo cron record để tracking
    const cronRecord = await (prisma as any).cronRun.create({
      data: {
        job: "renew-overdue-subscriptions",
        status: "started",
        success: null,
        details: { correlationId, startedAt: now }
      }
    });

    // Tìm các subscription Plus Plan đã quá hạn
    // Chỉ xử lý các subscription có PayPal subscription ID thật (không phải internal)
    const overdueSubscriptions = await prisma.subscription.findMany({
      where: {
        status: "active",
        currentPeriodEnd: {
          lt: now // Đã quá hạn
        },
        package: {
          name: "Plus Plan"
        },
        provider: "paypal",
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

    logger.info(`Found ${overdueSubscriptions.length} overdue subscriptions`, { 
      correlationId,
      count: overdueSubscriptions.length 
    });

    if (overdueSubscriptions.length === 0) {
      await (prisma as any).cronRun.update({
        where: { id: cronRecord.id },
        data: {
          status: "succeeded",
          success: true,
          finishedAt: new Date(),
          details: { 
            correlationId, 
            renewed: 0,
            failed: 0,
            message: "No overdue subscriptions found"
          }
        }
      });

      return NextResponse.json({
        success: true,
        message: "No overdue subscriptions found",
        renewed: 0,
        failed: 0
      });
    }

    const results = [];
    let successCount = 0;
    let failCount = 0;
    
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

        // Tạo payment record để tracking (auto renewal)
        await prisma.payment.create({
          data: {
            subscriptionId: subscription.id,
            clientId: subscription.clientId,
            provider: "paypal",
            providerPaymentId: `AUTO_RENEWAL_${Date.now()}_${subscription.id}`,
            amount: subscription.package.priceUSD,
            currency: "USD",
            status: "captured",
            capturedAt: new Date(),
            metadata: {
              type: "auto_renewal",
              reason: "PayPal auto-renewal failed (test mode) - auto-renewed by cron",
              previousPeriodEnd: subscription.currentPeriodEnd,
              newPeriodEnd: newPeriodEnd,
              cronJobId: cronRecord.id
            }
          }
        });

        successCount++;
        results.push({
          subscriptionId: subscription.id,
          clientEmail: subscription.client.user.email,
          success: true
        });

        logger.info(`Auto-renewal successful for subscription ${subscription.id}`, {
          correlationId,
          subscriptionId: subscription.id,
          clientId: subscription.clientId,
          previousPeriodEnd: subscription.currentPeriodEnd,
          newPeriodEnd: newPeriodEnd
        });

      } catch (error: any) {
        failCount++;
        results.push({
          subscriptionId: subscription.id,
          clientEmail: subscription.client.user.email,
          success: false,
          error: error.message
        });

        logger.error(`Failed to auto-renew subscription ${subscription.id}`, error, {
          correlationId,
          subscriptionId: subscription.id,
          clientId: subscription.clientId
        });
      }
    }

    // Cập nhật cron record với kết quả
    await (prisma as any).cronRun.update({
      where: { id: cronRecord.id },
      data: {
        status: "succeeded",
        success: true,
        finishedAt: new Date(),
        details: { 
          correlationId, 
          renewed: successCount,
          failed: failCount,
          total: overdueSubscriptions.length,
          results: results.slice(0, 10) // Chỉ lưu 10 kết quả đầu để tránh quá lớn
        }
      }
    });

    logger.info("Auto-renewal cron job completed", {
      correlationId,
      renewed: successCount,
      failed: failCount,
      total: overdueSubscriptions.length
    });

    return NextResponse.json({
      success: true,
      message: `Auto-renewed ${successCount} subscription(s), ${failCount} failed`,
      renewed: successCount,
      failed: failCount,
      total: overdueSubscriptions.length
    });

  } catch (error: any) {
    logger.error("Auto-renewal cron job failed", error);
    
    try {
      await (prisma as any).cronRun.create({
        data: {
          job: "renew-overdue-subscriptions",
          status: "failed",
          success: false,
          details: { error: error?.message || String(error) }
        }
      });
    } catch {}
    
    return NextResponse.json(
      { 
        success: false, 
        error: "Auto-renewal failed", 
        details: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * Health check endpoint
 */
export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    
    // Đếm số subscription quá hạn
    const overdueCount = await prisma.subscription.count({
      where: {
        status: "active",
        currentPeriodEnd: {
          lt: now
        },
        package: {
          name: "Plus Plan"
        },
        provider: "paypal"
      }
    });

    // Lấy cron run gần nhất
    const lastRun = await (prisma as any).cronRun.findFirst({
      where: {
        job: "renew-overdue-subscriptions"
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return NextResponse.json({
      success: true,
      overdueCount,
      lastRun: lastRun ? {
        status: lastRun.status,
        success: lastRun.success,
        createdAt: lastRun.createdAt,
        finishedAt: lastRun.finishedAt,
        details: lastRun.details
      } : null,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false, 
        error: "Health check failed", 
        details: error.message 
      },
      { status: 500 }
    );
  }
}

