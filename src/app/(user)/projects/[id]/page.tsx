"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { UserLayout } from "@/features/shared/components/user-layout";
import { LoadingSpinner } from "@/ui/components/loading-spinner";
import ProjectAssignmentView from "@/features/projects/components/project-assignment-view";

interface Props {
  params: { id: string };
}

export default function ProjectPage({ params }: Props) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/auth/signin");
      return;
    }

    if (session.user?.role !== "CLIENT") {
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

  if (!session || session.user?.role !== "CLIENT") {
    return null;
  }

  return (
    <UserLayout user={session.user}>
      <div className="container mx-auto px-4 py-8">
        <ProjectAssignmentView projectId={params.id} />
      </div>
    </UserLayout>
  );
}
