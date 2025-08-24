import { Metadata } from "next";
import SignUpClient from "./signup-client";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create your account to get started.",
};

export default function SignUpPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignUpClient />
    </Suspense>
  );
}
