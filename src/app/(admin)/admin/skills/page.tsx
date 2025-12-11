export const dynamic = "force-dynamic";
export const revalidate = 0;

import { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminSkills } from "@/features/(admin)/skills/admin-skills";
import { getServerSessionUser } from "@/features/auth/auth-server";
import { AdminLayout } from "@/features/shared/components/admin-layout";

export const metadata: Metadata = {
  title: "Admin Skills",
  description: "Manage skills used across the platform.",
};

export default async function AdminSkillsPage() {
  const user = await getServerSessionUser();

  if (!user) {
    redirect("/auth/signin");
  }
  if (user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <AdminLayout user={user as any} title="Skills">
      <div className="max-w-5xl mx-auto">
        <AdminSkills />
      </div>
    </AdminLayout>
  );
}

