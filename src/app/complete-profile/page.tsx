import { getServerSessionUser } from "@/features/auth/auth-server";
import { redirect } from "next/navigation";
import CompleteProfilePage from "@/features/complete-profile/view/complete-profile-page";

export const metadata = {
  title: "Hoàn thiện hồ sơ",
  description:
    "Hoàn thiện thông tin hồ sơ của bạn để sử dụng đầy đủ tính năng.",
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
