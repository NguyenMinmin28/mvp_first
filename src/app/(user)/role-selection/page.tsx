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

  // Redirect to home if profile already completed
  if (user.isProfileCompleted) {
    redirect("/");
  }

  return <CompleteProfilePage />;
}
