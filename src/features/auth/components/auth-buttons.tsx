"use client";

import { signIn, signOut } from "next-auth/react";

import { Button } from "@/ui/components/button";

export function SignInButton() {
  return <Button onClick={() => signIn("google")}>Sign in with Google</Button>;
}

export function SignOutButton() {
  return (
    <Button variant="outline" onClick={() => signOut()}>
      Sign Out
    </Button>
  );
}
