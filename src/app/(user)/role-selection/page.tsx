export const dynamic = "force-dynamic";
export const revalidate = 0;

import { getServerSessionUser } from "@/features/auth/auth-server";
import { redirect } from "next/navigation";
import CompleteProfilePage from "@/features/role-selection/view/role-selection-page";

export const metadata = {
  title: "Choose Your Role – Client or Freelancer",
  description: "Complete your Clevrs profile by choosing your role as a client or freelancer. Start connecting directly with no commissions.",
};

export default async function CompleteProfile() {
  const user = await getServerSessionUser();

  // Redirect to signin if not authenticated
  if (!user) {
    redirect("/auth/signin");
  }

  // If user already has a role, do not show role-selection
  if (user.role) {
    if (user.role === "CLIENT") {
      redirect("/client-dashboard");
    } else if (user.role === "DEVELOPER") {
      // Send developers to appropriate page based on status
      if (!user.isProfileCompleted) {
        redirect("/onboarding/freelancer/basic-information");
      } else {
        // All developers (pending, approved, etc.) go to dashboard
        redirect("/dashboard-user");
      }
    } else if (user.role === "ADMIN") {
      redirect("/admin");
    }
  }

  return <CompleteProfilePage />;
}
