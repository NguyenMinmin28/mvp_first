import { prisma } from "@/core/database/db";
import { Metadata } from "next";
import { getServerSessionUser } from "@/features/auth/auth-server";
import { redirect } from "next/navigation";
import { AdminLayout } from "@/features/shared/components/admin-layout";

export const metadata: Metadata = {
  title: "Admin · Transactions",
};

export default async function AdminTransactionsPage() {
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

  return (
    <AdminLayout user={user} title="Transactions" description="Read-only list of recent payments">
      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3">Created</th>
              <th className="p-3">Client</th>
              <th className="p-3">Plan</th>
              <th className="p-3">Provider</th>
              <th className="p-3">Payment ID</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-3 whitespace-nowrap">{new Date(p.createdAt).toLocaleString()}</td>
                <td className="p-3">
                  <div className="flex flex-col">
                    <span>{p.client.user.name || p.client.user.email}</span>
                    <span className="text-muted-foreground">{p.client.user.email}</span>
                  </div>
                </td>
                <td className="p-3">{p.subscription?.package?.name || "—"}</td>
                <td className="p-3 uppercase">{p.provider}</td>
                <td className="p-3 text-xs">{p.providerPaymentId}</td>
                <td className="p-3 whitespace-nowrap">{p.amount.toFixed(2)} {p.currency}</td>
                <td className="p-3">
                  <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs">
                    {p.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
