export const dynamic = "force-dynamic";

import { Metadata } from "next";
import { getServerSessionUser } from "@/features/auth/auth-server";
import { redirect } from "next/navigation";
import { AdminLayout } from "@/features/shared/components/admin-layout";
import { UsageTransactionsTable } from "@/features/admin/components/usage-transactions-table";

export const metadata: Metadata = {
  title: "Usage Logs",
  description: "Track project posts and contact reveals per client subscription period.",
};

export default async function AdminUsageTransactionsPage() {
  const user = await getServerSessionUser();

  if (!user) {
    redirect("/admin/login");
  }

  if (user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <AdminLayout
      user={user}
      title="Usage Logs"
      description="Track project posts and contact reveals per client subscription period"
    >
      <UsageTransactionsTable />
    </AdminLayout>
  );
}


