"use client";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { AdminLayout } from "@/features/shared/components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { DataTable, Column } from "@/ui/components/data-table";
import { CheckCircle, XCircle, DollarSign, CreditCard } from "lucide-react";

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
