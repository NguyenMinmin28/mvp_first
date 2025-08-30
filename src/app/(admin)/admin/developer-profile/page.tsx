export const dynamic = "force-dynamic";
export const revalidate = 0;

import { Metadata } from "next";
import { getServerSessionUser } from "@/features/auth/auth-server";
import { redirect } from "next/navigation";
import { DeveloperProfileManagement } from "@/features/(admin)/developer-profile/developer-profile-management";
import { AdminLayout } from "@/features/shared/components/admin-layout";

export const metadata: Metadata = {
  title: "Developer Profile Management",
  description: "Manage developer profiles and approvals",
};

export default async function DeveloperProfilePage() {
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
      title="Developer Profile Management"
      description="Manage developer profiles and approvals"
    >
      <DeveloperProfileManagement />
    </AdminLayout>
  );
}
