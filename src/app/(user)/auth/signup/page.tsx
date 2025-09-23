import { Metadata } from "next";
import SignUpClient from "./signup-client";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Join Clevrs – Create Your Free Account Today",
  description:
    "Create your free Clevrs account and start connecting directly with skilled freelancers or clients. No commissions, no middlemen.",
};

export default function SignUpPage() {
  return (
    <Suspense fallback={<div></div>}>
      <SignUpClient />
    </Suspense>
  );
}
