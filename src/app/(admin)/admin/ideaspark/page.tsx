export const dynamic = "force-dynamic";
export const revalidate = 0;

import { Metadata } from "next";
import { getServerSessionUser } from "@/features/auth/auth-server";
import { redirect } from "next/navigation";
import DeveloperApprovalPage from "@/features/admin/components/developer-approval-page";
import IdeaSparkClientPage from "@/features/admin/components/ideaspark-client";

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

  return <IdeaSparkClientPage user={user as any} />;
}
