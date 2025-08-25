import { Metadata } from "next";
import { getServerSessionUser } from "@/features/auth/auth-server";
import { redirect } from "next/navigation";
import DeveloperApprovalPage from "@/features/admin/components/developer-approval-page";

export const metadata: Metadata = {
  title: "Developer Management | Admin",
  description: "Manage developer profiles and approvals.",
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

  return <DeveloperApprovalPage user={user} />;
}
