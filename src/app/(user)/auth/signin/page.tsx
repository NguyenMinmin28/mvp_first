import { Metadata } from "next";
import SignInClient from "./signin-client";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Login to Clevrs – Access Your Projects & Freelancers",
  description:
    "Sign in to your Clevrs account to manage your projects, connect with freelancers, and access all platform features.",
};

export default function SignInPage() {
  return (
    <Suspense fallback={<div></div>}>
      <SignInClient />
    </Suspense>
  );
}
