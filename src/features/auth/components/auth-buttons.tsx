"use client";

import { signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

import { Button } from "@/ui/components/button";

export function SignInButton() {
  return <Button onClick={() => signIn("google")}>Sign in with Google</Button>;
}

export function SignOutButton() {
  const router = useRouter();
  
  return (
    <Button
      variant="outline"
      onClick={async () => {
        try {
          // SignOut first and wait briefly
          await signOut({ redirect: false });
          await new Promise(resolve => setTimeout(resolve, 100));
          router.push("/");
        } catch (error) {
          console.error("Sign out error:", error);
          if (typeof window !== "undefined") {
            window.location.href = "/";
          }
        }
      }}
    >
      Sign Out
    </Button>
  );
}
