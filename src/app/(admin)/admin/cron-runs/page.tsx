export const dynamic = "force-dynamic";

import { Metadata } from "next";
import { getServerSessionUser } from "@/features/auth/auth-server";
import { redirect } from "next/navigation";
import { AdminLayout } from "@/features/shared/components/admin-layout";
import { CronRunsTable } from "@/features/admin/components/cron-runs-table";

export const metadata: Metadata = {
  title: "Cron Runs",
  description: "Monitor scheduled job executions and their status.",
};

export default async function AdminCronRunsPage() {
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
      title="Cron Runs"
      description="Monitor scheduled job executions and their status"
    >
      <CronRunsTable />
    </AdminLayout>
  );
}


