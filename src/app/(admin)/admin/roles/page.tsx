export const dynamic = "force-dynamic";
export const revalidate = 0;

import { Metadata } from "next";
import { getServerSessionUser } from "@/features/auth/auth-server";
import { redirect } from "next/navigation";
import { AdminLayout } from "@/features/shared/components/admin-layout";
import { AdminRoles } from "@/features/(admin)/roles/admin-roles";

export const metadata: Metadata = {
  title: "Admin Roles Management",
  description: "Manage developer roles",
};

export default async function AdminRolesPage() {
  const user = await getServerSessionUser();

  if (!user) {
    redirect("/admin/login");
  }

  if (user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <AdminLayout user={user} title="Roles Management" description="Manage developer roles">
      <AdminRoles />
    </AdminLayout>
  );
}

