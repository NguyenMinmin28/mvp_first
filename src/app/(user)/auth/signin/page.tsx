import { Metadata } from "next";
import SignInClient from "./signin-client";
import { Suspense } from "react";
import { getServerSessionUser } from "@/features/auth/auth-server";
import { UserLayout } from "@/features/shared/components/user-layout";

export const metadata: Metadata = {
  title: "Login to Clevrs – Access Your Projects & Freelancers",
  description:
    "Sign in to your Clevrs account to manage your projects, connect with freelancers, and access all platform features.",
};

export default async function SignInPage() {
  const user = await getServerSessionUser();

  return (
    <UserLayout user={user}>
      <Suspense fallback={<div></div>}>
        <SignInClient />
      </Suspense>
    </UserLayout>
  );
}
