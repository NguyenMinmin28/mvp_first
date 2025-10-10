import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/features/auth/auth-server";
import { AdminLayout } from "@/features/shared/components/admin-layout";
import { UserManagement } from "@/features/(admin)/user-management/user-management";

export const metadata: Metadata = {
  title: "User Management - Admin",
  description: "Manage all users and their roles",
};

export default async function UserManagementPage() {
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
      title="User Management"
      description="Manage all users and their roles"
    >
      <UserManagement />
    </AdminLayout>
  );
}

