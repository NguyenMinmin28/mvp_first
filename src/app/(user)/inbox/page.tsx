"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { UserLayout } from "@/features/shared/components/user-layout";
import { LoadingSpinner } from "@/ui/components/loading-spinner";
import DeveloperInbox from "@/features/developer/components/developer-inbox";

export default function InboxPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/auth/signin");
      return;
    }

    if (session.user?.role !== "DEVELOPER") {
      router.push("/");
      return;
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!session || session.user?.role !== "DEVELOPER") {
    return null;
  }

  return (
    <UserLayout user={session.user}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Project Invitations
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Review and respond to project invitations
            </p>
          </div>
          
          <DeveloperInbox />
        </div>
      </div>
    </UserLayout>
  );
}
