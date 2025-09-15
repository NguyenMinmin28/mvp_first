export const dynamic = "force-dynamic";
export const revalidate = 0;
import { prisma } from "@/core/database/db";

import { Metadata } from "next";
import { getServerSessionUser } from "@/features/auth/auth-server";
import { redirect } from "next/navigation";
import TransactionsClientPage from "@/features/admin/components/transaction-client";

export const metadata: Metadata = {
  title: "Transactions Management | Admin",
  description: "Manage transactions.",
};

export default async function AdminDevelopersPage() {
  const user = await getServerSessionUser();

  if (!user) {
    redirect("/admin/login");
  }
  if (user.role !== "ADMIN") {
    redirect("/");
  }

  const payments = await prisma.payment.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      client: { include: { user: { select: { email: true, name: true } } } },
      subscription: {
        select: {
          provider: true,
          providerSubscriptionId: true,
          package: { select: { name: true } },
        },
      },
    },
  });

  // Prepare rows for client DataTable (ensure serializable values)
  const rows = payments.map((p: any) => ({
    createdAt: new Date(p.createdAt).toISOString(),
    clientName: p.client.user.name || p.client.user.email,
    clientEmail: p.client.user.email,
    plan: p.subscription?.package?.name || "—",
    provider: String(p.provider).toUpperCase(),
    paymentId: p.providerPaymentId,
    amount: `${p.amount.toFixed(2)} ${p.currency}`,
    rawAmount: Number(p.amount) || 0,
    currency: p.currency,
    status: p.status,
  }));

  const totalCount = rows.length;
  const successCount = rows.filter(
    (r) => r.status === "COMPLETED" || r.status === "SUCCESS"
  ).length;
  const failedCount = rows.filter(
    (r) =>
      r.status === "FAILED" || r.status === "CANCELED" || r.status === "VOID"
  ).length;
  const totalVolume = rows
    .filter((r) => r.status === "COMPLETED" || r.status === "SUCCESS")
    .reduce((sum, r) => sum + (r.rawAmount || 0), 0);
  const currency = rows.find((r) => r.currency)?.currency || "USD";

  return (
    <TransactionsClientPage
      user={user as any}
      rows={rows}
      totalCount={totalCount}
      successCount={successCount}
      failedCount={failedCount}
      totalVolume={totalVolume}
      currency={currency}
    />
  );
}
