export const dynamic = "force-dynamic";
export const revalidate = 0;

import { Metadata } from "next";
import { getServerSessionUser } from "@/features/auth/auth-server";
import { redirect } from "next/navigation";
import AdminUsageTransactionsClient from "@/features/admin/components/usage-transaction-client";

export const metadata: Metadata = {
  title: "IdeaSpark Management | Admin",
  description: "Manage IdeaSpark ideas and reports.",
};

export default async function AdminDevelopersPage() {
  const user = await getServerSessionUser();

  if (!user) {
    redirect("/admin/login");
  }

  // Check if user is admin
  if (user.role !== "ADMIN") {
    redirect("/");
  }

  return <AdminUsageTransactionsClient user={user as any} />;
}
