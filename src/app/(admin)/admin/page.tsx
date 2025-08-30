export const dynamic = "force-dynamic";
export const revalidate = 0;

import { Metadata } from "next";
import { getServerSessionUser } from "@/features/auth/auth-server";
import { redirect } from "next/navigation";
import { AdminDashboard } from "@/features/(admin)/dashboard/admin-dashboard";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Admin dashboard for managing the application.",
};

export default async function AdminPage() {
  const user = await getServerSessionUser();

  if (!user) {
    redirect("/admin/login");
  }

  // Kiểm tra xem user có phải là admin không
  if (user.role !== "ADMIN") {
    redirect("/");
  }

  return <AdminDashboard user={user} />;
}
