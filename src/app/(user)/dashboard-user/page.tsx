"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { UserLayout } from "@/features/shared/components/user-layout";
import ProfileSummary from "@/features/developer/components/dashboard/profile-summary";
import IdeaSparkList from "@/features/developer/components/dashboard/ideaspark-list";
import ProjectStatusFilter from "@/features/developer/components/project-status-filter";
import type { ProjectStatus } from "@/features/developer/components/project-status-filter";
import AssignedProjectsList from "@/features/developer/components/dashboard/assigned-projects-list";

interface UserIdeaSummary {
  id: string;
  title: string;
  summary: string;
  createdAt: string;
  _count: {
    likes: number;
    comments: number;
    bookmarks: number;
  };
}

export default function DashboardUserPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [ideas, setIdeas] = useState<UserIdeaSummary[]>([]);
  const [projectStatus, setProjectStatus] = useState<ProjectStatus>("IN_PROGRESS");

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) {
      router.push("/auth/signin");
      return;
    }
    // Only allow developers here for now
    if (session.user.role !== "DEVELOPER") {
      router.push("/");
      return;
    }
    load();
  }, [status, session, router]);

  const load = async () => {
    try {
      setIsLoading(true);
      const [meRes, myIdeasRes] = await Promise.all([
        fetch("/api/user/me", { cache: "no-store" }),
        fetch("/api/user/my-ideas?limit=6", { cache: "no-store" }),
      ]);
      if (meRes.ok) {
        const data = await meRes.json();
        setProfile(data.user);
      }
      if (myIdeasRes.ok) {
        const data = await myIdeasRes.json();
        setIdeas(Array.isArray(data.ideas) ? data.ideas : []);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  if (!session?.user) return null;

  return (
    <UserLayout user={session.user}>
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <ProfileSummary profile={profile} />
            <div className="mt-6">
              <ProjectStatusFilter value={projectStatus} onChange={setProjectStatus} />
            </div>
            <div className="mt-4">
              <AssignedProjectsList filter={projectStatus} />
            </div>
          </div>
          <div className="lg:col-span-1">
            <IdeaSparkList />
          </div>
        </div>
      </div>
    </UserLayout>
  );
}


