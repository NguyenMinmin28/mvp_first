import { Metadata } from "next";
import SignUpClient from "./signup-client";
import { Suspense } from "react";
import { getServerSessionUser } from "@/features/auth/auth-server";
import { UserLayout } from "@/features/shared/components/user-layout";

export const metadata: Metadata = {
  title: "Join Clevrs – Create Your Free Account Today",
  description:
    "Create your free Clevrs account and start connecting directly with skilled freelancers or clients. No commissions, no middlemen.",
};

export default async function SignUpPage() {
  const user = await getServerSessionUser();

  return (
    <UserLayout user={user}>
      <Suspense fallback={<div></div>}>
        <SignUpClient />
      </Suspense>
    </UserLayout>
  );
}
