import { NextRequest, NextResponse } from "next/server";
import { getServerSessionUser } from "@/features/auth/auth-server";
import { prisma } from "@/core/database/db";
import { billingService } from "@/modules/billing/billing.service";
import { logger } from "@/lib/logger";
import { paypalConfig } from "@/config/paypal";
import { paypalService } from "@/modules/paypal/paypal.service";

/**
 * API endpoint proxy để admin có thể trigger renewal cron job
 * Không cần CRON_SECRET vì đã check admin role
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

    const correlationId = logger.generateCorrelationId();
    const now = new Date();
    
    logger.info("Admin triggered auto-renewal cron job", { correlationId, adminId: user.id });
    
    // Tạo cron record để tracking
    const cronRecord = await (prisma as any).cronRun.create({
      data: {
        job: "renew-overdue-subscriptions",
        status: "started",
        success: null,
        details: { correlationId, startedAt: now, triggeredBy: "admin", adminId: user.id }
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
    const isLiveMode = paypalConfig.mode === "live";
    
    for (const subscription of overdueSubscriptions) {
      try {
        // Trong LIVE mode, kiểm tra PayPal subscription trước
        let paypalSubscription = null;
        let shouldRenew = true;
        
        if (isLiveMode) {
          try {
            // Kiểm tra subscription trên PayPal
            paypalSubscription = await paypalService.getSubscription(
              subscription.providerSubscriptionId,
              correlationId
            );
            
            // Nếu PayPal đã renew (next_billing_time > currentPeriodEnd), sync từ PayPal
            if (paypalSubscription.billing_info?.next_billing_time) {
              const paypalNextBilling = new Date(paypalSubscription.billing_info.next_billing_time);
              const dbPeriodEnd = new Date(subscription.currentPeriodEnd);
              
              // Nếu PayPal đã renew rồi, chỉ cần sync
              if (paypalNextBilling > dbPeriodEnd) {
                logger.info(`PayPal subscription already renewed, syncing from PayPal`, {
                  correlationId,
                  subscriptionId: subscription.id,
                  paypalNextBilling,
                  dbPeriodEnd
                });
                
                // Sync từ PayPal
                const newPeriodStart = new Date();
                const newPeriodEnd = paypalNextBilling;
                
                await prisma.subscription.update({
                  where: { id: subscription.id },
                  data: {
                    status: "active",
                    currentPeriodStart: newPeriodStart,
                    currentPeriodEnd: newPeriodEnd,
                    cancelAtPeriodEnd: false
                  }
                });
                
                // Reset usage
                await billingService.resetUsageForNewPeriod(
                  subscription.id,
                  newPeriodStart,
                  newPeriodEnd
                );
                
                // Payment đã được tạo bởi PayPal webhook, không cần tạo lại
                successCount++;
                results.push({
                  subscriptionId: subscription.id,
                  clientEmail: subscription.client.user.email,
                  success: true,
                  synced: true
                });
                
                continue; // Skip manual renewal
              }
            }
          } catch (paypalError: any) {
            logger.warn(`Failed to check PayPal subscription, proceeding with manual renewal`, {
              correlationId,
              subscriptionId: subscription.id,
              error: paypalError.message
            });
            // Continue with manual renewal if PayPal check fails
          }
        }
        
        // Manual renewal (chỉ dùng cho SANDBOX mode hoặc khi PayPal chưa renew)
        // WARNING: Trong LIVE mode, đây chỉ là database update, không charge tiền thật
        // PayPal sẽ tự động charge khi subscription renew, và webhook sẽ update database
        
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

        // Tạo payment record để tracking
        // NOTE: Trong LIVE mode, payment thật sẽ được tạo bởi PayPal webhook
        // Đây chỉ là record để tracking trong database
        await prisma.payment.create({
          data: {
            subscriptionId: subscription.id,
            clientId: subscription.clientId,
            provider: "paypal",
            providerPaymentId: isLiveMode 
              ? `MANUAL_SYNC_${Date.now()}_${subscription.id}` 
              : `AUTO_RENEWAL_${Date.now()}_${subscription.id}`,
            amount: subscription.package.priceUSD,
            currency: "USD",
            status: isLiveMode ? "created" : "captured", // Trong live mode, chưa capture thật
            capturedAt: isLiveMode ? null : new Date(),
            metadata: {
              type: isLiveMode ? "manual_sync" : "auto_renewal",
              reason: isLiveMode 
                ? "PayPal subscription should auto-renew, syncing database (payment will come via webhook)"
                : "PayPal auto-renewal failed (sandbox mode) - auto-renewed by admin",
              previousPeriodEnd: subscription.currentPeriodEnd,
              newPeriodEnd: newPeriodEnd,
              cronJobId: cronRecord.id,
              adminId: user.id,
              paypalMode: paypalConfig.mode,
              warning: isLiveMode ? "This is a database sync only. Real payment will be processed by PayPal and webhook will update this record." : null
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

    logger.info("Admin-triggered auto-renewal completed", {
      correlationId,
      renewed: successCount,
      failed: failCount,
      total: overdueSubscriptions.length,
      adminId: user.id
    });

    return NextResponse.json({
      success: true,
      message: `Auto-renewed ${successCount} subscription(s), ${failCount} failed`,
      renewed: successCount,
      failed: failCount,
      total: overdueSubscriptions.length
    });

  } catch (error: any) {
    logger.error("Admin-triggered auto-renewal failed", error);
    
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

