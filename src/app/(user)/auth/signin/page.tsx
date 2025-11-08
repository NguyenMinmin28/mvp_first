import { Metadata } from "next";
import SignInClient from "./signin-client";
import { Suspense } from "react";
import { getServerSessionUser } from "@/features/auth/auth-server";
import { UserLayout } from "@/features/shared/components/user-layout";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Login to Clevrs – Access Your Projects & Freelancers",
  description:
    "Sign in to your Clevrs account to manage your projects, connect with freelancers, and access all platform features.",
};

export default async function SignInPage() {
  const user = await getServerSessionUser();

  // If already authenticated, redirect away to prevent rendering this page (and avoid client-hook SSR issues)
  if (user) {
    if (user.role === "ADMIN") {
      redirect("/admin");
    }
    if (user.role === "CLIENT") {
      // Client dashboard or pricing will be decided client-side; default to dashboard
      redirect("/client-dashboard");
    }
    if (user.role === "DEVELOPER") {
      if (user.isProfileCompleted) {
        redirect("/dashboard-user");
      } else {
        redirect("/onboarding/freelancer/basic-information");
      }
    }
    // No role yet
    redirect("/role-selection");
  }

  return (
    <UserLayout user={user}>
      <Suspense fallback={<div></div>}>
        <SignInClient />
      </Suspense>
    </UserLayout>
  );
}
