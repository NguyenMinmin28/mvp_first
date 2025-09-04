export const dynamic = "force-dynamic";
export const revalidate = 0;

import { getServerSessionUser } from "@/features/auth/auth-server";
import { redirect } from "next/navigation";
import CompleteProfilePage from "@/features/role-selection/view/role-selection-page";

export const metadata = {
  title: "Complete Profile",
  description: "Complete your profile information to use all features.",
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
      } else if ((user as any).adminApprovalStatus === "approved") {
        redirect("/inbox");
      } else {
        redirect("/onboarding/freelancer/pending-approval");
      }
    } else if (user.role === "ADMIN") {
      redirect("/admin");
    }
  }

  return <CompleteProfilePage />;
}
