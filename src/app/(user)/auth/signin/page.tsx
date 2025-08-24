import { Metadata } from "next";
import SignInClient from "./signin-client";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your App account to manage your tasks.",
};

export default function SignInPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInClient />
    </Suspense>
  );
}
