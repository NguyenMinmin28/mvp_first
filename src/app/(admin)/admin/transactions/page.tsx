export const dynamic = "force-dynamic";
export const revalidate = 0;

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
      <div className="overflow-x-auto rounded-lg border-4 border-gray-300 shadow-lg">
        <table className="min-w-full text-sm border-collapse">
          <thead className="bg-gray-100 border-b-4 border-gray-400">
            <tr>
              <th className="p-3 text-left font-bold text-gray-800 border-r-2 border-gray-400">Created</th>
              <th className="p-3 text-left font-bold text-gray-800 border-r-2 border-gray-400">Client</th>
              <th className="p-3 text-left font-bold text-gray-800 border-r-2 border-gray-400">Plan</th>
              <th className="p-3 text-left font-bold text-gray-800 border-r-2 border-gray-400">Provider</th>
              <th className="p-3 text-left font-bold text-gray-800 border-r-2 border-gray-400">Payment ID</th>
              <th className="p-3 text-left font-bold text-gray-800 border-r-2 border-gray-400">Amount</th>
              <th className="p-3 text-left font-bold text-gray-800">Status</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p: any) => (
              <tr key={p.id} className="border-b-2 border-gray-300 hover:bg-gray-100">
                <td className="p-3 whitespace-nowrap border-r-2 border-gray-300">{new Date(p.createdAt).toLocaleString()}</td>
                <td className="p-3 border-r-2 border-gray-300">
                  <div className="flex flex-col">
                    <span className="font-medium">{p.client.user.name || p.client.user.email}</span>
                    <span className="text-muted-foreground text-xs">{p.client.user.email}</span>
                  </div>
                </td>
                <td className="p-3 border-r-2 border-gray-300">{p.subscription?.package?.name || "—"}</td>
                <td className="p-3 uppercase border-r-2 border-gray-300 font-medium">{p.provider}</td>
                <td className="p-3 text-xs border-r-2 border-gray-300 font-mono">{p.providerPaymentId}</td>
                <td className="p-3 whitespace-nowrap border-r-2 border-gray-300 font-medium">{p.amount.toFixed(2)} {p.currency}</td>
                <td className="p-3">
                  <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium">
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
