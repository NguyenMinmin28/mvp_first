"use client";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { useState, useEffect } from "react";
import { AdminLayout } from "@/features/shared/components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { DataTable, Column } from "@/ui/components/data-table";
import { CheckCircle, XCircle, DollarSign, CreditCard, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/ui/components/button";

export default function TransactionsClientPage({
  user,
  rows,
  totalCount,
  successCount,
  failedCount,
  totalVolume,
  currency,
}: {
  user: any;
  rows: any;
  totalCount: number;
  successCount: number;
  failedCount: number;
  totalVolume: number;
  currency: string;
}) {
  const [isRenewing, setIsRenewing] = useState(false);
  const [renewalResult, setRenewalResult] = useState<{
    success: boolean;
    message: string;
    renewed?: number;
    failed?: number;
  } | null>(null);
  const [overdueCount, setOverdueCount] = useState<number | null>(null);

  // Fetch overdue count on mount
  useEffect(() => {
    fetch("/api/admin/subscriptions/renew-overdue")
      .then(res => res.json())
      .then(data => {
        if (data.count !== undefined) {
          setOverdueCount(data.count);
        }
      })
      .catch(() => {
        // Ignore errors
      });
  }, []);

  const handleManualRenewal = async () => {
    if (!confirm("Bạn có chắc chắn muốn gia hạn thủ công tất cả các subscription Plus Plan đã quá hạn?")) {
      return;
    }

    setIsRenewing(true);
    setRenewalResult(null);

    try {
      const response = await fetch("/api/admin/subscriptions/renew-overdue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        setRenewalResult({
          success: true,
          message: data.message,
          renewed: data.renewed,
          failed: data.failed,
        });
        setOverdueCount(0);
        // Reload page after 2 seconds to show updated transactions
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setRenewalResult({
          success: false,
          message: data.error || "Có lỗi xảy ra khi gia hạn",
        });
      }
    } catch (error: any) {
      setRenewalResult({
        success: false,
        message: error.message || "Có lỗi xảy ra khi gia hạn",
      });
    } finally {
      setIsRenewing(false);
    }
  };

  const handleAutoRenewal = async () => {
    if (!confirm("Bạn có chắc chắn muốn chạy Auto Renewal Cron Job? Job này sẽ tự động gia hạn các subscription đã quá hạn và tạo payment records.")) {
      return;
    }

    setIsRenewing(true);
    setRenewalResult(null);

    try {
      const response = await fetch("/api/admin/subscriptions/run-auto-renewal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        setRenewalResult({
          success: true,
          message: data.message || `Auto-renewed ${data.renewed || 0} subscription(s)`,
          renewed: data.renewed,
          failed: data.failed,
        });
        // Refresh overdue count
        const countResponse = await fetch("/api/admin/subscriptions/renew-overdue");
        const countData = await countResponse.json();
        if (countData.count !== undefined) {
          setOverdueCount(countData.count);
        }
        // Reload page after 2 seconds to show updated transactions
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setRenewalResult({
          success: false,
          message: data.error || "Có lỗi xảy ra khi chạy auto renewal",
        });
      }
    } catch (error: any) {
      setRenewalResult({
        success: false,
        message: error.message || "Có lỗi xảy ra khi chạy auto renewal",
      });
    } finally {
      setIsRenewing(false);
    }
  };
  const columns: Column<(typeof rows)[number]>[] = [
    {
      key: "createdAt",
      label: "Created",
      sortable: true,
      render: (value) => new Date(value).toLocaleString(),
      width: "w-[180px]",
    },
    {
      key: "clientName",
      label: "Client",
      sortable: true,
      render: (_v, item) => (
        <div className="flex flex-col">
          <span className="font-medium">{item.clientName}</span>
          <span className="text-muted-foreground text-xs">
            {item.clientEmail}
          </span>
        </div>
      ),
    },
    { key: "plan", label: "Plan", sortable: true },
    { key: "provider", label: "Provider", sortable: true, width: "w-[110px]" },
    {
      key: "paymentId",
      label: "Payment ID",
      render: (v) => <span className="text-xs font-mono">{v}</span>,
      width: "w-[220px]",
    },
    { key: "amount", label: "Amount", sortable: true, width: "w-[140px]" },
    {
      key: "status",
      label: "Status",
      sortable: true,
      width: "w-[120px]",
      render: (v) => {
        const color =
          v === "COMPLETED" || v === "SUCCESS"
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : v === "PENDING" || v === "PROCESSING"
              ? "bg-amber-50 text-amber-700 border-amber-200"
              : "bg-rose-50 text-rose-700 border-rose-200";
        return (
          <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${color}`}
          >
            {v}
          </span>
        );
      },
    },
  ];

  return (
    <AdminLayout
      user={user}
      title="Transactions"
      description="Read-only list of recent payments"
    >
      <div className="space-y-6">
        {/* Manual Renewal Section */}
        {(overdueCount !== null && overdueCount > 0) && (
          <Card className="bg-amber-50 border-amber-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-900">
                <AlertCircle className="h-5 w-5" />
                Gia hạn thủ công
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-amber-800">
                Có <strong>{overdueCount}</strong> subscription Plus Plan đã quá hạn cần được gia hạn thủ công.
                PayPal có thể không tự động gia hạn trong môi trường test.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800">
                <p className="font-medium mb-1">⚠️ Lưu ý quan trọng:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li><strong>Sandbox mode:</strong> Auto renewal chỉ update database, không charge tiền thật (OK cho test)</li>
                  <li><strong>Live mode:</strong> PayPal sẽ tự động charge tiền từ khách hàng khi subscription renew. Webhook sẽ update database và tạo payment record thật.</li>
                  <li>Nút "Chạy Auto Renewal" trong Live mode chỉ sync database, không charge tiền. PayPal tự động charge và gửi webhook.</li>
                </ul>
              </div>
              {renewalResult && (
                <div
                  className={`p-3 rounded-md ${
                    renewalResult.success
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-rose-100 text-rose-800"
                  }`}
                >
                  <p className="text-sm font-medium">{renewalResult.message}</p>
                  {renewalResult.renewed !== undefined && (
                    <p className="text-xs mt-1">
                      Đã gia hạn: {renewalResult.renewed}, Thất bại: {renewalResult.failed || 0}
                    </p>
                  )}
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  onClick={handleAutoRenewal}
                  disabled={isRenewing}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isRenewing ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Đang chạy...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Chạy Auto Renewal Cron ({overdueCount} subscription)
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleManualRenewal}
                  disabled={isRenewing}
                  variant="outline"
                  className="border-amber-600 text-amber-700 hover:bg-amber-50"
                >
                  {isRenewing ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Đang gia hạn...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Gia hạn thủ công
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-sky-50 border-sky-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Payments
              </CardTitle>
              <CreditCard className="h-4 w-4 text-sky-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-sky-900">
                {totalCount}
              </div>
              <p className="text-xs text-sky-700">Across last 100 records</p>
            </CardContent>
          </Card>

          <Card className="bg-emerald-50 border-emerald-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Successful</CardTitle>
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-900">
                {successCount}
              </div>
              <p className="text-xs text-emerald-700">Completed or success</p>
            </CardContent>
          </Card>

          <Card className="bg-rose-50 border-rose-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <XCircle className="h-4 w-4 text-rose-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-rose-900">
                {failedCount}
              </div>
              <p className="text-xs text-rose-700">Failed, canceled or void</p>
            </CardContent>
          </Card>

          <Card className="bg-indigo-50 border-indigo-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Volume
              </CardTitle>
              <DollarSign className="h-4 w-4 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-900">
                {totalVolume.toFixed(2)} {currency}
              </div>
              <p className="text-xs text-indigo-700">
                Sum of successful payments
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <DataTable
          data={rows}
          columns={columns}
          unstyled
          title="Recent Payments"
          searchPlaceholder="Search by client, plan, provider..."
        />
      </div>
    </AdminLayout>
  );
}
