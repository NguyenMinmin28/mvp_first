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
  try {
    console.log("🔍 Admin page - Starting to get user session");
    const user = await getServerSessionUser();
    console.log("🔍 Admin page - User session:", user?.email, user?.role);

    if (!user) {
      console.log("🔍 Admin page - No user, redirecting to login");
      redirect("/auth/signin");
    }

    // Kiểm tra xem user có phải là admin không
    if (user.role !== "ADMIN") {
      console.log("🔍 Admin page - User is not admin, redirecting to home");
      redirect("/");
    }

    console.log("🔍 Admin page - Rendering AdminDashboard");
    return <AdminDashboard user={user} />;
  } catch (error) {
    console.error("🔍 Admin page - Error:", error);
    
    // Log detailed error information
    if (error instanceof Error) {
      console.error("🔍 Admin page - Error name:", error.name);
      console.error("🔍 Admin page - Error message:", error.message);
      console.error("🔍 Admin page - Error stack:", error.stack);
    }
    
    // Fallback to signin page
    redirect("/auth/signin");
  }
}
