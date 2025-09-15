import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { requireServerAuth } from "@/features/auth/auth-server";
import { AdminLayout } from "@/features/shared/components/admin-layout";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Admin panel for managing the platform",
};

interface AdminLayoutPageProps {
  children: ReactNode;
}

export default async function AdminLayoutPage({
  children,
}: AdminLayoutPageProps) {
  try {
    const user = await requireServerAuth();

    // Check if user has admin role
    if (user.role !== "ADMIN") {
      redirect("/auth/signin");
    }

    return children;
  } catch (error) {
    // If not authenticated, redirect to signin
    redirect("/auth/signin");
  }
}
